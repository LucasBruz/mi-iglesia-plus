// js/ads-check-plan.js
import { app } from './firebase-init.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const auth = getAuth(app);
const db   = getFirestore(app);

auth.onAuthStateChanged(async (user) => {
  if (!user) return location.href = 'login.html';

  const snap = await getDoc(doc(db, 'iglesias', user.uid));
  const sub  = snap.data()?.subscription || {};
  const isPro = sub.planId === 'pro' && sub.status === 'active';

  document.getElementById('moduloAnuncios').style.display = isPro ? 'block' : 'none';
  document.getElementById('moduloUpgrade').style.display  = isPro ? 'none' : 'block';
});
