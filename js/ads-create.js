// js/ads-create.js
import { app } from './firebase-init.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getFirestore, collection, addDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL }
  from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js';

const auth = getAuth(app);
const db   = getFirestore(app);
const st   = getStorage(app);

const $ = (id) => document.getElementById(id);

$('btnCreateAd')?.addEventListener('click', async () => {
  try {
    const user = auth.currentUser;
    if (!user) return location.href = 'login.html';

    const title = $('adTitle').value.trim();
    const href  = $('adHref').value.trim();
    const file  = $('adFile').files[0];

    if (!title || !file) {
      $('adMsg').textContent = 'Título e imagen son obligatorios.';
      return;
    }

    // Sube a carpeta propia: ads/{uid}/{timestamp}-{filename}
    const path = `ads/${user.uid}/${Date.now()}-${file.name}`;
    const storageRef = ref(st, path);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    // Crea el anuncio en estado draft (coincide con tus Firestore Rules)
    await addDoc(collection(db, 'ads'), {
      title,
      href: href || null,
      imageUrl,
      iglesiaUid: user.uid,
      status: 'draft',              // <- CLAVE
      createdAt: serverTimestamp()
    });

    $('adMsg').textContent = 'Tu anuncio se envió a moderación.';
    $('adTitle').value = '';
    $('adHref').value = '';
    $('adFile').value = '';
  } catch (e) {
    console.error(e);
    $('adMsg').textContent = 'No se pudo crear el anuncio.';
  }
});
