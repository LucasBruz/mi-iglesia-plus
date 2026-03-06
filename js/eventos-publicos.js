// js/eventos-publicos.js
import { db } from './firebase-init.js';
import {
  collection, query, where, orderBy, getDocs
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const cont = document.getElementById('adsGrid');

(async () => {
  if (!cont) {
    console.warn("adsGrid no encontrado en el DOM");
    return;
  }

  try {
    const q = query(
      collection(db, 'ads'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      cont.innerHTML = '<div class="no-results" style="text-align:center;color:#666">No hay eventos destacados por ahora.</div>';
      return;
    }

    cont.innerHTML = '';

    snap.forEach(doc => {
      const a = doc.data();
      console.log("EVENTO CARGADO:", a);

      const imgTag = a.imageUrl
        ? `<img class="ad-img" src="${a.imageUrl}" alt="${a.title || 'Evento'}">`
        : `<div class="ad-img"></div>`;

      const cardInner = `
        ${imgTag}
        <div class="ad-body">
          <div class="ad-title">${a.title || 'Evento'}</div>
          <div class="ad-meta">${a.href ? 'Ver más' : ''}</div>
        </div>
      `;

      const cardHtml = a.href
        ? `<a href="${a.href}" class="ad-card" target="_blank" rel="noopener">${cardInner}</a>`
        : `<div class="ad-card">${cardInner}</div>`;

      cont.insertAdjacentHTML('beforeend', cardHtml);
    });

  } catch (e) {
    console.error("ERROR cargando eventos destacados:", e);
    cont.innerHTML = '<div class="no-results" style="text-align:center;color:#666">No se pudieron cargar los eventos.</div>';
  }
})();
