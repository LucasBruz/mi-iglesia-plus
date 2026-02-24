import { db } from './firebase-init.js';
import { requireSuperAdmin } from './guard.js';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const $ = (id) => document.getElementById(id);

(async function init(){
  await requireSuperAdmin();
  await loadChurches();
})();

async function loadChurches(){
  $('msg').textContent = 'Cargando iglesias...';
  const q = query(collection(db, 'iglesias'), orderBy('creadoEn', 'desc'));
  const snap = await getDocs(q);
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render(rows);
  $('msg').textContent = '';
}

function render(list){
  const tbody = $('tbody');
  tbody.innerHTML = '';
  list.forEach(i => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i.nombre || '-'}</td>
      <td>${i.ciudad || '-'}</td>
      <td>${i.pastor || '-'}</td>
      <td class="tags">${i.adminUid}</td>
      <td><strong>${i.estado}</strong></td>
      <td>
        <div class="row">
          <button data-id="${i.id}" data-act="aprobar">Aprobar</button>
          <button data-id="${i.id}" data-act="banear" class="btn-gray">Banear</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const act = e.currentTarget.getAttribute('data-act');
      const ref = doc(db, 'iglesias', id);
      if (act === 'aprobar'){
        await updateDoc(ref, { estado: 'activa' });
      } else if (act === 'banear'){
        await updateDoc(ref, { estado: 'baneada' });
      }
      await loadChurches();
    });
  });
}
