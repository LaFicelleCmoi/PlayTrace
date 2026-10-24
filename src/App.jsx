import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Gamepad2, LibraryBig, LogOut, Sparkles } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { Login } from '@/components/Login';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { api, logout } from '@/lib/api';
import { Link, matchRoute, usePathname } from '@/lib/router';
import { cn } from '@/lib/utils';
import { GameDetail } from '@/pages/GameDetail';
import { Library } from '@/pages/Library';
import { Wrapped } from '@/pages/Wrapped';

const NAV = [
  { to: '/', label: 'Wrapped', icon: Sparkles, pages: ['wrapped'] },
  { to: '/jeux', label: 'Mes jeux', icon: LibraryBig, pages: ['library', 'game'] },
];

function Header({ user, page }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/60 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      <div className="container flex h-14 items-center justify-between gap-2 sm:gap-3">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-bold">
          <img src="/favicon.svg" alt="" className="size-6" />
          <span className="hidden min-[380px]:inline">
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
                  'relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
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
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          {user.avatar && <img src={user.avatar} alt="" className="hidden size-8 shrink-0 rounded-full border min-[480px]:block" referrerPolicy="no-referrer" />}
          <span className="hidden max-w-[10rem] truncate text-sm lg:inline">{user.pseudo}</span>
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

const TITLES = { wrapped: 'PlayTrace', library: 'Mes jeux · PlayTrace', notfound: 'Introuvable · PlayTrace' };

function Shell({ user }) {
  const pathname = usePathname();
  const route = matchRoute(pathname);
  // Un seul flux live pour toute l'app : il survit aux changements de page.
  const live = useLiveStatus();

  useEffect(() => {
    if (TITLES[route.page]) document.title = TITLES[route.page];
  }, [route.page]);

  return (
    <>
      <Header user={user} page={route.page} />
      <main className="min-h-dvh pt-[calc(3.5rem+env(safe-area-inset-top))]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {route.page === 'wrapped' && <Wrapped user={user} live={live} />}
            {route.page === 'library' && <Library live={live} />}
            {route.page === 'game' && <GameDetail appid={route.appid} live={live} />}
            {route.page === 'notfound' && <NotFound />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer user={user} live={live} />
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return <div className="min-h-dvh" />;
  if (!user) return <Login />;
  return <Shell user={user} />;
}
