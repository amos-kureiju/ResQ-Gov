import { useSyncExternalStore } from 'react';

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

const getPath = () => window.location.hash.replace(/^#/, '') || '/';

/** Router berbasis hash — bekerja di hosting statis mana pun tanpa konfigurasi rewrite. */
export function usePath(): string {
  return useSyncExternalStore(subscribe, getPath, getPath);
}

export function navigate(path: string) {
  if (getPath() !== path) window.location.hash = path;
}
