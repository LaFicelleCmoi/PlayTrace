import { PictureInPicture2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isPipSupported, togglePip, usePipOpen } from '@/lib/pipTimer';
import { toast } from '@/lib/toast';

/** Bouton du chrono toujours au premier plan ; absent si le navigateur ne le permet pas (mobile, Firefox, Safari). */
export function PipButton({ className }) {
  const open = usePipOpen();
  if (!isPipSupported()) return null;

  const toggle = () =>
    togglePip().catch(() => toast({ title: 'Mode PiP indisponible', description: 'Le navigateur a refusé d’ouvrir la fenêtre.', tone: 'info' }));

  return (
    <Button variant="outline" size="sm" className={className} aria-pressed={open} onClick={toggle}>
      <PictureInPicture2 />
      {open ? 'Fermer le PiP' : 'Mode PiP'}
    </Button>
  );
}
