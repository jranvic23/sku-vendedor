const CACHE_NAME = 'sku-vendedor-v4';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([
        './',
        './index.html',
        './manifest.json'
      ])
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.pathname.endsWith('/clientes.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (!response || !response.ok) throw new Error('Respuesta no valida');
          const copia = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia))
          );
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (event.request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (!response || !response.ok) throw new Error('Respuesta no valida');
          const copia = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copia))
          );
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request).then(networkResponse => {
        const copia = networkResponse.clone();
        event.waitUntil(
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia))
        );
        return networkResponse;
      })
    )
  );
});
