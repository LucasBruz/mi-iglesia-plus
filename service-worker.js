// =============================================
// SERVICE WORKER - miiglesia.online
// =============================================

const CACHE_NAME = 'miiglesia-v1';

// Archivos que se guardan en caché para uso offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
  // Agregá acá tus archivos CSS y JS principales:
  // '/css/styles.css',
  // '/js/main.js',
];

// ---- INSTALACIÓN ----
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ---- ACTIVACIÓN ----
self.addEventListener('activate', event => {
  console.log('[SW] Activado');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---- FETCH (responder con caché si no hay internet) ----
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => {
        // Si falla la red y no hay caché, mostrá la página principal
        return caches.match('/index.html');
      });
    })
  );
});

// ---- NOTIFICACIONES PUSH ----
self.addEventListener('push', event => {
  let data = {
    title: 'Mi Iglesia',
    body: 'Tenés un nuevo mensaje',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png'
  };

  // Si el servidor manda datos, los usamos
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
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
      // Si ya hay una ventana abierta, la enfocamos
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrimos una nueva
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
