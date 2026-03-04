// js/eventos-publicos.js
import { db } from './firebase-init.js';
import {
  collection, query, where, orderBy, getDocs
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const cont = document.getElementById('adsGrid');

(async () => {
  if (!cont) return;

  try {
    const q = query(
      collection(db, 'ads'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      cont.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;color:#666">No hay eventos destacados por ahora.</div>';
      return;
    }

    cont.innerHTML = '';
    snap.forEach(doc => {
      const a = doc.data();
      const img = a.imageUrl
        ? `<img class="ad-img" src="${a.imageUrl}" alt="${a.title || 'Evento'}" loading="lazy" decoding="async">`
        : `<div class="ad-img" aria-hidden="true"></div>`;
      const linkOpen = a.href ? `<a class="ad-card" href="${a.href}" target="_blank" rel="noopener">` : `<div class="ad-card">`;
      const linkClose = a.href ? `</a>` : `</div>`;

      cont.insertAdjacentHTML('beforeend', `
        ${linkOpen}
          ${img}
          <div class="ad-body">
            <div class="ad-title">${a.title || 'Evento'}</div>
            <div class="ad-meta">${a.href ? 'Ver más' : ''}</div>
          </div>
        ${linkClose}
      `);
    });
  } catch (e) {
    console.error('No se pudieron cargar los eventos destacados', e);
    cont.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;color:#666">No se pudieron cargar los eventos.</div>';
  }
})();
