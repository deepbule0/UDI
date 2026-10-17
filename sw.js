/* UDI Pocket: cache the public app shell only, never API responses or private records. */
const BASE = new URL(self.registration.scope);
const PREFIX = 'udi-pocket:' + BASE.pathname + ':';
const CACHE = PREFIX + "bc1e0328a64330b2";
const FILES = ["./assets/desktop-EzFcwXgS.js","./assets/mobile-DzSYI9Us.js","./assets/session-44cKxWLd.js","./assets/desktop-vEfTTywj.css","./assets/dm-sans-latin-ext-wght-normal-BOFOeGcA.woff2","./assets/dm-sans-latin-wght-normal-Xz1IZZA0.woff2","./assets/manrope-cyrillic-wght-normal-Dvxsihut.woff2","./assets/manrope-greek-wght-normal-DL7QRZyv.woff2","./assets/manrope-latin-ext-wght-normal-Ch3YOpNY.woff2","./assets/manrope-latin-wght-normal-DHIcAJRg.woff2","./assets/manrope-vietnamese-wght-normal-usUDDRr7.woff2","./assets/mobile-52eNPA02.css","./index.html","./mobile.html","./manifest.webmanifest","./favicon.svg","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png","./icons/apple-touch-icon.png"];
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
