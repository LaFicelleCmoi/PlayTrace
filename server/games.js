import { sql } from './db.js';
import { ensureLibrary } from './library.js';
import { getAchievementRarity, getAchievementSchema, getPlayerAchievements, getStoreAssets, getStoreDetails } from './steam.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = { store: 7 * DAY_MS, schema: 7 * DAY_MS, rarity: DAY_MS, assets: 7 * DAY_MS };
const ASSETS_BATCH = 100;
const ART_CDN = 'https://shared.akamai.steamstatic.com/store_item_assets/';
const LEGACY_ART = { capsule: 'library_600x900.jpg', header: 'header.jpg', hero: 'library_hero.jpg' };
export const ART_KINDS = Object.keys(LEGACY_ART);

// Durée d'une session ; pour la session en cours, temps écoulé jusqu'à maintenant.
const DURATION = sql`COALESCE(duration_s, GREATEST(0, EXTRACT(EPOCH FROM now() - started_at))::int)`;

/**
 * Données Steam communes à tous les joueurs, gardées en base. Si Steam ne répond pas,
 * on sert la dernière version connue plutôt que rien.
 */
async function cached(appid, kind, load) {
  const [row] = await sql`SELECT data, fetched_at FROM playtrace.game_cache WHERE appid = ${appid} AND kind = ${kind}`;
  if (row && Date.now() - new Date(row.fetched_at).getTime() < CACHE_TTL_MS[kind]) return row.data;
  try {
    const data = await load();
    await sql`
      INSERT INTO playtrace.game_cache (appid, kind, data, fetched_at) VALUES (${appid}, ${kind}, ${sql.json(data)}, now())
      ON CONFLICT (appid, kind) DO UPDATE SET data = excluded.data, fetched_at = excluded.fetched_at
    `;
    return data;
  } catch (error) {
    console.error(`[games] ${kind} ${appid} :`, error.message);
    return row?.data ?? null;
  }
}

const ENTITIES = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };

/** Le Store renvoie parfois des entités HTML ; on n'affiche que du texte brut. */
function plainText(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#\d+|[a-z]+);/gi, (match, entity) =>
      entity.startsWith('#') ? String.fromCodePoint(Number(entity.slice(1))) : (ENTITIES[entity.toLowerCase()] ?? match),
    )
    .trim();
}

function summarizeStore(store) {
  if (!store) return null;
  return {
    name: store.name,
    shortDescription: plainText(store.short_description),
    genres: (store.genres ?? []).map((genre) => genre.description),
    developers: store.developers ?? [],
    publishers: store.publishers ?? [],
    releaseDate: store.release_date?.date ?? null,
    metacritic: store.metacritic?.score ?? null,
    isFree: Boolean(store.is_free),
  };
}

function mergeAchievements(schema, rarity, player) {
  // Profil privé : on montre quand même la liste des succès du jeu et leur rareté, sans savoir lesquels sont obtenus.
  const unlocked = new Map((player.achievements ?? []).map((achievement) => [achievement.apiname, achievement]));
  // Sans schéma (jeu retiré du Store…), on se contente des infos renvoyées avec les succès du joueur.
  const base = schema.length
    ? schema
    : (player.achievements ?? []).map((achievement) => ({
        name: achievement.apiname,
        displayName: achievement.name,
        description: achievement.description,
      }));
  if (base.length === 0) return { status: 'none', total: 0, unlocked: 0, items: [] };

  const items = base.map((achievement) => {
    const progress = unlocked.get(achievement.name);
    const achieved = progress?.achieved === 1;
    return {
      apiName: achievement.name,
      name: achievement.displayName || progress?.name || achievement.name,
      description: achievement.description || progress?.description || '',
      hidden: achievement.hidden === 1,
      icon: achievement.icon ?? null,
      iconGray: achievement.icongray ?? achievement.icon ?? null,
      achieved,
      unlockedAt: achieved && progress.unlocktime ? new Date(progress.unlocktime * 1000).toISOString() : null,
      percent: Number.isFinite(rarity?.[achievement.name]) ? rarity[achievement.name] : null,
    };
  });
  const status = player.error === 'private' ? 'private' : 'ok';
  return { status, total: items.length, unlocked: items.filter((item) => item.achieved).length, items };
}

/** Met en cache, en une requête par lot de 100, les visuels des jeux qui ne le sont pas encore. */
export async function ensureArt(appids) {
  if (appids.length === 0) return;
  const fresh = await sql`
    SELECT appid FROM playtrace.game_cache
    WHERE kind = 'assets' AND appid IN ${sql(appids)} AND fetched_at > ${new Date(Date.now() - CACHE_TTL_MS.assets)}
  `;
  const known = new Set(fresh.map((row) => row.appid));
  const missing = appids.filter((appid) => !known.has(appid));

  for (let i = 0; i < missing.length; i += ASSETS_BATCH) {
    const chunk = missing.slice(i, i + ASSETS_BATCH);
    try {
      const assets = await getStoreAssets(chunk);
      // Même un jeu introuvable est mémorisé (objet vide) pour ne pas redemander à chaque image.
      const rows = chunk.map((appid) => ({ appid, kind: 'assets', data: assets.get(appid) ?? {}, fetched_at: new Date() }));
      await sql`
        INSERT INTO playtrace.game_cache ${sql(rows)}
        ON CONFLICT (appid, kind) DO UPDATE SET data = excluded.data, fetched_at = excluded.fetched_at
      `;
    } catch (error) {
      console.error('[games] visuels :', error.message);
    }
  }
}

/** URL du visuel `kind` d'un jeu, avec repli sur l'ancien chemin du CDN. */
export async function getArtUrl(appid, kind) {
  await ensureArt([appid]);
  const [row] = await sql`SELECT data FROM playtrace.game_cache WHERE appid = ${appid} AND kind = 'assets'`;
  const path = row?.data?.[kind];
  return path ? `${ART_CDN}${path}` : `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/${LEGACY_ART[kind]}`;
}

/** Fiche complète d'un jeu pour un joueur : Store, temps de jeu, sessions et succès. */
export async function getGameDetail(steamid, appid) {
  const [[owned], [tracked], sessions, store, schema, rarity, player] = await Promise.all([
    sql`
      SELECT name, playtime_minutes AS "playtimeMinutes", last_played AS "lastPlayed"
      FROM playtrace.owned_games WHERE steamid64 = ${steamid} AND appid = ${appid}
    `,
    sql`
      SELECT COALESCE(SUM(dur), 0)::int AS "totalSeconds", COUNT(*)::int AS sessions,
             MAX(dur)::int AS "longestSeconds", MIN(started_at) AS "firstSession", MAX(started_at) AS "lastSession",
             MAX(game_name) AS name
      FROM (SELECT started_at, game_name, ${DURATION} AS dur FROM playtrace.sessions
            WHERE steamid64 = ${steamid} AND appid = ${appid}) s
    `,
    sql`
      SELECT id, appid, game_name, started_at, ended_at, duration_s FROM playtrace.sessions
      WHERE steamid64 = ${steamid} AND appid = ${appid} ORDER BY started_at DESC LIMIT 20
    `,
    cached(appid, 'store', () => getStoreDetails(appid)),
    cached(appid, 'schema', () => getAchievementSchema(appid)),
    cached(appid, 'rarity', () => getAchievementRarity(appid)),
    getPlayerAchievements(steamid, appid).catch((error) => {
      console.error(`[games] succès ${appid} :`, error.message);
      return { error: 'unavailable' };
    }),
  ]);

  const storeInfo = summarizeStore(store);
  const name = (owned?.name ?? storeInfo?.name ?? tracked.name ?? '').trim() || null;
  if (!name) return null;

  const achievements = mergeAchievements(schema ?? [], rarity, player);
  if (player.error === 'unavailable' && achievements.status === 'ok') achievements.status = 'unavailable';

  return {
    appid,
    name,
    owned: Boolean(owned),
    playtimeMinutes: owned?.playtimeMinutes ?? 0,
    lastPlayed: owned?.lastPlayed ?? tracked.lastSession ?? null,
    store: storeInfo,
    tracked: { ...tracked, name: undefined },
    achievements,
    sessions: sessions.map((session) => ({ ...session, id: Number(session.id), live: session.ended_at === null })),
  };
}

/** Bibliothèque du joueur, avec le temps suivi par PlayTrace pour chaque jeu. */
export async function getLibraryGames(steamid) {
  await ensureLibrary(steamid);
  const [owned, tracked] = await Promise.all([
    sql`
      SELECT appid, name, playtime_minutes AS minutes, last_played AS "lastPlayed"
      FROM playtrace.owned_games WHERE steamid64 = ${steamid}
    `,
    sql`
      SELECT appid, MAX(game_name) AS name, SUM(${DURATION})::int AS seconds, MAX(started_at) AS "lastSession"
      FROM playtrace.sessions WHERE steamid64 = ${steamid} GROUP BY appid
    `,
  ]);

  // Les visuels de toute la bibliothèque sont résolus d'un coup, avant que la grille ne les demande un par un.
  await ensureArt([...new Set([...owned, ...tracked].map((game) => game.appid))]);

  const trackedById = new Map(tracked.map((game) => [game.appid, game]));
  const games = owned.map((game) => {
    const extra = trackedById.get(game.appid);
    trackedById.delete(game.appid);
    return { ...game, trackedSeconds: extra?.seconds ?? 0, lastPlayed: game.lastPlayed ?? extra?.lastSession ?? null };
  });
  // Jeux joués mais absents de la bibliothèque (week-end gratuit, partage familial…).
  for (const game of trackedById.values()) {
    games.push({ appid: game.appid, name: game.name, minutes: 0, lastPlayed: game.lastSession, trackedSeconds: game.seconds });
  }
  return games;
}
