import { auth, db } from './firebase-init.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, setDoc, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const $ = (id) => document.getElementById(id);

async function registerChurchAdmin(){
  const email = $('email').value.trim();
  const password = $('password').value.trim();
  const nombre = $('nombre').value.trim();
  const ciudad = $('ciudad').value.trim();
  const pastor = $('pastor').value.trim();
  const telefono = $('telefono').value.trim();
  const msg = $('msg');

  if (!email || !password || !nombre || !ciudad){
    msg.textContent = 'Completá email, contraseña, nombre y ciudad.';
    return;
  }

  msg.textContent = 'Creando cuenta...';
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const churchId = cred.user.uid;

  await setDoc(doc(db, 'iglesias', churchId), {
    id: churchId,
    nombre,
    ciudad,
    pastor: pastor || '',
    telefono: telefono || '',
    adminUid: cred.user.uid,
    miembros: 0,
    emailContacto: email,
    creadoEn: serverTimestamp(),
    estado: 'pendiente'
  });

  await sendEmailVerification(cred.user);
  msg.textContent = '✅ Cuenta creada. Te enviamos un email de verificación. Revisá tu inbox/spam.';
  await signOut(auth);
}

async function login(){
  const email = $('email').value.trim();
  const password = $('password').value.trim();
  const msg = $('msg');

  msg.textContent = 'Ingresando...';
  const { user } = await signInWithEmailAndPassword(auth, email, password);

  if (!user.emailVerified){
    msg.innerHTML = '⚠️ Tu email no está verificado. <button id="resendBtn">Reenviar verificación</button>';
    document.getElementById('resendBtn').onclick = async () => {
      await sendEmailVerification(user);
      msg.textContent = '✅ Verificación reenviada. Revisá tu correo.';
    };
    return;
  }

  const snap = await getDoc(doc(db, 'iglesias', user.uid));
  const data = snap.data();
  if (!data){
    msg.textContent = 'No se encontró la iglesia asociada a tu cuenta.';
    return;
  }
  if (data.estado === 'baneada' || data.estado === 'banneada'){
    msg.textContent = '❌ Tu iglesia está baneada. Contactá al soporte.';
    return;
  }
  if (data.estado !== 'activa'){
    msg.textContent = '⏳ Tu iglesia está pendiente de aprobación. Te avisaremos por email.';
    return;
  }

  window.location.href = 'dashboard.html';
}

async function loginWithGoogle(isRegistrationFlow=false){
  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  const uid = user.uid;

  if (isRegistrationFlow){
    const churchRef = doc(db, 'iglesias', uid);
    const snap = await getDoc(churchRef);
    if (!snap.exists()){
      await setDoc(churchRef, {
        id: uid,
        nombre: 'Mi nueva iglesia',
        ciudad: '',
        pastor: '',
        telefono: '',
        adminUid: uid,
        miembros: 0,
        emailContacto: user.email || '',
        creadoEn: serverTimestamp(),
        estado: 'pendiente'
      });
    }
    window.location.href = 'dashboard.html';
    return;
  }

  const churchRef = doc(db, 'iglesias', uid);
  const snap = await getDoc(churchRef);
  if (!snap.exists()){
    window.location.href = 'registro.html';
    return;
  }
  const data = snap.data();
  if (data.estado === 'baneada' || data.estado === 'banneada'){
    $('msg')?.textContent = '❌ Tu iglesia está baneada. Contactá al soporte.';
    return;
  }
  if (data.estado !== 'activa'){
    $('msg')?.textContent = '⏳ Tu iglesia está pendiente de aprobación.';
    return;
  }

  window.location.href = 'dashboard.html';
}

async function resetPassword(){
  const email = $('email').value.trim();
  const msg = $('msg');
  if (!email){ msg.textContent = 'Ingresá tu email para enviar el reseteo.'; return; }
  await sendPasswordResetEmail(auth, email);
  msg.textContent = '📬 Te enviamos un email para resetear la contraseña.';
}

async function logout(){
  await signOut(auth);
  window.location.href = 'index.html';
}

document.getElementById('btnRegister')?.addEventListener('click', () => registerChurchAdmin().catch(showErr));
document.getElementById('btnLogin')?.addEventListener('click', () => login().catch(showErr));
document.getElementById('btnLogout')?.addEventListener('click', () => logout().catch(showErr));
document.getElementById('btnGoogle')?.addEventListener('click', () => loginWithGoogle(true).catch(showErr));
document.getElementById('btnGoogleLogin')?.addEventListener('click', () => loginWithGoogle(false).catch(showErr));
document.getElementById('btnReset')?.addEventListener('click', () => resetPassword().catch(showErr));

function showErr(e){
  console.error(e);
  const msg = document.getElementById('msg');
  if (msg) msg.textContent = '❌ ' + (e?.message or 'Error inesperado');
}

export { onAuthStateChanged };
