// Service Worker para PWA - Nablijven Systeem
const CACHE_NAME = 'nablijven-v2';
const STATIC_CACHE = 'nablijven-static-v2';

/** Solo se pueden cachear peticiones http/https del mismo origen (no chrome-extension, blob, etc.) */
function isCacheableRequest(request) {
  try {
    const url = new URL(request.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    if (url.origin !== self.location.origin) {
      return false;
    }
    if (url.pathname.startsWith('/api/')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Instalación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(['/', '/manifest.json']).catch(() => {
        // Ignorar fallos de precache en entornos restrictivos
      });
    })
  );
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Extensiones del navegador, analytics externos, etc.: pasar sin cachear
  if (!isCacheableRequest(event.request)) {
    if (event.request.url.includes('/api/')) {
      event.respondWith(
        fetch(event.request).catch(() => {
          return new Response(JSON.stringify({ error: 'Offline' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );
    }
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {
              // Ignorar errores de cache (p. ej. esquemas no soportados)
            });
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
