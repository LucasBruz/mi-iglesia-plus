// firebase-messaging-sw.js
// Debe estar en la RAÍZ del proyecto (mismo nivel que index.html)

importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBOj5yJQ2kcU4_xrUY1sDPB3XU3lWupX-A",
  authDomain: "miiglesia-plus.firebaseapp.com",
  projectId: "miiglesia-plus",
  storageBucket: "miiglesia-plus.firebasestorage.app",
  messagingSenderId: "407699856167",
  appId: "1:407699856167:web:5d421d407ab7c9789aa702"
});

const messaging = firebase.messaging();

// Notificaciones cuando la app está en BACKGROUND o cerrada
messaging.onBackgroundMessage(payload => {
  console.log('[FCM] Mensaje en background:', payload);

  const { title, body, icon, url } = payload.notification || {};

  self.registration.showNotification(title || 'Mi Iglesia+', {
    body: body || 'Tenés un nuevo mensaje',
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: { url: url || '/' }
  });
});

// Al hacer clic en la notificación → abrir la URL
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
