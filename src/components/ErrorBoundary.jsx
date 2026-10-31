import { Component } from 'react';
import { Button } from '@/components/ui/button';

/** Repart de zéro : sans service worker ni cache, le navigateur retélécharge tout. */
async function resetAndReload() {
  try {
    const registrations = await navigator.serviceWorker?.getRegistrations();
    await Promise.all((registrations ?? []).map((registration) => registration.unregister()));
    const keys = await window.caches?.keys();
    await Promise.all((keys ?? []).map((key) => window.caches.delete(key)));
  } finally {
    window.location.reload();
  }
}

/** Dernier filet : une erreur de rendu ou un fichier de page introuvable affiche ce message au lieu d'une page vide. */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">PlayTrace n'a pas pu s'afficher</h1>
        <p className="text-muted-foreground">Vérifie ta connexion, puis recharge la page.</p>
        <Button onClick={resetAndReload}>Recharger</Button>
        <p className="max-w-md break-words font-mono text-xs text-muted-foreground">{String(error.message ?? error)}</p>
      </main>
    );
  }
}
