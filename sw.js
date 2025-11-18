// sw.js - Service Worker corregido para GitHub Pages
const CACHE_NAME = 'mindhub-v1.4';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './js/main.js',
  './js/partida.js', 
  './js/utils.js',
  './js/niveles.js',
  './js/usuario.js',
  './js/config.js',
  './js/bancoPreguntas.js',
  './js/logros.js',
  './avatars/default-avatar.png',
  './manifest.json'
];

self.addEventListener('install', function(event) {
  console.log('Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});