import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUp, ArrowUpRight, Bell, BellOff, BellRing, Gamepad2, LibraryBig, LogOut, MonitorSmartphone, Orbit, Radio, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { siNodedotjs, siReact, siSteam, siSupabase, siTailwindcss, siVercel, siVite } from 'simple-icons';
import { TextHoverEffect } from '@/components/ui/text-hover-effect';
import { logout } from '@/lib/api';
import { promptInstall, useInstallState } from '@/lib/install';
import { toast } from '@/lib/toast';
import { Link } from '@/lib/router';
import { cn } from '@/lib/utils';

// Logos de simple-icons (CC0). Motion n'y figure pas : icône neutre plutôt qu'un faux logo.
const STACK = [
  { name: 'React', icon: siReact },
  { name: 'Vite', icon: siVite },
  { name: 'Tailwind', icon: siTailwindcss },
  { name: 'Motion', lucide: Orbit, color: '#f4f4f5' },
  { name: 'Node.js', icon: siNodedotjs },
  { name: 'Supabase', icon: siSupabase },
  { name: 'Vercel', icon: siVercel },
  { name: 'API Steam', icon: siSteam },
];

/** Couleur de marque, sauf les logos noirs (Vercel, Steam) qui disparaîtraient sur le fond sombre. */
function brandColor(tech) {
  if (tech.color) return tech.color;
  return tech.icon.hex === '000000' ? '#f4f4f5' : `#${tech.icon.hex}`;
}

function TechBadge({ tech, index }) {
  const color = brandColor(tech);
  const Lucide = tech.lucide;
  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      style={{ '--brand': color }}
      className="group flex items-center gap-1.5 rounded-lg border bg-card/70 px-2.5 py-1.5 text-xs text-muted-foreground transition duration-300 hover:-translate-y-0.5 hover:border-[color:var(--brand)] hover:text-foreground hover:shadow-[0_0_18px_-6px_var(--brand)]"
    >
      {Lucide ? (
        <Lucide className="size-3.5 shrink-0 text-[color:var(--brand)]" aria-hidden />
      ) : (
        <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill={color} aria-hidden>
          <path d={tech.icon.path} />
        </svg>
      )}
      {tech.name}
    </motion.li>
  );
}
const linkClass = 'group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground';

function FooterLink({ to, href, icon: Icon, children }) {
  const content = (
    <>
      <Icon className="size-4 shrink-0 transition-colors group-hover:text-neon-cyan" />
      <span>{children}</span>
      {href && <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={linkClass}>
        {content}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={linkClass}>
      {content}
    </a>
  );
}

/** Autorise les notifications système (fin de session quand l'onglet est en arrière-plan). */
function NotificationToggle() {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported');
  if (!supported) return null;

  if (permission === 'granted') {
    return (
      <span className={linkClass}>
        <BellRing className="size-4 shrink-0 text-neon-lime" />
        Notifications activées
      </span>
    );
  }
  if (permission === 'denied') {
    return (
      <span className={linkClass} title="Autorise-les dans les réglages du navigateur">
        <BellOff className="size-4 shrink-0" />
        Notifications bloquées
      </span>
    );
  }
  return (
    <button
      type="button"
      className={linkClass}
      onClick={async () => {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted') toast({ title: 'Notifications activées', description: 'Tu seras prévenu à la fin de chaque session.', tone: 'done' });
      }}
    >
      <Bell className="size-4 shrink-0 transition-colors group-hover:text-neon-cyan" />
      Activer les notifications
    </button>
  );
}

/** « Installer l'app » quand le navigateur le permet (instructions sur iPhone). */
function InstallButton() {
  const state = useInstallState();
  if (!state) return null;
  return (
    <button
      type="button"
      className={linkClass}
      onClick={async () => {
        if (state === 'ios') {
          toast({ title: 'Installer PlayTrace', description: 'Dans Safari : bouton Partager, puis « Sur l’écran d’accueil ».', tone: 'info', duration: 10_000 });
        } else if (await promptInstall()) {
          toast({ title: 'PlayTrace installé', description: 'Retrouve-le sur ton écran d’accueil.', tone: 'done' });
        }
      }}
    >
      <MonitorSmartphone className="size-4 shrink-0 transition-colors group-hover:text-neon-cyan" />
      Installer l’app
    </button>
  );
}

function Column({ title, children }) {
  return (
    <div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70">{title}</p>
      <ul className="grid gap-3">{children}</ul>
    </div>
  );
}

/** État du suivi en direct : jeu en cours, suivi actif, ou connexion perdue. */
function LiveChip({ live }) {
  const playing = live.status?.playing;
  const lost = live.connection === 'closed';
  const dot = playing ? 'bg-neon-red' : lost ? 'bg-muted-foreground' : 'bg-neon-lime';

  const content = (
    <>
      <span className="relative flex size-2.5 shrink-0">
        {!lost && <span className={cn('absolute inline-flex h-full w-full animate-pulse-ring rounded-full', dot)} />}
        <span className={cn('relative inline-flex size-2.5 rounded-full', dot)} />
      </span>
      <span className="truncate">
        {playing ? (
          <>
            En jeu · <strong className="font-semibold text-foreground">{live.status.gameName}</strong>
          </>
        ) : lost ? (
          'Connexion au direct perdue'
        ) : (
          'Suivi actif · Steam est sondé chaque minute'
        )}
      </span>
    </>
  );

  const className = 'inline-flex max-w-full items-center gap-2.5 rounded-full border bg-card/70 px-3.5 py-2 text-xs text-muted-foreground backdrop-blur sm:text-sm';
  return playing ? (
    <Link to={`/jeux/${live.status.appid}`} className={cn(className, 'border-neon-red/30 transition-colors hover:border-neon-red/60')}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

/** Pied de page : liens, état du suivi et logo géant interactif. */
export function Footer({ user, live }) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-10 overflow-hidden border-t border-white/5 sm:mt-16">
      {/* Liseré et halo néon en haut du footer. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-violet to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[min(900px,90%)] -translate-x-1/2 rounded-full bg-neon-violet/15 blur-3xl" />
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />

      <div className="container relative pt-12 sm:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="min-w-0"
          >
            <Link to="/" className="inline-flex items-center gap-2 text-lg font-bold">
              <img src="/favicon.svg" alt="" className="size-7" />
              <span>
                Play<span className="text-gradient">Trace</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Ton Steam Wrapped, mais en temps réel. Chaque partie est enregistrée pendant que tu joues, même onglet fermé.
            </p>
            {live && (
              <div className="mt-6">
                <LiveChip live={live} />
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <Column title="Explorer">
              <li><FooterLink to="/" icon={Sparkles}>Wrapped</FooterLink></li>
              <li><FooterLink to="/jeux" icon={LibraryBig}>Mes jeux</FooterLink></li>
              <li><InstallButton /></li>
              {live?.status?.playing && (
                <li><FooterLink to={`/jeux/${live.status.appid}`} icon={Radio}>Jeu en cours</FooterLink></li>
              )}
            </Column>

            {user ? (
              <Column title="Ton compte">
                <li><FooterLink href={`https://steamcommunity.com/profiles/${user.steamid}`} icon={UserRound}>Profil Steam</FooterLink></li>
                <li><FooterLink href="https://steamcommunity.com/my/edit/settings" icon={ShieldCheck}>Confidentialité</FooterLink></li>
                <li><NotificationToggle /></li>
                <li>
                  <button type="button" onClick={logout} className={linkClass}>
                    <LogOut className="size-4 shrink-0 transition-colors group-hover:text-neon-pink" />
                    Se déconnecter
                  </button>
                </li>
              </Column>
            ) : (
              <Column title="Steam">
                <li><FooterLink href="https://store.steampowered.com/" icon={Gamepad2}>Store Steam</FooterLink></li>
                <li><FooterLink href="https://steamcommunity.com/my/edit/settings" icon={ShieldCheck}>Confidentialité</FooterLink></li>
              </Column>
            )}

            <div className="col-span-2 sm:col-span-1">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70">Sous le capot</p>
              <ul className="flex flex-wrap gap-2">
                {STACK.map((tech, index) => (
                  <TechBadge key={tech.name} tech={tech} index={index} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-10 px-2 sm:mt-14 sm:px-4">
        <TextHoverEffect text="PlayTrace" className="mx-auto block w-full max-w-[1400px] select-none" />
      </div>

      <div className="container relative border-t border-white/5 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="flex flex-col items-center gap-4 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <div className="space-y-1">
            <p>
              © {year} PlayTrace · par <span className="text-foreground">LaFicelleCmoi</span>, fait avec ☕, du néon et beaucoup de parties de Steam.
            </p>
            <p className="text-muted-foreground/70">Projet indépendant, non affilié à Valve. Données fournies par l’API Web Steam.</p>
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border bg-card/70 px-4 py-2 text-foreground transition-colors hover:border-neon-violet/50"
          >
            Haut de page
            <ArrowUp className="size-4 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
