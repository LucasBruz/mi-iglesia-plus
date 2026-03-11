// =============================================
// SERVICE WORKER - miiglesia.online
// =============================================

const CACHE_NAME = 'miiglesia-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ---- INSTALACIÓN ----
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  // Activa el nuevo SW inmediatamente sin esperar que se cierren las tabs
  self.skipWaiting();
});

// ---- ACTIVACIÓN: borra caches viejos ----
self.addEventListener('activate', event => {
  console.log('[SW] Activado, limpiando cache viejo...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  // Toma control de todas las tabs abiertas inmediatamente
  self.clients.claim();
});

// ---- FETCH: network-first para HTML, cache-first para assets ----
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Solo manejamos requests del mismo origen
  if (url.origin !== location.origin) return;

  // Para archivos HTML → siempre red primero, cache solo si no hay red (offline)
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Guardamos la versión fresca en cache
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  // Para imágenes, JS, CSS → cache-first (más rápido, cambian menos)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// ---- MENSAJE DESDE LA APP: forzar actualización ----
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

// ---- NOTIFICACIONES PUSH ----
self.addEventListener('push', event => {
  let data = {
    title: 'Mi Iglesia+',
    body: 'Tenés un nuevo mensaje',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png'
  };
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' }
    })
  );
});

// ---- CLIC EN NOTIFICACIÓN ----
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
