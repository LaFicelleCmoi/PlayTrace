const STEAM_CDN = 'https://cdn.cloudflare.steamstatic.com/steam/apps';

/** Visuels Steam d'un jeu : `header` (paysage), `capsule` (jaquette), `hero` (bannière). */
export function gameArt(appid, kind = 'header') {
  const file = { header: 'header.jpg', capsule: 'library_600x900.jpg', hero: 'library_hero.jpg' }[kind];
  return `${STEAM_CDN}/${appid}/${file}`;
}

const number = new Intl.NumberFormat('fr-FR');

export function formatNumber(value, decimals = 0) {
  if (decimals === 0) return number.format(Math.round(value));
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

/** 5400 → « 1 h 30 min », 90 → « 1 min », 20 → « 20 s ». */
export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) return minutes > 0 ? `${number.format(hours)} h ${String(minutes).padStart(2, '0')} min` : `${number.format(hours)} h`;
  if (minutes > 0) return `${minutes} min`;
  return `${total} s`;
}

/** Chronomètre « 01:23:45 ». */
export function formatClock(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export function formatDate(iso, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat('fr-FR', options).format(new Date(iso));
}

export function formatDateTime(iso) {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}
