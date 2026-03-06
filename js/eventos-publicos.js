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

  // mensaje de carga (opcional)
  cont.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;color:#666">Cargando eventos…</div>';

  try {
    // 1) Intento con orderBy (requiere índice compuesto en Firestore)
    let q = query(
      collection(db, 'ads'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    let snap;
    try {
      snap = await getDocs(q);
    } catch (err) {
      // 2) Si no existe el índice, reintento sin orderBy para no romper la UI
      console.warn('Reintentando sin orderBy (puede faltar índice en Firestore)', err);
      q = query(
        collection(db, 'ads'),
        where('status', '==', 'approved')
      );
      snap = await getDocs(q);
    }

    if (snap.empty) {
      cont.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;color:#666">No hay eventos destacados por ahora.</div>';
      return;
    }

    cont.innerHTML = '';

    snap.forEach(d => {
      const a = d.data();

      // ✅ <img> correcta
      const altText = (a.title || 'Evento').replace(/"/g, '&quot;');
      const imgTag = a.imageUrl
        ? `<img class="ad-img" src="${a.imageUrl}" alt="${altText}" loading="lazy" decoding="async">`
        : `<div class="ad-img" aria-hidden="true"></div>`;

      const cardInner = `
        ${imgTag}
        <div class="ad-body">
          <div class="ad-title">${a.title || 'Evento'}</div>
          <div class="ad-meta">${a.href ? 'Ver más' : ''}</div>
        </div>
      `;

      // ✅ Envoltura correcta: <a class="ad-card" ...> ó <div class="ad-card">
      const html = a.href
        ? `<a class="ad-card" href="${a.href}" target="_blank" rel="noopener noreferrer">${cardInner}</a>`
        : `<div class="ad-card">${cardInner}</div>`;

      cont.insertAdjacentHTML('beforeend', html);
    });

  } catch (e) {
    console.error("ERROR cargando eventos destacados:", e);
    cont.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;color:#666">No se pudieron cargar los eventos.</div>';
  }
})();
