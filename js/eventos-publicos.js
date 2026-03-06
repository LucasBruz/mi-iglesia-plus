// js/eventos-publicos.js — MODO SIMPLE (sin orderBy, usa rutas del mismo sitio)
import { db } from './firebase-init.js';
import { collection, query, where, getDocs }
  from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const cont = document.getElementById('adsGrid');

(async () => {
  if (!cont) return;

  cont.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;color:#666">Cargando eventos…</div>';

  try {
    // Solo aprobados (sin orderBy para evitar índice compuesto)
    const q = query(collection(db, 'ads'), where('status', '==', 'approved'));
    const snap = await getDocs(q);

    if (snap.empty) {
      cont.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;color:#666">No hay eventos destacados por ahora.</div>';
      return;
    }

    cont.innerHTML = '';

    snap.forEach(d => {
      const a = d.data();
      const src = (a.imageUrl || '').trim();

      const imgTag = src
        ? `<img class="ad-img" src="${src}" alt="${(a.title||'Evento').replace(/"/g,'&quot;')}" loading="lazy" decoding="async">`
        : `<div class="ad-img" aria-hidden="true"></div>`;

      const inner = `
        ${imgTag}
        <div class="ad-body">
          <div class="ad-title">${a.title || 'Evento'}</div>
          <div class="ad-meta">${a.href ? 'Ver más' : ''}</div>
        </div>`;

      const html = a.href
        ? `<a class="ad-card" href="${a.href}" target="_blank" rel="noopener">${inner}</a>`
        : `<div class="ad-card">${inner}</div>`;

      cont.insertAdjacentHTML('beforeend', html);
    });

  } catch (e) {
    console.error('Eventos destacados - error:', e);
    cont.innerHTML = '<div class="no-results" style="grid-column:1/-1;text-align:center;color:#666">No se pudieron cargar los eventos.</div>';
  }
})();
