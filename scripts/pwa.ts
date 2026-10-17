import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

export function phoneAppWorker(): Plugin {
  return {
    name: 'udi-phone-offline-shell', apply: 'build', enforce: 'post',
    generateBundle(_options, bundle) {
      const publicFiles = ['manifest.webmanifest', 'favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'];
      const files = [...Object.keys(bundle), ...publicFiles].filter(file => !file.endsWith('.map'));
      const hash = createHash('sha256').update(JSON.stringify(files));
      for (const file of Object.values(bundle)) hash.update(file.type === 'chunk' ? file.code : file.source);
      for (const file of publicFiles) hash.update(readFileSync(new URL(`../public/${file}`, import.meta.url)));
      const version = hash.digest('hex').slice(0, 16);
      const source = `/* UDI Pocket: cache the public app shell only, never API responses or private records. */
const BASE = new URL(self.registration.scope);
const PREFIX = 'udi-pocket:' + BASE.pathname + ':';
const CACHE = PREFIX + ${JSON.stringify(version)};
const FILES = ${JSON.stringify(files.map(f => './' + f))};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new Request(new URL(file, BASE), { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  const relative = url.pathname.slice(BASE.pathname.length);
  if (request.mode === 'navigate') {
    if (!['', 'index.html', 'mobile.html'].includes(relative)) return;
    const key = new URL(relative === 'mobile.html' ? 'mobile.html' : 'index.html', BASE);
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(key)) || fetch(request)));
    return;
  }
  if (!FILES.some(file => new URL(file, BASE).pathname === url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(url.pathname)) || fetch(request)));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
