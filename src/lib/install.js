import { useSyncExternalStore } from 'react';

// Invitation d'installation (Chrome, Edge, Android). Safari iOS n'en a pas : on y donne la marche à suivre.
let deferredPrompt = null;
const listeners = new Set();

function emit() {
  for (const listener of listeners) listener();
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    emit();
  });
}

const standalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const ios = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

/** `'prompt'` (bouton natif dispo), `'ios'` (instructions), ou `null` (déjà installée / pas possible). */
export function useInstallState() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => (standalone() ? null : deferredPrompt ? 'prompt' : ios() ? 'ios' : null),
  );
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  emit();
  return outcome === 'accepted';
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}
