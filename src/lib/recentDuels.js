// Derniers duels du joueur, gardés dans son navigateur (simple confort : rien n'est envoyé au serveur).
const KEY = 'playtrace:recent-duels';
const MAX = 8;

export function readRecentDuels() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function rememberDuel(duel) {
  try {
    const list = readRecentDuels().filter((item) => item.steamid !== duel.steamid);
    localStorage.setItem(KEY, JSON.stringify([{ ...duel, at: new Date().toISOString() }, ...list].slice(0, MAX)));
  } catch {
    // Stockage indisponible (navigation privée…) : tant pis pour l'historique.
  }
}
