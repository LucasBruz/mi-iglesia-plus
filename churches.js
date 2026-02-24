import { db } from './firebase-init.js';
import { requireAuthVerifiedAndActive } from './guard.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const $ = (id) => document.getElementById(id);

(async function init(){
  const user = await requireAuthVerifiedAndActive();
  const ref = doc(db, 'iglesias', user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()){
    $('msg').textContent = '⚠️ No se encontró la iglesia asociada a tu cuenta.';
    return;
  }

  const data = snap.data();
  $('nombre').value = data.nombre || '';
  $('ciudad').value = data.ciudad || '';
  $('pastor').value = data.pastor || '';
  $('telefono').value = data.telefono || '';
  $('miembros').value = data.miembros ?? 0;

  $('btnSave').addEventListener('click', async () => {
    $('msg').textContent = 'Guardando...';
    await updateDoc(ref, {
      nombre: $('nombre').value.trim(),
      ciudad: $('ciudad').value.trim(),
      pastor: $('pastor').value.trim(),
      telefono: $('telefono').value.trim(),
      miembros: Number($('miembros').value || 0)
    });
    $('msg').textContent = '✅ Cambios guardados.';
  });
})();
