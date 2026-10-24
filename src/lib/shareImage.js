import { gameArt } from '@/lib/format';

// Image au format story (9:16), prête à poster sur Instagram, Discord ou X.
const WIDTH = 1080;
const HEIGHT = 1920;
const FONT = '"Inter Variable", Inter, system-ui, sans-serif';
const NEON = ['#22d3ee', '#a78bfa', '#f472b6'];

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    // Le CDN Steam renvoie Access-Control-Allow-Origin: * : le canvas reste exportable.
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function neonGradient(ctx, x0, x1) {
  const gradient = ctx.createLinearGradient(x0, 0, x1, 0);
  NEON.forEach((color, index) => gradient.addColorStop(index / (NEON.length - 1), color));
  return gradient;
}

function glow(ctx, x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

/** Coupe le texte avec « … » s'il dépasse `maxWidth`. */
function fit(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

/** Découpe en lignes (2 max) pour les noms de jeux longs. */
function wrap(ctx, text, maxWidth, maxLines = 2) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = fit(ctx, `${lines[maxLines - 1]}…`, maxWidth);
  }
  return lines;
}

function hours(seconds) {
  const value = seconds / 3600;
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value);
}

/** Dessine le Wrapped en PNG 1080 × 1920 et renvoie un Blob. */
export async function renderWrappedImage({ user, stats, insights }) {
  await document.fonts.load(`900 120px ${FONT}`);
  await document.fonts.load(`500 40px ${FONT}`);

  const goty = stats.gameOfTheYear ?? (stats.library.topGames[0] && { ...stats.library.topGames[0], seconds: stats.library.topGames[0].minutes * 60 });
  const [avatar, capsule] = await Promise.all([
    user.avatar ? loadImage(user.avatar) : null,
    goty ? loadImage(gameArt(goty.appid, 'capsule')) : null,
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  // Fond : nuit profonde, halos néon et grille.
  ctx.fillStyle = '#07070c';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  glow(ctx, 120, 260, 700, 'rgba(167, 139, 250, 0.35)');
  glow(ctx, 1000, 900, 650, 'rgba(34, 211, 238, 0.22)');
  glow(ctx, 300, 1750, 700, 'rgba(244, 114, 182, 0.28)');
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  const margin = 90;
  ctx.textBaseline = 'alphabetic';

  // En-tête : joueur et année.
  if (avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(margin + 45, 175, 45, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, margin, 130, 90, 90);
    ctx.restore();
  }
  ctx.fillStyle = '#f4f4f5';
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText(fit(ctx, user.pseudo, 600), margin + (avatar ? 115 : 0), 172);
  ctx.fillStyle = 'rgba(244, 244, 245, 0.55)';
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText('PLAYTRACE  ·  STEAM WRAPPED', margin + (avatar ? 115 : 0), 212);

  ctx.fillStyle = '#f4f4f5';
  ctx.font = `900 92px ${FONT}`;
  ctx.fillText(`Mon ${stats.year}`, margin, 370);
  ctx.fillStyle = neonGradient(ctx, margin, WIDTH - margin);
  ctx.fillText('sur Steam', margin, 470);

  // Le grand chiffre.
  const tracked = stats.totals.trackedSeconds;
  const bigSeconds = tracked || stats.library.totalMinutes * 60;
  ctx.font = `900 250px ${FONT}`;
  ctx.fillStyle = neonGradient(ctx, margin, margin + 700);
  const big = `${hours(bigSeconds)} h`;
  ctx.fillText(big, margin - 8, 730);
  ctx.fillStyle = 'rgba(244, 244, 245, 0.75)';
  ctx.font = `500 36px ${FONT}`;
  ctx.fillText(
    tracked
      ? `de jeu · ${stats.totals.sessions} session${stats.totals.sessions > 1 ? 's' : ''} · ${stats.totals.games} jeu${stats.totals.games > 1 ? 'x' : ''}`
      : 'au compteur Steam',
    margin,
    800,
  );

  // Jeu de l'année.
  let y = 850;
  if (goty) {
    roundRect(ctx, margin, y, WIDTH - margin * 2, 360, 36);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const coverWidth = 200;
    const coverHeight = 300;
    if (capsule) {
      ctx.save();
      roundRect(ctx, margin + 30, y + 30, coverWidth, coverHeight, 20);
      ctx.clip();
      ctx.drawImage(capsule, margin + 30, y + 30, coverWidth, coverHeight);
      ctx.restore();
    }
    const textX = margin + 30 + (capsule ? coverWidth + 40 : 10);
    const textWidth = WIDTH - margin - 30 - textX;
    ctx.fillStyle = '#f472b6';
    ctx.font = `700 26px ${FONT}`;
    ctx.fillText(stats.gameOfTheYear ? `JEU DE L’ANNÉE ${stats.year}` : 'TON JEU LE PLUS JOUÉ', textX, y + 80);
    ctx.fillStyle = '#f4f4f5';
    ctx.font = `900 52px ${FONT}`;
    wrap(ctx, goty.name.trim(), textWidth).forEach((line, index) => ctx.fillText(line, textX, y + 145 + index * 58));
    ctx.fillStyle = neonGradient(ctx, textX, textX + 300);
    ctx.font = `900 68px ${FONT}`;
    ctx.fillText(`${hours(goty.seconds)} h`, textX, y + 290);
    if (stats.gameOfTheYear) {
      ctx.fillStyle = 'rgba(244, 244, 245, 0.6)';
      ctx.font = `500 28px ${FONT}`;
      ctx.fillText(`${Math.round(stats.gameOfTheYear.share * 100)} % de ton temps`, textX, y + 328);
    }
    y += 410;
  }

  // Top 5.
  const top = (stats.topGames.length ? stats.topGames : stats.library.topGames.map((game) => ({ ...game, seconds: game.minutes * 60 }))).slice(0, 5);
  if (top.length > 1) {
    ctx.fillStyle = 'rgba(244, 244, 245, 0.55)';
    ctx.font = `700 26px ${FONT}`;
    ctx.fillText('TOP 5', margin, y + 10);
    top.forEach((game, index) => {
      const rowY = y + 62 + index * 56;
      ctx.fillStyle = NEON[index] ?? 'rgba(244, 244, 245, 0.45)';
      ctx.font = `900 40px ${FONT}`;
      ctx.fillText(String(index + 1), margin, rowY);
      ctx.fillStyle = '#f4f4f5';
      ctx.font = `600 36px ${FONT}`;
      ctx.fillText(fit(ctx, game.name.trim(), 640), margin + 60, rowY);
      ctx.fillStyle = 'rgba(244, 244, 245, 0.6)';
      ctx.font = `500 32px ${FONT}`;
      const label = `${hours(game.seconds)} h`;
      ctx.fillText(label, WIDTH - margin - ctx.measureText(label).width, rowY);
    });
    y += 62 + top.length * 56;
  }

  // Personnalité, calée au-dessus de la signature.
  const personaY = HEIGHT - 290;
  ctx.fillStyle = 'rgba(244, 244, 245, 0.55)';
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText('MA PERSONNALITÉ DE JOUEUR', margin, personaY);
  ctx.fillStyle = neonGradient(ctx, margin, WIDTH - margin);
  ctx.font = `900 70px ${FONT}`;
  ctx.fillText(fit(ctx, insights.persona.title, WIDTH - margin * 2), margin, personaY + 85);
  ctx.fillStyle = 'rgba(244, 244, 245, 0.6)';
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText(`${insights.earned.length} badge${insights.earned.length > 1 ? 's' : ''} PlayTrace débloqué${insights.earned.length > 1 ? 's' : ''}`, margin, personaY + 135);

  // Signature.
  ctx.fillStyle = 'rgba(244, 244, 245, 0.45)';
  ctx.font = `500 28px ${FONT}`;
  const site = window.location.host;
  ctx.fillText(site, WIDTH - margin - ctx.measureText(site).width, HEIGHT - 60);
  ctx.fillStyle = neonGradient(ctx, margin, margin + 300);
  ctx.font = `900 34px ${FONT}`;
  ctx.fillText('PlayTrace', margin, HEIGHT - 60);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.moveTo(margin, HEIGHT - 120);
  ctx.lineTo(WIDTH - margin, HEIGHT - 120);
  ctx.stroke();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Export de l’image impossible'))), 'image/png');
  });
}

/** Partage natif si le navigateur sait partager des fichiers (mobile), sinon téléchargement. */
export async function shareOrDownload(blob, year) {
  const file = new File([blob], `playtrace-wrapped-${year}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Mon ${year} sur Steam`, text: 'Mon Wrapped PlayTrace 🎮' });
      return 'shared';
    } catch (error) {
      if (error.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
