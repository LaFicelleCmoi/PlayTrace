/**
 * Visuels Steam d'un jeu : `header` (paysage), `capsule` (jaquette), `hero` (bannière).
 * Le serveur redirige vers la bonne URL du CDN (les jeux récents ont des chemins avec hash).
 */
export function gameArt(appid, kind = 'header') {
  return `/api/art/${appid}/${kind}`;
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

const BYTE_UNITS = ['o', 'Ko', 'Mo', 'Go', 'To'];

/** 1536 → « 1,5 Ko ». */
export function formatBytes(bytes) {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${formatNumber(value, unit === 0 || value >= 100 ? 0 : 1)} ${BYTE_UNITS[unit]}`;
}

export function formatSpeed(bytesPerSecond) {
  return `${formatBytes(bytesPerSecond)}/s`;
}

const relative = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
const RELATIVE_STEPS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** « il y a 3 jours », « hier »… */
export function formatRelative(iso) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'à l’instant';
}
