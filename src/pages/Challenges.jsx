import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Globe, Link2, Swords } from 'lucide-react';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Card } from '@/components/ui/card';
import { Reveal } from '@/components/ui/reveal';
import { DuelLauncher, ProfileToggle } from '@/components/ShareProfileDialog';
import { formatRelative } from '@/lib/format';
import { readRecentDuels } from '@/lib/recentDuels';
import { Link } from '@/lib/router';

const STEPS = [
  { icon: Globe, title: 'Rends ton profil public', text: 'Un interrupteur, réversible à tout moment.' },
  { icon: Link2, title: 'Envoie ton lien', text: 'Ton ami ouvre ton Wrapped et clique sur « Défier ».' },
  { icon: Swords, title: 'Ou colle le sien', text: 'Score de compatibilité, face-à-face, jeux en commun.' },
];

/** Tout ce qui concerne les duels au même endroit : profil public, lien, défi, historique. */
export function Challenges({ user, isPublic, onPublicChange }) {
  const [recent] = useState(readRecentDuels);

  useEffect(() => {
    document.title = 'Défis · PlayTrace';
  }, []);

  return (
    <>
      <section className="relative overflow-hidden">
        <AuroraBackground />
        <div className="container relative z-10 pb-10 pt-12 text-center sm:pb-14 sm:pt-16">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-white/15 bg-background/60 shadow-[0_0_40px_-6px_rgba(244,114,182,0.7)] backdrop-blur"
          >
            <Swords className="size-8 text-neon-pink" />
          </motion.div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-neon-cyan">Défis</p>
          <h1 className="mt-2 text-[clamp(2rem,7vw,3.5rem)] font-black leading-tight">
            Défie tes <span className="text-gradient">amis</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            Comparez vos années de jeu : qui joue le plus, vos jeux en commun, et à quel point vos goûts se ressemblent.
          </p>

          <ol className="mx-auto mt-8 grid max-w-3xl gap-2.5 text-left sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex gap-3 rounded-xl border bg-card/60 p-3.5 backdrop-blur"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-neon-violet">{index + 1}</span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Icon className="size-3.5 text-muted-foreground" />
                    {title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container grid gap-4 pb-12 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full bg-card/80 p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold">Ton profil</h2>
            <ProfileToggle user={user} isPublic={isPublic} onChange={onPublicChange} />
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="h-full bg-card/80 p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold">Lancer un duel</h2>
            <DuelLauncher user={user} />

            <h3 className="mt-8 text-sm font-semibold">Tes derniers duels</h3>
            {recent.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-muted-foreground">
                Aucun duel pour l’instant. Colle le lien d’un ami juste au-dessus.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {recent.map((duel) => (
                  <li key={duel.steamid}>
                    <Link
                      to={`/duel/${duel.steamid}`}
                      className="group flex items-center gap-3 rounded-xl border bg-background/40 p-2.5 transition-colors hover:border-neon-pink/40"
                    >
                      {duel.avatar ? (
                        <img src={duel.avatar} alt="" referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-full border" />
                      ) : (
                        <span className="size-10 shrink-0 rounded-full bg-secondary" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{duel.pseudo}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {duel.label} · {formatRelative(duel.at)}
                        </p>
                      </div>
                      <span className="text-gradient text-xl font-black tabular-nums">{duel.score}</span>
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Reveal>
      </section>
    </>
  );
}
