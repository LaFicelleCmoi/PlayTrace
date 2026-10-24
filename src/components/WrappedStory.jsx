import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CalendarClock, Download, Flame, Loader2, Moon, RotateCcw, Share2, Timer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountUp } from '@/components/ui/count-up';
import { GameImage } from '@/components/GameImage';
import { formatDate, formatDuration, formatNumber } from '@/lib/format';
import { renderWrappedImage, shareOrDownload } from '@/lib/shareImage';
import { cn } from '@/lib/utils';

const SLIDE_MS = 6500;
const HOLD_MS = 220;
const ease = [0.22, 1, 0.36, 1];

// Apparition décalée des éléments d'une slide.
function Line({ delay = 0, className, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, delay = 0.1 }) {
  return (
    <Line delay={delay} className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60 sm:text-sm">
      {children}
    </Line>
  );
}

function Backdrop({ colors }) {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {colors.map((color, index) => (
        <motion.div
          key={index}
          className="absolute size-[70vmax] rounded-full blur-3xl"
          style={{ backgroundColor: color, left: `${[-20, 40, 0][index]}%`, top: `${[-25, 30, 60][index]}%`, opacity: 0.35 }}
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 14 + index * 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <div className="bg-grid absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
    </div>
  );
}

function buildSlides({ user, stats, insights }) {
  const { totals, year } = stats;
  const tracked = totals.trackedSeconds;
  const libraryTop = stats.library.topGames.map((game) => ({ ...game, seconds: game.minutes * 60 }));
  const top = (stats.topGames.length ? stats.topGames : libraryTop).slice(0, 5);
  const goty = stats.gameOfTheYear ?? top[0] ?? null;
  const slides = [];

  slides.push({
    id: 'intro',
    colors: ['#7c3aed', '#22d3ee', '#db2777'],
    render: () => (
      <div className="flex flex-col items-center text-center">
        {user.avatar && (
          <Line>
            <img src={user.avatar} alt="" referrerPolicy="no-referrer" className="size-24 rounded-full border-2 border-white/30 shadow-2xl sm:size-28" />
          </Line>
        )}
        <Line delay={0.15} className="mt-6 text-lg text-white/70">Salut {user.pseudo}</Line>
        <Line delay={0.3} className="mt-2 text-[clamp(3rem,13vw,7rem)] font-black leading-[0.95]">
          Ton {year}
          <br />
          <span className="text-gradient">sur Steam</span>
        </Line>
        <Line delay={0.6} className="mt-8 text-sm text-white/60">Appuie à droite pour avancer, maintiens pour mettre en pause.</Line>
      </div>
    ),
  });

  slides.push({
    id: 'hours',
    colors: ['#0891b2', '#7c3aed', '#0f172a'],
    render: () => (
      <div className="text-center">
        <Eyebrow>{tracked ? 'Cette année, tu as joué' : 'Au compteur Steam'}</Eyebrow>
        <Line delay={0.25} className="mt-4 text-[clamp(5rem,26vw,13rem)] font-black leading-none tabular-nums">
          <CountUp value={(tracked || stats.library.totalMinutes * 60) / 3600} decimals={tracked && tracked < 36_000 ? 1 : 0} className="text-gradient" />
          <span className="text-[0.4em] text-white/70"> h</span>
        </Line>
        {tracked ? (
          <>
            <Line delay={0.6} className="mt-6 text-xl font-semibold sm:text-2xl">
              {totals.sessions} session{totals.sessions > 1 ? 's' : ''} sur {totals.games} jeu{totals.games > 1 ? 'x' : ''}
            </Line>
            <Line delay={0.85} className="mt-2 text-white/60">
              {tracked >= 7200 ? `De quoi regarder ${formatNumber(tracked / 7200)} films d’affilée.` : 'Et ce n’est que le début.'}
            </Line>
          </>
        ) : (
          <Line delay={0.6} className="mx-auto mt-6 max-w-sm text-white/70">
            Le suivi PlayTrace vient de démarrer : ton vrai Wrapped s’écrit à chaque partie.
          </Line>
        )}
      </div>
    ),
  });

  if (goty) {
    slides.push({
      id: 'goty',
      colors: ['#db2777', '#7c3aed', '#0e7490'],
      background: goty.appid,
      render: () => (
        <div className="flex flex-col items-center text-center">
          <Eyebrow>{stats.gameOfTheYear ? 'Ton jeu de l’année' : 'Ton jeu le plus joué'}</Eyebrow>
          <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease }}
            className="relative mt-6"
          >
            <div aria-hidden className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-neon-cyan via-neon-violet to-neon-pink opacity-50 blur-2xl" />
            <GameImage appid={goty.appid} kind="capsule" alt={goty.name} className="relative aspect-[2/3] w-44 rounded-2xl border border-white/20 shadow-2xl sm:w-56" />
          </motion.div>
          <Line delay={0.6} className="mt-8 max-w-xl text-[clamp(2rem,8vw,3.5rem)] font-black leading-tight">{goty.name.trim()}</Line>
          <Line delay={0.8} className="mt-3 text-lg text-white/75">
            {formatDuration(goty.seconds)}
            {stats.gameOfTheYear && ` · ${Math.round(stats.gameOfTheYear.share * 100)} % de ton temps`}
          </Line>
        </div>
      ),
    });
  }

  if (top.length > 1) {
    const max = top[0].seconds || 1;
    slides.push({
      id: 'top',
      colors: ['#4f46e5', '#0891b2', '#be185d'],
      render: () => (
        <div className="w-full max-w-lg">
          <Eyebrow>Ton top {top.length}</Eyebrow>
          <ol className="mt-6 grid gap-3">
            {top.map((game, index) => (
              <motion.li
                key={game.appid}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.15, duration: 0.6, ease }}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur"
              >
                <span className="w-7 text-center text-2xl font-black text-white/80">{index + 1}</span>
                <GameImage appid={game.appid} alt="" className="aspect-[460/215] w-20 shrink-0 rounded-lg sm:w-24" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{game.name.trim()}</p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-pink"
                      initial={{ width: 0 }}
                      animate={{ width: `${(game.seconds / max) * 100}%` }}
                      transition={{ delay: 0.6 + index * 0.15, duration: 0.9, ease }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-white/70">{formatDuration(game.seconds)}</span>
              </motion.li>
            ))}
          </ol>
        </div>
      ),
    });
  }

  if (insights.hasData) {
    slides.push({
      id: 'moment',
      colors: ['#1e1b4b', '#7c3aed', '#0e7490'],
      render: () => (
        <div className="text-center">
          <Eyebrow>Ton créneau favori</Eyebrow>
          <Line delay={0.3} className="mt-6 flex justify-center">
            <CalendarClock className="size-14 text-neon-cyan" />
          </Line>
          <Line delay={0.45} className="mt-6 text-[clamp(2.75rem,12vw,6rem)] font-black capitalize leading-none">
            {insights.favoriteDay}
          </Line>
          <Line delay={0.65} className="mt-3 text-[clamp(1.75rem,7vw,3.5rem)] font-black text-gradient">
            vers {insights.favoriteHour} h
          </Line>
          <Line delay={0.9} className="mt-6 text-white/70">
            {insights.nightShare >= 0.1 ? (
              <span className="inline-flex items-center gap-2">
                <Moon className="size-4" /> {Math.round(insights.nightShare * 100)} % de ton temps après minuit
              </span>
            ) : (
              `${Math.round(insights.weekendShare * 100)} % de ton temps le week-end`
            )}
          </Line>
        </div>
      ),
    });

    slides.push({
      id: 'records',
      colors: ['#9f1239', '#ea580c', '#4c1d95'],
      render: () => (
        <div className="w-full max-w-md text-center">
          <Eyebrow>Tes records</Eyebrow>
          <div className="mt-8 grid gap-4">
            {[
              {
                icon: Timer,
                value: formatDuration(totals.longest?.seconds ?? 0),
                label: totals.longest ? `sur ${totals.longest.name.trim()}, d’une traite` : 'de session la plus longue',
              },
              {
                icon: Flame,
                value: `${insights.longestStreak} jour${insights.longestStreak > 1 ? 's' : ''}`,
                label: 'de jeu d’affilée',
              },
              insights.busiestDay && {
                icon: CalendarClock,
                value: formatDuration(insights.busiestDay.seconds),
                label: `le ${formatDate(`${insights.busiestDay.day}T12:00:00`, { day: 'numeric', month: 'long' })}, ta plus grosse journée`,
              },
            ]
              .filter(Boolean)
              .map(({ icon: Icon, value, label }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.85, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.25, duration: 0.6, ease }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <Icon className="mx-auto size-6 text-neon-pink" />
                  <p className="mt-2 text-4xl font-black tabular-nums">{value}</p>
                  <p className="mt-1 text-sm text-white/65">{label}</p>
                </motion.div>
              ))}
          </div>
        </div>
      ),
    });
  }

  slides.push({
    id: 'persona',
    colors: ['#7c3aed', '#db2777', '#0891b2'],
    render: () => (
      <div className="flex flex-col items-center text-center">
        <Eyebrow>Cette année, tu es</Eyebrow>
        <motion.p
          initial={{ opacity: 0, scale: 1.4, filter: 'blur(20px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1, delay: 0.3, ease }}
          className="mt-6 max-w-2xl text-[clamp(2.75rem,12vw,6.5rem)] font-black leading-[0.95] text-gradient"
        >
          {insights.persona.title}
        </motion.p>
        <Line delay={0.9} className="mt-6 max-w-md text-lg text-white/75">{insights.persona.text}</Line>
        {insights.earned.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {insights.earned.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.id}
                  title={badge.title}
                  initial={{ opacity: 0, scale: 0, rotate: -30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 1.1 + index * 0.12, type: 'spring', stiffness: 260, damping: 16 }}
                  className="flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur"
                  style={{ boxShadow: `0 0 24px -6px ${badge.color}` }}
                >
                  <Icon className="size-6" style={{ color: badge.color }} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    ),
  });

  slides.push({ id: 'share', colors: ['#0f172a', '#7c3aed', '#0891b2'], final: true });
  return slides;
}

function ShareSlide({ data, onReplay, onClose }) {
  const [image, setImage] = useState({ status: 'loading', url: null, blob: null });
  const [result, setResult] = useState(null);

  useEffect(() => {
    let url = null;
    renderWrappedImage(data)
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setImage({ status: 'ready', url, blob });
      })
      .catch(() => setImage({ status: 'error', url: null, blob: null }));
    return () => url && URL.revokeObjectURL(url);
  }, [data]);

  async function share() {
    setResult(await shareOrDownload(image.blob, data.stats.year));
  }

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6 md:flex-row md:gap-12">
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.8, ease }}
        className="relative aspect-[9/16] w-44 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-[0_30px_80px_-20px_rgba(167,139,250,0.6)] sm:w-56 md:w-72"
      >
        {image.status === 'ready' ? (
          <img src={image.url} alt="Aperçu de ton Wrapped" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/60">
            {image.status === 'loading' ? <Loader2 className="size-6 animate-spin" /> : 'Aperçu indisponible'}
          </div>
        )}
      </motion.div>
      <div className="text-center md:text-left">
        <Eyebrow>C’est dans la boîte</Eyebrow>
        <Line delay={0.2} className="mt-3 text-[clamp(2rem,8vw,3.5rem)] font-black leading-tight">
          Montre ton <span className="text-gradient">Wrapped</span>
        </Line>
        <Line delay={0.35} className="mt-2 text-white/70">Une image au format story, prête pour Insta, Discord ou X.</Line>
        <Line delay={0.5} className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
          <Button size="lg" onClick={share} disabled={image.status !== 'ready'} className="bg-white text-black hover:bg-white/90">
            {navigator.canShare ? <Share2 /> : <Download />}
            {navigator.canShare ? 'Partager' : 'Télécharger'}
          </Button>
          <Button size="lg" variant="outline" onClick={onReplay} className="border-white/20 bg-white/5">
            <RotateCcw />
            Revoir
          </Button>
          <Button size="lg" variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </Line>
        {result === 'downloaded' && <p className="mt-3 text-sm text-neon-lime">Image téléchargée.</p>}
        {result === 'shared' && <p className="mt-3 text-sm text-neon-lime">Partagé !</p>}
      </div>
    </div>
  );
}

/** Le Wrapped raconté en stories plein écran. */
export function WrappedStory({ user, stats, insights, onClose }) {
  const data = useMemo(() => ({ user, stats, insights }), [user, stats, insights]);
  const slides = useMemo(() => buildSlides(data), [data]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pressStart = useRef(0);
  // Animations réduites : pas d'avance automatique, le joueur avance à son rythme.
  const autoplay = !useReducedMotion();
  const slide = slides[index];

  const next = useCallback(() => setIndex((value) => Math.min(value + 1, slides.length - 1)), [slides.length]);
  const previous = useCallback(() => setIndex((value) => Math.max(value - 1, 0)), []);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(event) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        next();
      }
      if (event.key === 'ArrowLeft') previous();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [next, previous, onClose]);

  // Tap court à gauche/droite pour naviguer, appui long pour mettre en pause.
  function onPointerDown() {
    pressStart.current = Date.now();
    setPaused(true);
  }
  function onPointerUp(event) {
    setPaused(false);
    if (slide.final || Date.now() - pressStart.current > HOLD_MS) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX - rect.left < rect.width * 0.3) previous();
    else next();
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Ton Wrapped ${stats.year}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] overflow-hidden bg-[#05050a] text-white"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.6, ease }}
          className="absolute inset-0"
        >
          <Backdrop colors={slide.colors} />
          {slide.background && (
            <div className="absolute inset-0 opacity-25">
              <GameImage appid={slide.background} kind="hero" alt="" className="h-full w-full scale-110 blur-md" />
            </div>
          )}
          <div
            className={cn('relative flex h-full items-center justify-center overflow-y-auto px-6 pb-16 pt-20', !slide.final && 'cursor-pointer select-none')}
            onPointerDown={slide.final ? undefined : onPointerDown}
            onPointerUp={slide.final ? undefined : onPointerUp}
            onPointerLeave={() => setPaused(false)}
          >
            {slide.final ? <ShareSlide data={data} onReplay={() => setIndex(0)} onClose={onClose} /> : slide.render()}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Barres de progression façon stories. */}
      <div className="absolute inset-x-0 top-0 z-10 flex gap-1.5 px-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        {slides.map((item, position) => (
          <div key={item.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            {position < index && <div className="h-full w-full bg-white" />}
            {position === index && !item.final && !autoplay && <div className="h-full w-1/2 bg-white" />}
            {position === index && !item.final && autoplay && (
              <div
                key={`${item.id}-${index}`}
                className="h-full bg-white"
                style={{ animation: `story-progress ${SLIDE_MS}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' }}
                onAnimationEnd={next}
              />
            )}
            {position === index && item.final && <div className="h-full w-full bg-white" />}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer le Wrapped"
        className="absolute right-3 top-[calc(1.75rem+env(safe-area-inset-top))] z-10 rounded-full bg-white/10 p-2 backdrop-blur transition-colors hover:bg-white/20"
      >
        <X className="size-5" />
      </button>
      <p className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-0 right-0 z-10 text-center text-[11px] text-white/40">
        {index + 1} / {slides.length} · ← → pour naviguer · Échap pour fermer
      </p>
    </motion.div>
  );
}
