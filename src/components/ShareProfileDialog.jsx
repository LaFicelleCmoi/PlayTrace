import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, Globe, Lock, Swords, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { navigate } from '@/lib/router';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const SHARED = ['Heures de jeu et sessions', 'Top 5 et jeu de l’année', 'Personnalité et badges', 'Calendrier de l’année'];
const HIDDEN = ['Détail et horaires des sessions', 'Partie en cours', 'Téléchargements'];

/** Réglage du profil public, lien à partager et lancement d'un duel. */
export function ShareProfileDialog({ open, onClose, user, isPublic, onChange }) {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [friend, setFriend] = useState('');
  const link = `${window.location.origin}/joueur/${user.steamid}`;
  const friendId = /7656119\d{10}/.exec(friend)?.[0];

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function toggle() {
    setSaving(true);
    try {
      const { publicProfile } = await api.setPublicProfile(!isPublic);
      onChange(publicProfile);
      toast({
        title: publicProfile ? 'Profil public activé' : 'Profil redevenu privé',
        description: publicProfile ? 'Ton lien est prêt à être partagé.' : 'Le lien ne montre plus rien.',
        tone: publicProfile ? 'done' : 'info',
      });
    } catch (error) {
      toast({ title: 'Impossible de changer le réglage', description: error.message, tone: 'info' });
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="share-title" className="text-xl font-bold">Profil public</h2>
                <p className="mt-1 text-sm text-muted-foreground">Partage ton Wrapped et défie tes amis.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              disabled={saving}
              onClick={toggle}
              className={cn(
                'mt-5 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                isPublic ? 'border-neon-lime/40 bg-neon-lime/[0.06]' : 'hover:bg-secondary/50',
              )}
            >
              {isPublic ? <Globe className="size-5 shrink-0 text-neon-lime" /> : <Lock className="size-5 shrink-0 text-muted-foreground" />}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{isPublic ? 'Ton Wrapped est public' : 'Ton Wrapped est privé'}</p>
                <p className="text-xs text-muted-foreground">{isPublic ? 'Toute personne avec le lien peut le voir.' : 'Active-le pour obtenir un lien à partager.'}</p>
              </div>
              <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', isPublic ? 'bg-neon-lime' : 'bg-secondary')}>
                <motion.span layout className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow', isPublic ? 'right-0.5' : 'left-0.5')} />
              </span>
            </button>

            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <p className="mb-1.5 font-semibold text-foreground/80">Visible</p>
                <ul className="space-y-1 text-muted-foreground">
                  {SHARED.map((item) => (
                    <li key={item} className="flex items-center gap-1.5"><Check className="size-3.5 text-neon-lime" />{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 font-semibold text-foreground/80">Jamais partagé</p>
                <ul className="space-y-1 text-muted-foreground">
                  {HIDDEN.map((item) => (
                    <li key={item} className="flex items-center gap-1.5"><Lock className="size-3.5" />{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {isPublic && (
              <div className="mt-5 flex gap-2">
                <input readOnly value={link} onFocus={(event) => event.target.select()} className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm text-muted-foreground" />
                <Button onClick={copy} variant="outline" className="h-10 shrink-0">
                  {copied ? <Check /> : <Copy />}
                  {copied ? 'Copié' : 'Copier'}
                </Button>
              </div>
            )}

            <form
              className="mt-6 border-t pt-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!friendId) return;
                onClose();
                navigate(`/duel/${friendId}`);
              }}
            >
              <label htmlFor="friend" className="flex items-center gap-2 text-sm font-semibold">
                <Swords className="size-4 text-neon-pink" />
                Défier un ami
              </label>
              <p className="mt-1 text-xs text-muted-foreground">Colle le lien de son profil PlayTrace (ou son SteamID64). Son profil doit être public.</p>
              <div className="mt-3 flex gap-2">
                <input
                  id="friend"
                  value={friend}
                  onChange={(event) => setFriend(event.target.value)}
                  placeholder="https://…/joueur/7656119…"
                  className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:border-neon-violet/60"
                />
                <Button type="submit" disabled={!friendId || friendId === user.steamid} className="h-10 shrink-0">
                  Duel
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
