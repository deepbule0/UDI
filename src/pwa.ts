import { useEffect, useState } from 'react';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let registrationPromise: Promise<ServiceWorkerRegistration | undefined> | undefined;
function register(): Promise<ServiceWorkerRegistration | undefined> {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return Promise.resolve(undefined);
  registrationPromise ??= navigator.serviceWorker.register(new URL('sw.js', document.baseURI), { scope: './', updateViaCache: 'none' }).catch(() => undefined);
  return registrationPromise;
}

export function useInstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt>();
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const [offlineReady, setOfflineReady] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [waiting, setWaiting] = useState<ServiceWorker>();
  useEffect(() => {
    let mounted = true;
    let reloadOnControl = false;
    const installPrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const didInstall = () => { setInstalled(true); setPrompt(undefined); };
    const online = () => setOffline(false);
    const offline = () => setOffline(true);
    const controllerChange = () => { if (mounted) setOfflineReady(true); if (reloadOnControl) window.location.reload(); };
    const activate = (event: Event) => { if (event.type === 'udi:update') reloadOnControl = true; };
    window.addEventListener('beforeinstallprompt', installPrompt);
    window.addEventListener('appinstalled', didInstall);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    window.addEventListener('udi:update', activate);
    navigator.serviceWorker?.addEventListener('controllerchange', controllerChange);
    void register().then(registration => {
      if (!mounted || !registration) return;
      if (registration.waiting) setWaiting(registration.waiting);
      if (registration.active) setOfflineReady(true);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (!mounted || worker.state !== 'installed') return;
          if (registration.waiting && navigator.serviceWorker.controller) setWaiting(registration.waiting);
        });
      });
      void navigator.serviceWorker.ready.then(() => { if (mounted) setOfflineReady(true); });
    });
    return () => {
      mounted = false;
      window.removeEventListener('beforeinstallprompt', installPrompt);
      window.removeEventListener('appinstalled', didInstall);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      window.removeEventListener('udi:update', activate);
      navigator.serviceWorker?.removeEventListener('controllerchange', controllerChange);
    };
  }, []);
  return {
    canInstall: !!prompt, installed, offlineReady, offline, updateAvailable: !!waiting,
    install: async () => { if (!prompt) return; await prompt.prompt(); await prompt.userChoice; setPrompt(undefined); },
    update: () => { window.dispatchEvent(new Event('udi:update')); waiting?.postMessage({ type: 'SKIP_WAITING' }); },
  };
}
