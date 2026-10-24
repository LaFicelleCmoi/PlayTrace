import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Gamepad2, LibraryBig, LogOut, Search, Sparkles, Swords } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { CommandPalette, useCommandPaletteShortcut } from '@/components/CommandPalette';
import { Footer } from '@/components/Footer';
import { Login } from '@/components/Login';
import { Toaster } from '@/components/Toaster';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { useSessionToasts } from '@/hooks/useSessionToasts';
import { api, logout } from '@/lib/api';
import { Link, matchRoute, usePathname } from '@/lib/router';
import { cn } from '@/lib/utils';
import { Account } from '@/pages/Account';
import { Challenges } from '@/pages/Challenges';
import { Duel } from '@/pages/Duel';
import { GameDetail } from '@/pages/GameDetail';
import { Legal } from '@/pages/Legal';
import { Library } from '@/pages/Library';
import { Privacy } from '@/pages/Privacy';
import { PublicProfile } from '@/pages/PublicProfile';
import { Wrapped } from '@/pages/Wrapped';

const NAV = [
  { to: '/', label: 'Wrapped', icon: Sparkles, pages: ['wrapped'] },
  { to: '/jeux', label: 'Mes jeux', icon: LibraryBig, pages: ['library', 'game'] },
  { to: '/defis', label: 'Défis', icon: Swords, pages: ['challenges', 'duel', 'public'] },
];

function Header({ user, page, onSearch }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/60 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      <div className="container flex h-14 items-center justify-between gap-2 sm:gap-3">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-bold">
          <img src="/favicon.svg" alt="" className="size-6" />
          <span className="hidden min-[440px]:inline">
            Play<span className="text-gradient">Trace</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-full border bg-card/60 p-1" aria-label="Navigation principale">
          {NAV.map(({ to, label, icon: Icon, pages }) => {
            const active = pages.includes(page);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-secondary"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="relative size-3.5 sm:size-4" />
                {/* Sur très petit écran, seul l'onglet actif garde son libellé. */}
                <span className={cn('relative', !active && 'hidden min-[480px]:inline')}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={onSearch}
            aria-label="Rechercher un jeu"
            className="flex items-center gap-2 rounded-full border bg-card/60 p-2 text-sm text-muted-foreground transition-colors hover:border-neon-violet/50 hover:text-foreground lg:px-3 lg:py-1.5"
          >
            <Search className="size-4" />
            <span className="hidden lg:inline">Rechercher</span>
            <kbd className="hidden rounded border px-1.5 text-[10px] lg:inline">Ctrl K</kbd>
          </button>
          <Link to="/compte" title="Mon compte et mes données" className="flex min-w-0 items-center gap-2 rounded-full transition-opacity hover:opacity-80">
            {user.avatar && <img src={user.avatar} alt="" className="hidden size-8 shrink-0 rounded-full border min-[480px]:block" referrerPolicy="no-referrer" />}
            <span className="hidden max-w-[10rem] truncate text-sm lg:inline">{user.pseudo}</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Se déconnecter">
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}

function NotFound() {
  return (
    <div className="container flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <Gamepad2 className="size-10 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <Link to="/" className={buttonVariants()}>Retour au Wrapped</Link>
    </div>
  );
}

const TITLES = {
  wrapped: 'PlayTrace',
  library: 'Mes jeux · PlayTrace',
  challenges: 'Défis · PlayTrace',
  account: 'Mon compte · PlayTrace',
  notfound: 'Introuvable · PlayTrace',
};

function Shell({ user }) {
  const pathname = usePathname();
  const route = matchRoute(pathname);
  // Un seul flux live pour toute l'app : il survit aux changements de page.
  const live = useLiveStatus();
  useSessionToasts(live.status);
  const [isPublic, setIsPublic] = useState(Boolean(user.publicProfile));
  const [trackingPaused, setTrackingPaused] = useState(Boolean(user.trackingPaused));
  const [searchOpen, setSearchOpen] = useState(false);
  useCommandPaletteShortcut(setSearchOpen);

  useEffect(() => {
    if (TITLES[route.page]) document.title = TITLES[route.page];
  }, [route.page]);

  return (
    <>
      <Header user={user} page={route.page} onSearch={() => setSearchOpen(true)} />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <main className="min-h-dvh pt-[calc(3.5rem+env(safe-area-inset-top))]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {route.page === 'wrapped' && (
              <Wrapped user={user} live={live} isPublic={isPublic} onPublicChange={setIsPublic} trackingPaused={trackingPaused} />
            )}
            {route.page === 'account' && (
              <Account
                user={user}
                isPublic={isPublic}
                onPublicChange={setIsPublic}
                trackingPaused={trackingPaused}
                onTrackingChange={setTrackingPaused}
              />
            )}
            {route.page === 'privacy' && <Privacy />}
            {route.page === 'legal' && <Legal />}
            {route.page === 'challenges' && <Challenges user={user} isPublic={isPublic} onPublicChange={setIsPublic} />}
            {route.page === 'library' && <Library live={live} />}
            {route.page === 'game' && <GameDetail appid={route.appid} live={live} />}
            {route.page === 'public' && <PublicProfile steamid={route.steamid} viewer={user} />}
            {route.page === 'duel' && <Duel steamid={route.steamid} />}
            {route.page === 'notfound' && <NotFound />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer user={user} live={live} />
      <Toaster />
    </>
  );
}

/** Pages accessibles sans être connecté (profil public, pages légales) : en-tête minimal. */
function PublicLayout({ children }) {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/60 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-bold">
            <img src="/favicon.svg" alt="" className="size-6" />
            <span>
              Play<span className="text-gradient">Trace</span>
            </span>
          </a>
          <a href="/auth/steam" className={buttonVariants({ size: 'sm', variant: 'outline' })}>Se connecter</a>
        </div>
      </header>
      <main className="min-h-dvh pt-[calc(3.5rem+env(safe-area-inset-top))]">
        {children}
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);
  const route = matchRoute(usePathname());

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return <div className="min-h-dvh" />;
  if (!user) {
    if (route.page === 'public') return <PublicLayout><PublicProfile steamid={route.steamid} viewer={null} /></PublicLayout>;
    if (route.page === 'privacy') return <PublicLayout><Privacy /></PublicLayout>;
    if (route.page === 'legal') return <PublicLayout><Legal /></PublicLayout>;
    return <Login />;
  }
  return <Shell user={user} />;
}
