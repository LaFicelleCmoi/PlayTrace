import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Lock, Swords } from 'lucide-react';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { buttonVariants } from '@/components/ui/button';
import { CountUp } from '@/components/ui/count-up';
import { Skeleton } from '@/components/ui/skeleton';
import { GameOfTheYear } from '@/components/GameOfTheYear';
import { PlayerProfile } from '@/components/PlayerProfile';
import { TopGames } from '@/components/TopGames';
import { YearCalendar } from '@/components/YearCalendar';
import { useApi } from '@/hooks/useApi';
import { formatNumber } from '@/lib/format';
import { computeInsights } from '@/lib/insights';
import { Link } from '@/lib/router';
import { cn } from '@/lib/utils';

const YEAR = new Date().getFullYear();

function Stat({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border bg-card/60 px-3 py-3 text-left backdrop-blur sm:px-4">
      <p className="text-[11px] uppercase leading-tight tracking-wider text-muted-foreground sm:text-xs">{label}</p>
      <p className="mt-1 truncate text-base font-semibold sm:text-lg">{value}</p>
    </div>
  );
}

/** Wrapped d'un autre joueur, visible par lien s'il l'a rendu public. */
export function PublicProfile({ steamid, viewer }) {
  const { data, error, loading } = useApi(`/api/public/${steamid}?year=${YEAR}&tz=${new Date().getTimezoneOffset()}`);
  const insights = useMemo(() => (data ? computeInsights(data.stats) : null), [data]);
  const self = viewer?.steamid === steamid;

  useEffect(() => {
    if (data) document.title = `Le ${YEAR} de ${data.user.pseudo} · PlayTrace`;
  }, [data]);

  if (loading) {
    return (
      <div className="container space-y-6 py-16">
        <Skeleton className="mx-auto size-24 rounded-full" />
        <Skeleton className="mx-auto h-24 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
        <Lock className="size-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{error.status === 404 ? 'Profil privé ou introuvable' : 'Profil indisponible'}</h1>
        <p className="max-w-sm text-muted-foreground">
          {error.status === 404 ? 'Ce joueur n’a pas rendu son Wrapped public.' : error.message}
        </p>
        <Link to="/" className={buttonVariants()}>Retour à PlayTrace</Link>
      </div>
    );
  }

  const { user, stats } = data;
  const tracked = stats.totals.trackedSeconds;

  return (
    <>
      <section className="relative overflow-hidden">
        <AuroraBackground />
        <div className="container relative z-10 pb-14 pt-12 text-center sm:pb-20 sm:pt-20">
          {user.avatar && (
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              src={user.avatar}
              alt=""
              referrerPolicy="no-referrer"
              className="mx-auto size-24 rounded-full border-2 border-white/20 shadow-2xl"
            />
          )}
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
            Le {YEAR} de {user.pseudo} sur Steam
          </p>
          <h1 className="mt-4 whitespace-nowrap text-[clamp(3rem,15vw,8rem)] font-bold leading-none tabular-nums">
            <CountUp value={(tracked || stats.library.totalMinutes * 60) / 3600} decimals={tracked ? 1 : 0} className="text-gradient" />
            <span className="ml-2 text-[0.45em] text-muted-foreground">h</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {tracked ? 'de jeu suivies par PlayTrace' : 'au compteur Steam'}
            {insights && <> · <span className="text-gradient font-semibold">{insights.persona.title}</span></>}
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            {self ? (
              <p className="rounded-full border bg-card/60 px-4 py-2 text-sm text-muted-foreground">C’est ton profil public, tel que les autres le voient.</p>
            ) : viewer ? (
              <Link to={`/duel/${steamid}`} className={cn(buttonVariants({ size: 'lg' }), 'bg-white px-6 text-black hover:bg-white/90')}>
                <Swords />
                Défier {user.pseudo}
              </Link>
            ) : (
              <a href="/auth/steam" className={cn(buttonVariants({ size: 'lg' }), 'bg-white px-6 text-black hover:bg-white/90')}>
                Créer mon Wrapped
              </a>
            )}
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-2.5 md:grid-cols-4">
            <Stat label="Sessions" value={formatNumber(stats.totals.sessions)} />
            <Stat label="Jeux joués" value={formatNumber(stats.totals.games)} />
            <Stat label="Bibliothèque" value={`${formatNumber(stats.library.gameCount)} jeux`} />
            <Stat label="Badges" value={insights ? `${insights.earned.length} / ${insights.badges.length}` : '—'} />
          </div>
        </div>
      </section>

      <TopGames stats={stats} interactive={false} title={`Les jeux préférés de ${user.pseudo}`} />
      <GameOfTheYear stats={stats} interactive={false} />
      {insights && <PlayerProfile insights={insights} />}
      <YearCalendar year={stats.year} daily={stats.daily} trackingSince={stats.trackingSince} />
    </>
  );
}
