// /js/eventos-publicos.js
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

      // Imagen: usa la URL exacta de Firestore (campo imageUrl)
      const imgTag = a.imageUrl
        ? `<img class="ad-img" src="${a.imageUrl}" alt="${a.title || 'Evento'}" loading="lazy" decoding="async">`
        : `<div class="ad-img" aria-hidden="true"></div>`;

      // Contenido interno de la tarjeta (siempre mantiene .ad-card)
      const cardInner = `
        ${imgTag}
        <div class="ad-body">
          <div class="ad-title">${a.title || 'Evento'}</div>
          <div class="ad-meta">${a.href ? 'Ver más' : ''}</div>
        </div>
      `;

      // Si existe a.href, la tarjeta completa es clickeable con <a>
      const cardHtml = a.href
        ? `
          <a class="ad-card-link" href="${a.href}" target="_blank" rel="noopener">
            <div class="ad-card">
              ${cardInner}
            </div>
          </a>
        `
        : `
          <div class="ad-card">
            ${cardInner}
          </div>
        `;

      cont.insertAdjacentHTML('beforeend', cardHtml);
    });
  } catch (e) {
    console.error('No se pudieron cargar los eventos destacados', e);
    cont.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;color:#666">No se pudieron cargar los eventos.</div>';
  }
})();
