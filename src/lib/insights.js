import { CalendarCheck, Crown, Flame, Footprints, Gamepad2, Moon, Sunrise, Swords, Timer, Trophy } from 'lucide-react';

const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const HOUR = 3600;

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function indexOfMax(values) {
  return values.reduce((best, value, index) => (value > values[best] ? index : best), 0);
}

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Plus longue série de jours consécutifs joués, et série en cours (aujourd'hui ou hier inclus). */
function streaks(daily) {
  const played = new Set(daily.filter((day) => day.seconds > 0).map((day) => day.day));
  let longest = 0;
  let run = 0;
  let previous = null;
  for (const day of [...played].sort()) {
    const date = new Date(`${day}T12:00:00`);
    run = previous && (date - previous) / 86_400_000 === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }

  let current = 0;
  const cursor = new Date();
  if (!played.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (played.has(dayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { longest, current };
}

/**
 * Badges PlayTrace : obtenus ou à débloquer, avec la règle affichée au joueur.
 * `progress` (0 → 1) sert à montrer où il en est pour ceux qui manquent.
 */
function badges(insight, stats) {
  const { totals, gameOfTheYear } = stats;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  return [
    {
      id: 'first',
      icon: Footprints,
      color: '#22d3ee',
      title: 'Premier pas',
      rule: 'Termine ta première session suivie',
      progress: clamp(totals.sessions),
    },
    {
      id: 'night',
      icon: Moon,
      color: '#a78bfa',
      title: 'Oiseau de nuit',
      rule: 'Joue un quart de ton temps entre minuit et 5 h',
      progress: clamp(insight.nightShare / 0.25),
    },
    {
      id: 'early',
      icon: Sunrise,
      color: '#fbbf24',
      title: 'Lève-tôt',
      rule: 'Joue un cinquième de ton temps entre 5 h et 9 h',
      progress: clamp(insight.morningShare / 0.2),
    },
    {
      id: 'weekend',
      icon: Swords,
      color: '#f472b6',
      title: 'Guerrier du week-end',
      rule: 'Joue la moitié de ton temps le samedi et le dimanche',
      progress: clamp(insight.weekendShare / 0.5),
    },
    {
      id: 'marathon',
      icon: Timer,
      color: '#f43f5e',
      title: 'Marathonien',
      rule: 'Enchaîne 4 heures de jeu d’une traite',
      progress: clamp((totals.longest?.seconds ?? 0) / (4 * HOUR)),
    },
    {
      id: 'loyal',
      icon: Crown,
      color: '#facc15',
      title: 'Monogame',
      rule: 'Consacre la moitié de ton temps à un seul jeu (10 h minimum)',
      progress: Math.min(clamp((gameOfTheYear?.share ?? 0) / 0.5), clamp(totals.trackedSeconds / (10 * HOUR))),
    },
    {
      id: 'explorer',
      icon: Gamepad2,
      color: '#34d399',
      title: 'Explorateur',
      rule: 'Lance 10 jeux différents dans l’année',
      progress: clamp(totals.games / 10),
    },
    {
      id: 'streak',
      icon: Flame,
      color: '#fb923c',
      title: 'Inarrêtable',
      rule: 'Joue 7 jours d’affilée',
      progress: clamp(insight.longestStreak / 7),
    },
    {
      id: 'regular',
      icon: CalendarCheck,
      color: '#60a5fa',
      title: 'Habitué',
      rule: 'Joue 30 jours différents dans l’année',
      progress: clamp(insight.activeDays / 30),
    },
    {
      id: 'centurion',
      icon: Trophy,
      color: '#e879f9',
      title: 'Centurion',
      rule: 'Atteins 100 heures de jeu suivies',
      progress: clamp(totals.trackedSeconds / (100 * HOUR)),
    },
  ].map((badge) => ({ ...badge, earned: badge.progress >= 1 }));
}

/** Titre de joueur, tiré du badge le plus marquant obtenu. */
function persona(earned, insight) {
  const byId = Object.fromEntries(earned.map((badge) => [badge.id, badge]));
  if (byId.night) return { title: 'Créature de la nuit', text: 'Quand tout le monde dort, toi tu lances une partie.' };
  if (byId.marathon) return { title: 'Marathonien', text: 'Une session ? Plutôt une expédition.' };
  if (byId.weekend) return { title: 'Guerrier du week-end', text: 'La semaine pour survivre, le week-end pour jouer.' };
  if (byId.loyal) return { title: 'Âme fidèle', text: 'Un jeu, une passion, aucun regret.' };
  if (byId.explorer) return { title: 'Explorateur', text: 'Toujours un nouveau monde à découvrir.' };
  if (byId.early) return { title: 'Lève-tôt', text: 'Un café, une manette, et la journée commence bien.' };
  if (insight.favoriteHour >= 18) return { title: 'Joueur du soir', text: 'Ta journée se termine toujours par une partie.' };
  if (insight.favoriteHour >= 12) return { title: 'Joueur de l’après-midi', text: 'Le soleil est haut, la manette aussi.' };
  return { title: 'Joueur en devenir', text: 'Ton profil se dessine au fil de tes sessions.' };
}

/** Tout ce que le Wrapped raconte au-delà des chiffres bruts. */
export function computeInsights(stats) {
  const { heatmap, daily, totals } = stats;
  const total = totals.trackedSeconds;
  const byDay = heatmap.map((hours) => sum(hours));
  const byHour = Array.from({ length: 24 }, (_, hour) => sum(heatmap.map((hours) => hours[hour])));
  const share = (seconds) => (total ? seconds / total : 0);
  const { longest, current } = streaks(daily);
  const busiest = daily.reduce((best, day) => (!best || day.seconds > best.seconds ? day : best), null);

  const insight = {
    hasData: total > 0,
    favoriteDay: total ? DAY_NAMES[indexOfMax(byDay)] : null,
    favoriteHour: total ? indexOfMax(byHour) : null,
    nightShare: share(sum(byHour.slice(0, 5))),
    morningShare: share(sum(byHour.slice(5, 9))),
    weekendShare: share(byDay[0] + byDay[6]),
    longestStreak: longest,
    currentStreak: current,
    activeDays: daily.filter((day) => day.seconds > 0).length,
    averageSession: totals.sessions ? total / totals.sessions : 0,
    busiestDay: busiest,
  };
  const list = badges(insight, stats);
  const earned = list.filter((badge) => badge.earned);
  return { ...insight, badges: list, earned, persona: persona(earned, insight) };
}
