// js/eventos-publicos.js (versión simple sin orderBy)
import { db } from './firebase-init.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const cont = document.getElementById('adsGrid');

(async () => {
  if (!cont) return;

  cont.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;color:#666">Cargando eventos…</div>';

  try {
    // Sin orderBy para evitar exigir índice compuesto
    const q = query(collection(db, 'ads'), where('status', '==', 'approved'));
    const snap = await getDocs(q);

    if (snap.empty) {
      cont.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;color:#666">No hay eventos destacados por ahora.</div>';
      return;
    }

    cont.innerHTML = '';

    snap.forEach(d => {
      const a = d.data();
      const img = (a.imageUrl || '').trim();

      const imgTag = img
        ? `<img class="ad-img" src="${img}" alt="${(a.title || 'Evento').replace(/"/g, '&quot;')}" loading="lazy" decoding="async">`
        : `<div class="ad-img" aria-hidden="true"></div>`;

      const cardInner = `
        ${imgTag}
        <div class="ad-body">
          <div class="ad-title">${a.title || 'Evento'}</div>
          <div class="ad-meta">${a.href ? 'Ver más' : ''}</div>
        </div>
      `;

      const html = a.href
        ? `<a class="ad-card" href="${a.href}" target="_blank" rel="noopener">${cardInner}</a>`
        : `<div class="ad-card">${cardInner}</div>`;

      cont.insertAdjacentHTML('beforeend', html);
    });

  } catch (e) {
    cont.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;color:#666">No se pudieron cargar los eventos.</div>';
  }
})();
