// =============================================
// PWA INIT - Pegá este script en tu index.html
// <script src="/pwa-init.js"></script>
// =============================================

// ---------- 1. REGISTRAR SERVICE WORKER ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[PWA] Service Worker registrado:', reg.scope);
      
      // Intentar activar notificaciones automáticamente al registrar
      await solicitarPermisoNotificaciones(reg);

    } catch (err) {
      console.error('[PWA] Error al registrar SW:', err);
    }
  });
}

// ---------- 2. PEDIR PERMISO PARA NOTIFICACIONES ----------
async function solicitarPermisoNotificaciones(reg) {
  if (!('Notification' in window) || !('PushManager' in window)) {
    console.log('[PWA] Este navegador no soporta notificaciones push');
    return;
  }

  if (Notification.permission === 'granted') {
    console.log('[PWA] Notificaciones ya habilitadas');
    await suscribirAPush(reg);
    return;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[PWA] Permiso otorgado');
      await suscribirAPush(reg);
    }
  }
}

// ---------- 3. SUSCRIBIR AL USUARIO A PUSH ----------
async function suscribirAPush(reg) {
  try {
    // ⚠️ REEMPLAZÁ esta clave con la tuya de Firebase Cloud Messaging
    // La encontrás en: Firebase Console → Configuración del proyecto → Cloud Messaging → Certificados web push
    const VAPID_PUBLIC_KEY = 'TU_VAPID_PUBLIC_KEY_DE_FIREBASE_AQUI';

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('[PWA] Suscripción push creada:', JSON.stringify(subscription));

    // 📤 Mandá esta suscripción a tu backend/Firebase para guardarla
    // Ejemplo con fetch a tu función de Firebase:
    /*
    await fetch('/api/guardar-suscripcion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    */

  } catch (err) {
    console.error('[PWA] Error al suscribir a push:', err);
  }
}

// ---------- 4. BOTÓN "INSTALAR APP" ----------
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Mostrá el botón de instalación si tenés uno con id="btn-instalar"
  const btnInstalar = document.getElementById('btn-instalar');
  if (btnInstalar) {
    btnInstalar.style.display = 'block';
    btnInstalar.addEventListener('click', async () => {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Resultado instalación:', outcome);
      deferredPrompt = null;
      btnInstalar.style.display = 'none';
    });
  }
});

window.addEventListener('appinstalled', () => {
  console.log('[PWA] ¡App instalada exitosamente!');
  deferredPrompt = null;
});

// ---------- UTILIDAD ----------
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}
