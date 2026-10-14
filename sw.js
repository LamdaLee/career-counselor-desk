var CACHE_PREFIX = 'career-counselor-desk-';
var CACHE = CACHE_PREFIX + 'v10';
var FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/room.css',
  './css/game.css',
  './css/u015.css',
  './css/u028.css',
  './css/u044.css',
  './css/u070.css',
  './js/room.js',
  './js/game.js',
  './js/library-data.js',
  './js/library.js',
  './js/about.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key.indexOf(CACHE_PREFIX) === 0 && key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  if (!FILES.some(function (file) { return new URL(file, self.registration.scope).href === event.request.url; })) return;
  event.respondWith(
    fetch(event.request).then(function (response) {
      if (response.ok) {
        var copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.put(event.request, copy); }));
      }
      return response;
    }).catch(function () { return caches.match(event.request); })
  );
});
