import { motion } from 'motion/react';
import { Activity, Flame, Gamepad2, Lock, Radio } from 'lucide-react';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { BorderBeam } from '@/components/ui/border-beam';
import { buttonVariants } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { cn } from '@/lib/utils';

const FEATURES = [
  { icon: Radio, label: 'Détection du jeu en cours, en direct' },
  { icon: Activity, label: 'Chaque session enregistrée automatiquement' },
  { icon: Flame, label: 'Ton Wrapped qui se construit au fil des parties' },
];

export function Login() {
  const params = new URLSearchParams(window.location.search);
  const failed = params.get('login') === 'failed';
  const deleted = params.get('compte') === 'supprime';

  return (
    <>
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-16 sm:py-20">
        <AuroraBackground />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-xl text-center"
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">PlayTrace</p>
          <h1 className="text-[clamp(2.25rem,9vw,4rem)] font-bold leading-[1.05]">
            Ton Steam Wrapped,
            <br />
            <span className="text-gradient">en temps réel.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm text-muted-foreground sm:mt-6 sm:text-base">
            PlayTrace détecte ce que tu joues, enregistre chaque session et affiche tes stats pendant que tu joues.
          </p>

          <div className="relative mx-auto mt-8 w-full rounded-lg sm:mt-10 sm:w-fit">
            <a href="/auth/steam" className={cn(buttonVariants({ size: 'lg' }), 'relative w-full bg-secondary px-6 text-foreground hover:bg-secondary/70')}>
              <Gamepad2 />
              Se connecter avec Steam
            </a>
            <BorderBeam />
          </div>

          <p className="mx-auto mt-4 max-w-sm text-xs leading-relaxed text-muted-foreground">
            <Lock className="mr-1 inline size-3 -translate-y-px text-neon-lime" />
            Tu seras redirigé vers <strong className="text-foreground">steamcommunity.com</strong> : vérifie l’adresse. PlayTrace ne te
            demandera jamais ton mot de passe.
          </p>

          {deleted && (
            <p role="status" className="mt-4 text-sm text-neon-lime">Ton compte et toutes tes données ont été supprimés.</p>
          )}

          {failed && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              La connexion Steam a échoué. Réessaie.
            </p>
          )}

          <ul className="mx-auto mt-10 grid max-w-md gap-2.5 text-left text-sm sm:mt-12 sm:gap-3">
            {FEATURES.map(({ icon: Icon, label }, index) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.12 }}
                className="flex items-center gap-3 rounded-lg border bg-card/60 px-4 py-3 backdrop-blur"
              >
                <Icon className="size-4 shrink-0 text-neon-cyan" />
                {label}
              </motion.li>
            ))}
          </ul>

          <p className="mt-8 text-xs text-muted-foreground">
            Ton profil et les détails de tes jeux doivent être <strong>publics</strong> sur Steam.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            En te connectant, tu acceptes que PlayTrace enregistre tes sessions de jeu.{' '}
            <a href="/confidentialite" className="text-neon-cyan hover:underline">Ce que PlayTrace fait de tes données</a>
          </p>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
