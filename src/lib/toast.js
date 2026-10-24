import { useSyncExternalStore } from 'react';

// Petit magasin de notifications : n'importe quel module peut appeler `toast()`, <Toaster /> les affiche.
const listeners = new Set();
let toasts = [];
let nextId = 1;

function emit() {
  for (const listener of listeners) listener();
}

export function dismiss(id) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

/** `{ title, description, tone: 'live' | 'done' | 'info', to?, duration? }` */
export function toast({ duration = 7000, ...options }) {
  const id = nextId;
  nextId += 1;
  toasts = [...toasts.slice(-2), { id, ...options }];
  emit();
  setTimeout(() => dismiss(id), duration);
  return id;
}

export function useToasts() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => toasts,
  );
}
