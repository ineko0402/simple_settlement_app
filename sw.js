const CACHE_NAME = 'accounting-app-v4';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './ledger.css',
  './manifest.json',
  './js/main.js',
  './js/theme.js',
  './js/navigation.js',
  './js/swipe.js',
  './js/settlement.js',
  './js/nyukin.js',
  './js/import-tax.js',
  './js/ledger.js',
  './js/ledger-storage.js',
  './js/ledger-summary.js',
  './js/fab.js',
  './js/keyboard.js',
  './js/utils.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames
        .filter(cacheName => cacheName !== CACHE_NAME)
        .map(cacheName => caches.delete(cacheName))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
