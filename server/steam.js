import { config } from './config.js';

const API_BASE = 'https://api.steampowered.com';
const MAX_IDS_PER_CALL = 100;

async function request(path, params) {
  const url = new URL(path, API_BASE);
  url.search = new URLSearchParams({ key: config.steamApiKey, format: 'json', ...params });
  return fetch(url, { signal: AbortSignal.timeout(10_000) });
}

async function call(path, params) {
  const res = await request(path, params);
  // L'URL contient la clé : on ne la met jamais dans le message d'erreur.
  if (!res.ok) throw new Error(`API Steam ${path} : HTTP ${res.status}`);
  return res.json();
}

/** Profils + jeu en cours (`gameid`, `gameextrainfo`) pour une liste de SteamID64. */
export async function getPlayerSummaries(steamids) {
  const players = [];
  for (let i = 0; i < steamids.length; i += MAX_IDS_PER_CALL) {
    const chunk = steamids.slice(i, i + MAX_IDS_PER_CALL);
    const data = await call('/ISteamUser/GetPlayerSummaries/v2/', { steamids: chunk.join(',') });
    players.push(...(data.response?.players ?? []));
  }
  return players;
}

/** Bibliothèque du joueur. Liste vide si les détails des jeux sont privés. */
export async function getOwnedGames(steamid) {
  const data = await call('/IPlayerService/GetOwnedGames/v1/', {
    steamid,
    include_appinfo: '1',
    include_played_free_games: '1',
  });
  return data.response?.games ?? [];
}

/**
 * Succès du joueur pour un jeu. Steam répond 403 si le profil est privé
 * et 400 si le jeu n'a pas de succès : on renvoie alors `{ error }` plutôt que de lever.
 */
export async function getPlayerAchievements(steamid, appid) {
  const res = await request('/ISteamUserStats/GetPlayerAchievements/v1/', { steamid, appid, l: 'french' });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.playerstats?.success) return { achievements: data.playerstats.achievements ?? [] };
  if (res.status === 403) return { error: 'private' };
  if (res.status === 400) return { error: 'none' };
  throw new Error(`API Steam GetPlayerAchievements : HTTP ${res.status}`);
}

/** Liste des succès d'un jeu (noms, descriptions, icônes), en français. */
export async function getAchievementSchema(appid) {
  const data = await call('/ISteamUserStats/GetSchemaForGame/v2/', { appid, l: 'french' });
  return data.game?.availableGameStats?.achievements ?? [];
}

/** Pourcentage mondial de joueurs ayant obtenu chaque succès. */
export async function getAchievementRarity(appid) {
  const res = await fetch(
    `${API_BASE}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appid}&format=json`,
    { signal: AbortSignal.timeout(10_000) },
  );
  if (res.status === 403 || res.status === 404) return {};
  if (!res.ok) throw new Error(`API Steam GetGlobalAchievementPercentagesForApp : HTTP ${res.status}`);
  const data = await res.json();
  return Object.fromEntries((data.achievementpercentages?.achievements ?? []).map((a) => [a.name, Number(a.percent)]));
}

/** Fiche Store (API non officielle, limitée à ~200 requêtes / 5 min : à mettre en cache). */
export async function getStoreDetails(appid) {
  const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&l=french&cc=fr`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Store Steam : HTTP ${res.status}`);
  const entry = (await res.json())?.[appid];
  return entry?.success ? entry.data : null;
}

const ASSET_FIELDS = { capsule: ['library_capsule_2x', 'library_capsule'], header: ['header'], hero: ['library_hero'] };

/**
 * Chemins des visuels de plusieurs jeux (API Store, sans clé). Les jeux récents ont des
 * fichiers préfixés par un hash : l'ancien chemin `steam/apps/{appid}/header.jpg` y renvoie 404.
 */
export async function getStoreAssets(appids) {
  const input = {
    ids: appids.map((appid) => ({ appid })),
    context: { language: 'french', country_code: 'FR' },
    data_request: { include_assets: true },
  };
  const url = `${API_BASE}/IStoreBrowseService/GetItems/v1/?input_json=${encodeURIComponent(JSON.stringify(input))}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`API Steam GetItems : HTTP ${res.status}`);
  const items = (await res.json()).response?.store_items ?? [];

  const assets = new Map();
  for (const item of items) {
    const format = item.assets?.asset_url_format;
    const paths = {};
    for (const [kind, fields] of Object.entries(ASSET_FIELDS)) {
      const file = fields.map((field) => item.assets?.[field]).find(Boolean);
      if (format && file) paths[kind] = format.replace('${FILENAME}', file);
    }
    assets.set(item.id, paths);
  }
  return assets;
}
