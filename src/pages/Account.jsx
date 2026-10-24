import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Download, LogOut, Pause, Play, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProfileToggle } from '@/components/ShareProfileDialog';
import { api } from '@/lib/api';
import { formatDate, formatRelative } from '@/lib/format';
import { Link } from '@/lib/router';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

function Section({ icon: Icon, title, description, children, tone }) {
  return (
    <Card className={cn('bg-card/80 p-5 sm:p-6', tone === 'danger' && 'border-destructive/40 bg-destructive/[0.04]')}>
      <div className="mb-4 flex items-start gap-3">
        <Icon className={cn('mt-0.5 size-5 shrink-0', tone === 'danger' ? 'text-destructive' : 'text-neon-cyan')} />
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

/** Compte et données : suivi, profil public, export, sessions, suppression (RGPD en libre-service). */
export function Account({ user, isPublic, onPublicChange, trackingPaused, onTrackingChange }) {
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);

  useEffect(() => {
    document.title = 'Mon compte · PlayTrace';
  }, []);

  async function toggleTracking() {
    setSaving(true);
    try {
      const { trackingPaused: paused } = await api.setTracking(!trackingPaused);
      onTrackingChange(paused);
      toast({
        title: paused ? 'Suivi en pause' : 'Suivi relancé',
        description: paused ? 'PlayTrace n’interroge plus Steam pour ton compte.' : 'Tes prochaines parties seront enregistrées.',
        tone: paused ? 'info' : 'done',
      });
    } catch (error) {
      toast({ title: 'Impossible de changer le suivi', description: error.message, tone: 'info' });
    } finally {
      setSaving(false);
    }
  }

  async function logoutEverywhere() {
    await api.logoutAll().catch(() => {});
    window.location.assign('/');
  }

  async function remove(event) {
    event.preventDefault();
    setDeleting(true);
    try {
      await api.deleteAccount(confirm);
      window.location.assign('/?compte=supprime');
    } catch (error) {
      if (error.status === 403) setNeedsReauth(true);
      else toast({ title: 'Suppression impossible', description: error.message, tone: 'info' });
      setDeleting(false);
    }
  }

  return (
    <div className="container py-10 sm:py-14">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        {user.avatar ? (
          <img src={user.avatar} alt="" referrerPolicy="no-referrer" className="size-16 rounded-full border-2 border-white/15 sm:size-20" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full bg-secondary"><UserRound /></span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon-cyan">Mon compte</p>
          <h1 className="truncate text-[clamp(1.75rem,6vw,2.5rem)] font-black leading-tight">{user.pseudo}</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            SteamID64 {user.steamid} · inscrit le {formatDate(user.createdAt)}
            {user.lastLoginAt && <> · connecté {formatRelative(user.lastLoginAt)}</>}
          </p>
        </div>
      </motion.header>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Section
          icon={trackingPaused ? Pause : Play}
          title="Suivi des sessions"
          description="En pause, PlayTrace n’interroge plus Steam pour toi. Tes stats déjà enregistrées restent visibles."
        >
          <button
            type="button"
            role="switch"
            aria-checked={!trackingPaused}
            disabled={saving}
            onClick={toggleTracking}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors',
              trackingPaused ? 'hover:bg-secondary/50' : 'border-neon-lime/40 bg-neon-lime/[0.06]',
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{trackingPaused ? 'Suivi en pause' : 'Suivi actif'}</p>
              <p className="text-xs text-muted-foreground">{trackingPaused ? 'Aucune nouvelle session n’est enregistrée.' : 'Chaque partie est enregistrée, même onglet fermé.'}</p>
            </div>
            <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', trackingPaused ? 'bg-secondary' : 'bg-neon-lime')}>
              <motion.span layout className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow', trackingPaused ? 'left-0.5' : 'right-0.5')} />
            </span>
          </button>
        </Section>

        <Section icon={ShieldCheck} title="Profil public" description="Désactivé par défaut. Réversible à tout moment.">
          <ProfileToggle user={user} isPublic={isPublic} onChange={onPublicChange} />
        </Section>

        <Section
          icon={Download}
          title="Mes données"
          description="Tout ce que PlayTrace sait de toi : compte, sessions, bibliothèque, succès, téléchargements."
        >
          <a href="/api/me/export" download className={buttonVariants({ variant: 'outline' })}>
            <Download />
            Exporter mes données (JSON)
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
            Détails dans la <Link to="/confidentialite" className="text-neon-cyan hover:underline">politique de confidentialité</Link>.
          </p>
        </Section>

        <Section
          icon={LogOut}
          title="Sécurité"
          description="Ta session dure 14 jours au plus. Un appareil perdu ou un doute ? Coupe toutes les sessions d’un coup."
        >
          <Button variant="outline" onClick={logoutEverywhere}>
            <LogOut />
            Se déconnecter de tous les appareils
          </Button>
        </Section>
      </div>

      <div className="mt-4">
        <Section
          icon={AlertTriangle}
          tone="danger"
          title="Supprimer mon compte"
          description="Efface immédiatement et définitivement ton compte, tes sessions, ta bibliothèque et tes réglages. Irréversible."
        >
          {needsReauth ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">Par sécurité, reconnecte-toi avec Steam pour confirmer (connexion de moins de 15 minutes requise).</p>
              <a href="/auth/steam?next=/compte" className={cn(buttonVariants(), 'shrink-0')}>Se reconnecter avec Steam</a>
            </div>
          ) : (
            <form onSubmit={remove} className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="confirm-delete" className="sr-only">Écris SUPPRIMER pour confirmer</label>
              <input
                id="confirm-delete"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Écris SUPPRIMER pour confirmer"
                autoComplete="off"
                className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:border-destructive/60"
              />
              <Button type="submit" disabled={confirm !== 'SUPPRIMER' || deleting} className="h-10 shrink-0 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Trash2 />
                {deleting ? 'Suppression…' : 'Supprimer définitivement'}
              </Button>
            </form>
          )}
        </Section>
      </div>
    </div>
  );
}
