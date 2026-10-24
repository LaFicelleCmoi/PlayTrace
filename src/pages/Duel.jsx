import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Crown, Lock, Swords } from 'lucide-react';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CountUp } from '@/components/ui/count-up';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Reveal } from '@/components/ui/reveal';
import { Skeleton } from '@/components/ui/skeleton';
import { GameImage } from '@/components/GameImage';
import { SectionTitle } from '@/components/SectionTitle';
import { useApi } from '@/hooks/useApi';
import { formatDuration, formatNumber } from '@/lib/format';
import { computeInsights } from '@/lib/insights';
import { Link } from '@/lib/router';
import { cn } from '@/lib/utils';

const YEAR = new Date().getFullYear();

function Player({ side, insights, align }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: align === 'left' ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-w-0 flex-1 flex-col items-center text-center"
    >
      {side.user.avatar ? (
        <img
          src={side.user.avatar}
          alt=""
          referrerPolicy="no-referrer"
          className={cn('size-20 rounded-full border-2 shadow-2xl sm:size-28', align === 'left' ? 'border-neon-cyan' : 'border-neon-pink')}
        />
      ) : (
        <div className="size-20 rounded-full bg-secondary sm:size-28" />
      )}
      <p className="mt-3 max-w-full truncate text-base font-bold sm:text-xl">{side.user.pseudo}</p>
      <p className={cn('text-xs sm:text-sm', align === 'left' ? 'text-neon-cyan' : 'text-neon-pink')}>{insights.persona.title}</p>
    </motion.div>
  );
}

/** Une ligne du face-à-face : deux barres opposées, le gagnant couronné. */
function Versus({ label, mine, theirs, format, delay }) {
  const max = Math.max(mine, theirs, 1);
  const winner = mine === theirs ? null : mine > theirs ? 'me' : 'them';
  return (
    <Reveal delay={delay}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        <div className="flex items-center justify-end gap-2">
          <span className={cn('flex items-center gap-1 text-sm font-semibold tabular-nums', winner === 'me' && 'text-neon-cyan')}>
            {winner === 'me' && <Crown className="size-3.5" />}
            {format(mine)}
          </span>
          <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-secondary sm:block md:w-40">
            <motion.div
              className="ml-auto h-full rounded-full bg-neon-cyan"
              initial={{ width: 0 }}
              whileInView={{ width: `${(mine / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay }}
            />
          </div>
        </div>
        <span className="w-24 text-center text-[11px] uppercase tracking-wider text-muted-foreground sm:w-36 sm:text-xs">{label}</span>
        <div className="flex items-center gap-2">
          <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-secondary sm:block md:w-40">
            <motion.div
              className="h-full rounded-full bg-neon-pink"
              initial={{ width: 0 }}
              whileInView={{ width: `${(theirs / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay }}
            />
          </div>
          <span className={cn('flex items-center gap-1 text-sm font-semibold tabular-nums', winner === 'them' && 'text-neon-pink')}>
            {format(theirs)}
            {winner === 'them' && <Crown className="size-3.5" />}
          </span>
        </div>
      </div>
    </Reveal>
  );
}

/** Duel entre le joueur connecté et un ami qui a rendu son profil public. */
export function Duel({ steamid }) {
  const { data, error, loading } = useApi(`/api/duel/${steamid}?year=${YEAR}&tz=${new Date().getTimezoneOffset()}`);
  const insights = useMemo(
    () => data && { me: computeInsights(data.me.stats), them: computeInsights(data.them.stats) },
    [data],
  );

  useEffect(() => {
    if (data) document.title = `${data.me.user.pseudo} vs ${data.them.user.pseudo} · PlayTrace`;
  }, [data]);

  if (loading) {
    return (
      <div className="container space-y-6 py-16">
        <Skeleton className="mx-auto h-32 w-full max-w-xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
        <Lock className="size-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Duel impossible</h1>
        <p className="max-w-sm text-muted-foreground">{error.status === 404 ? 'Ce joueur n’a pas rendu son profil public.' : error.message}</p>
        <Link to="/" className={buttonVariants()}>Retour au Wrapped</Link>
      </div>
    );
  }

  const { me, them, compatibility, common, commonCount, suggestions } = data;
  const hours = (seconds) => `${formatNumber(seconds / 3600, seconds < 36_000 ? 1 : 0)} h`;
  const rows = [
    { label: `Heures suivies ${YEAR}`, mine: me.stats.totals.trackedSeconds, theirs: them.stats.totals.trackedSeconds, format: hours },
    { label: 'Sessions', mine: me.stats.totals.sessions, theirs: them.stats.totals.sessions, format: formatNumber },
    { label: 'Jeux joués', mine: me.stats.totals.games, theirs: them.stats.totals.games, format: formatNumber },
    { label: 'Compteur Steam', mine: me.stats.library.totalMinutes * 60, theirs: them.stats.library.totalMinutes * 60, format: hours },
    { label: 'Bibliothèque', mine: me.stats.library.gameCount, theirs: them.stats.library.gameCount, format: formatNumber },
    { label: 'Badges PlayTrace', mine: insights.me.earned.length, theirs: insights.them.earned.length, format: formatNumber },
  ];

  return (
    <>
      <section className="relative overflow-hidden">
        <AuroraBackground />
        <div className="container relative z-10 pb-12 pt-10 sm:pb-16 sm:pt-16">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Duel · {YEAR}</p>
          <div className="mt-8 flex items-center justify-center gap-3 sm:gap-10">
            <Player side={me} insights={insights.me} align="left" />
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.3 }}
              className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-background/70 shadow-[0_0_30px_-4px_rgba(232,121,249,0.7)] backdrop-blur sm:size-16"
            >
              <Swords className="size-5 text-neon-violet sm:size-7" />
            </motion.div>
            <Player side={them} insights={insights.them} align="right" />
          </div>

          <Reveal className="mt-10 flex flex-col items-center gap-3">
            <ProgressRing value={compatibility.score / 100} size={150} stroke={12}>
              <span className="text-4xl font-black tabular-nums">
                <CountUp value={compatibility.score} />
              </span>
              <span className="text-[11px] text-muted-foreground">compatibilité</span>
            </ProgressRing>
            <p className="text-gradient text-2xl font-black sm:text-3xl">{compatibility.label}</p>
            <p className="max-w-md text-center text-sm text-muted-foreground">
              {commonCount
                ? `${commonCount} jeu${commonCount > 1 ? 'x' : ''} en commun, comparés selon votre temps de jeu.`
                : 'Aucun jeu en commun pour l’instant.'}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container py-10 sm:py-14">
        <SectionTitle eyebrow="Face à face" title="Qui joue le plus ?" />
        <Card className="space-y-5 bg-card/80 p-4 sm:p-6">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-xs font-semibold sm:gap-4">
            <span className="truncate text-right text-neon-cyan">{me.user.pseudo}</span>
            <span className="w-24 sm:w-36" />
            <span className="truncate text-neon-pink">{them.user.pseudo}</span>
          </div>
          {rows.map((row, index) => (
            <Versus key={row.label} {...row} delay={index * 0.06} />
          ))}
        </Card>
      </section>

      {common.length > 0 && (
        <section className="container py-10 sm:py-14">
          <SectionTitle eyebrow="En commun" title="Vos terrains de jeu partagés" />
          <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {common.map((game, index) => {
              const max = Math.max(game.mine, game.theirs, 1);
              return (
                <Reveal key={game.appid} delay={(index % 6) * 0.05}>
                  <Link to={`/jeux/${game.appid}`} className="flex items-center gap-3 rounded-xl border bg-card/70 p-3 transition-colors hover:border-neon-violet/40">
                    <GameImage appid={game.appid} alt="" className="aspect-[460/215] w-24 shrink-0 rounded-md sm:w-28" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{game.name}</p>
                      {[
                        { value: game.mine, color: 'bg-neon-cyan' },
                        { value: game.theirs, color: 'bg-neon-pink' },
                      ].map(({ value, color }, row) => (
                        <div key={row} className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div className={cn('h-full rounded-full', color)} style={{ width: `${(value / max) * 100}%` }} />
                          </div>
                          <span className="w-[4.5rem] shrink-0 whitespace-nowrap text-right text-[11px] tabular-nums text-muted-foreground">
                            {formatDuration(value * 60)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </section>
      )}

      {suggestions.length > 0 && (
        <section className="container py-10 sm:py-14">
          <SectionTitle
            eyebrow="À découvrir"
            title={`Les favoris de ${them.user.pseudo} que tu n’as pas`}
            description="De quoi trouver ta prochaine obsession."
          />
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5 min-[480px]:grid-cols-3 md:grid-cols-6">
            {suggestions.map((game, index) => (
              <Reveal key={game.appid} delay={index * 0.05}>
                <a href={`https://store.steampowered.com/app/${game.appid}/`} target="_blank" rel="noreferrer noopener" className="group block">
                  <GameImage
                    appid={game.appid}
                    kind="capsule"
                    alt=""
                    className="aspect-[2/3] w-full rounded-xl border transition duration-300 group-hover:-translate-y-1 group-hover:border-neon-pink/50"
                  />
                  <p className="mt-2 line-clamp-2 text-sm font-semibold">{game.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDuration(game.minutes * 60)} pour {them.user.pseudo}</p>
                </a>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      <div className="container pb-6 text-center">
        <Link to={`/joueur/${them.user.steamid}`} className={buttonVariants({ variant: 'outline' })}>
          Voir le Wrapped de {them.user.pseudo}
        </Link>
      </div>
    </>
  );
}
