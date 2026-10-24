import { sql } from './db.js';
import { getLibrarySummary } from './library.js';
import { getYearStats } from './stats.js';
import { getUser } from './users.js';

/** Profil visible par lien : `null` s'il n'existe pas ou n'a pas été rendu public. */
export async function getPublicProfile(steamid, year, tzOffset) {
  const user = await getUser(steamid);
  if (!user?.public_profile) return null;
  const [stats, library] = await Promise.all([getYearStats(steamid, year, tzOffset), getLibrarySummary(steamid)]);
  return {
    user: { steamid: user.steamid64, pseudo: user.pseudo, avatar: user.avatar },
    // Uniquement des agrégats : ni sessions détaillées, ni statut en direct.
    stats: { ...stats, library },
  };
}

function compatibilityLabel(score) {
  if (score >= 80) return 'Âmes sœurs du jeu';
  if (score >= 60) return 'Duo de choc';
  if (score >= 40) return 'Bonne entente';
  if (score >= 20) return 'Goûts différents';
  return 'Opposés complets';
}

/**
 * Similarité cosinus entre deux bibliothèques, pondérée par le temps de jeu (en log,
 * pour qu'un jeu à 2 000 h n'écrase pas tout le reste). 100 = mêmes jeux, mêmes proportions.
 */
function compatibility(mine, theirs) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const appid of new Set([...mine.keys(), ...theirs.keys()])) {
    const a = Math.log1p(mine.get(appid) ?? 0);
    const b = Math.log1p(theirs.get(appid) ?? 0);
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  return normA && normB ? Math.round((dot / Math.sqrt(normA * normB)) * 100) : 0;
}

async function playedGames(steamid) {
  const rows = await sql`
    SELECT appid, name, playtime_minutes AS minutes FROM playtrace.owned_games
    WHERE steamid64 = ${steamid} AND playtime_minutes > 0
  `;
  return new Map(rows.map((row) => [row.appid, row]));
}

async function duelSide(steamid, year, tzOffset) {
  const [user, stats, library, games] = await Promise.all([
    getUser(steamid),
    getYearStats(steamid, year, tzOffset),
    getLibrarySummary(steamid),
    playedGames(steamid),
  ]);
  return { user: { steamid: user.steamid64, pseudo: user.pseudo, avatar: user.avatar }, stats: { ...stats, library }, games };
}

/** Duel entre le joueur connecté et un profil public : chiffres face à face, jeux en commun, compatibilité. */
export async function getDuel(viewerId, targetId, year, tzOffset) {
  const target = await getUser(targetId);
  if (!target?.public_profile) return null;

  const [me, them] = await Promise.all([duelSide(viewerId, year, tzOffset), duelSide(targetId, year, tzOffset)]);
  const minutes = (side) => new Map([...side.games.values()].map((game) => [game.appid, game.minutes]));
  const score = compatibility(minutes(me), minutes(them));

  const common = [...me.games.values()]
    .filter((game) => them.games.has(game.appid))
    .map((game) => ({ appid: game.appid, name: game.name, mine: game.minutes, theirs: them.games.get(game.appid).minutes }))
    .sort((a, b) => Math.min(b.mine, b.theirs) - Math.min(a.mine, a.theirs));
  const suggestions = [...them.games.values()]
    .filter((game) => !me.games.has(game.appid))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 6);

  const strip = ({ user, stats }) => ({ user, stats });
  return {
    me: strip(me),
    them: strip(them),
    compatibility: { score, label: compatibilityLabel(score) },
    common: common.slice(0, 12),
    commonCount: common.length,
    suggestions,
  };
}
