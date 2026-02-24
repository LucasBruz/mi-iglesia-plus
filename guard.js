import { auth, db } from './firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

export function requireAuthVerifiedAndActive(){
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return window.location.href = 'login.html';
      if (!user.emailVerified) return window.location.href = 'login.html';
      const churchSnap = await getDoc(doc(db, 'iglesias', user.uid));
      if (!churchSnap.exists()) return window.location.href = 'registro.html';
      const data = churchSnap.data();
      if (data.estado === 'baneada' || data.estado === 'banneada'){
        alert('Tu iglesia está baneada. Contactá al soporte.');
        return window.location.href = 'login.html';
      }
      if (data.estado !== 'activa'){
        alert('Tu iglesia está pendiente de aprobación.');
        return window.location.href = 'login.html';
      }
      resolve(user);
    });
  });
}

export function requireSuperAdmin(){
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user || !user.emailVerified) return window.location.href = 'login.html';
      const roleSnap = await getDoc(doc(db, 'roles', user.uid));
      if (!roleSnap.exists() || roleSnap.data().role !== 'superadmin'){
        alert('No tenés permisos de SuperAdmin.');
        return window.location.href = 'index.html';
      }
      resolve(user);
    });
  });
}
