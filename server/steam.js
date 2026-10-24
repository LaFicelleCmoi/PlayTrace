import { config } from './config.js';

const API_BASE = 'https://api.steampowered.com';
const MAX_IDS_PER_CALL = 100;

async function call(path, params) {
  const url = new URL(path, API_BASE);
  url.search = new URLSearchParams({ key: config.steamApiKey, format: 'json', ...params });
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
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
