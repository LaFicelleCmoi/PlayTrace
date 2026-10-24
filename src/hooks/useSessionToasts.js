import { useEffect, useRef } from 'react';
import { formatDuration } from '@/lib/format';
import { toast } from '@/lib/toast';

function notify({ title, description, tone, to }) {
  toast({ title, description, tone, to });
  // Onglet en arrière-plan : notification système, si le joueur l'a autorisée.
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: description, icon: '/favicon.svg', tag: 'playtrace-session' });
  }
}

/** Prévient quand une partie commence ou se termine, d'après le statut live. */
export function useSessionToasts(status) {
  const previous = useRef(null);

  useEffect(() => {
    if (!status) return;
    const before = previous.current;
    previous.current = status;
    // Premier état reçu (ouverture de la page) : ce n'est pas un événement.
    if (!before || before.sessionId === status.sessionId) return;

    if (before.playing) {
      const seconds = (Date.now() - Date.parse(before.startedAt)) / 1000;
      notify({
        title: 'Session enregistrée',
        description: `${formatDuration(seconds)} sur ${before.gameName.trim()}`,
        tone: 'done',
        to: `/jeux/${before.appid}`,
      });
    }
    if (status.playing) {
      notify({
        title: 'Partie détectée',
        description: `Tu joues à ${status.gameName.trim()} : le suivi est lancé.`,
        tone: 'live',
        to: `/jeux/${status.appid}`,
      });
    }
  }, [status]);
}
