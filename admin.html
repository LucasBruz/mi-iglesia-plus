<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Admin | Mi Iglesia+</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet"/>
  <style>
    :root{ --primary:#FF6B5B; --dark:#1a1a1a; --gray:#666; --border:#e0e0e0; --ok:#28a745; --warn:#ffb703; --danger:#dc3545; --muted:#999; }
    *{ box-sizing:border-box }
    body{ font-family:Poppins,sans-serif; margin:0; background:#fafafa; color:#1a1a1a; }
    header{ background:#fff; border-bottom:1px solid #eee; padding:16px; position:sticky; top:0; z-index:100 }
    .wrap{ max-width:1200px; margin:0 auto; padding:16px }
    h1{ margin:0; font-size:24px }
    .muted{ color:var(--muted); font-size:.9rem }
    .row{ display:flex; gap:16px; flex-wrap:wrap; }
    .col{ flex:1 1 360px; }
    section.card{ background:#fff; border:1px solid #eee; border-radius:12px; padding:16px; }
    section.card h2{ margin:0 0 8px; font-size:18px }
    .list{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:12px; }
    .item{ border:1px solid #eee; border-radius:10px; background:#fff; padding:12px; }
    .item h3{ margin:0 0 6px; font-size:16px }
    .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .actions{ display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
    button{ padding:8px 12px; border:0; border-radius:8px; background:var(--primary); color:#fff; font-weight:700; cursor:pointer }
    button.ok{ background:var(--ok) }
    button.warn{ background:var(--warn); color:#111 }
    button.danger{ background:var(--danger) }
    button.outline{ background:#f3f3f3; color:#111; border:1px solid #ddd }
    button:disabled{ opacity:.6; cursor:not-allowed }
    input,select,textarea{ width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; font-family:Poppins; margin-bottom:8px; }
    .tag{ display:inline-block; padding:2px 8px; border-radius:999px; font-size:.75rem; background:#f0f0f0; margin-right:6px }
    .tag.ok{ background:#e9f7ef; color:#2e7d32 }
    .tag.warn{ background:#fff8e1; color:#b26a00 }
    .tag.danger{ background:#fdecea; color:#b71c1c }
    .right{ text-align:right }
    .link{ color:#2962ff; text-decoration:none; word-break:break-all }
    .empty{ color:#777; padding:8px; border:1px dashed #ddd; border-radius:8px; text-align:center }
    .help{ font-size:.85rem; color:#777 }
    #toast{ position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#333; color:#fff; padding:10px 20px; border-radius:8px; font-size:.9rem; display:none; z-index:999; }
  </style>
</head>
<body>

  <div id="toast"></div>

  <header>
    <div class="wrap" style="display:flex; align-items:center; justify-content:space-between; gap:12px">
      <div>
        <h1>Panel de Administrador</h1>
        <div class="muted">Sesión: <span id="adminEmail">—</span></div>
      </div>
      <div class="right">
        <button id="btnSalir" class="outline">Salir</button>
      </div>
    </div>
  </header>

  <main class="wrap">
    <div class="row">

      <!-- Iglesias pendientes -->
      <section class="card col">
        <h2>🕊️ Iglesias pendientes</h2>
        <p class="help">Aprobá o rechazá registros de iglesias.</p>
        <div id="iglesiasPend" class="list"></div>
        <div id="iglesiasPendEmpty" class="empty" style="display:none;">No hay iglesias pendientes.</div>
      </section>

      <!-- Transferencias pendientes -->
      <section class="card col">
        <h2>💸 Transferencias (pendientes)</h2>
        <p class="help">Registros por transferencia bancaria esperando aprobación.</p>
        <div id="bankPend" class="list"></div>
        <div id="bankPendEmpty" class="empty" style="display:none;">No hay transferencias pendientes.</div>
      </section>

    </div>

    <div class="row">

      <!-- Publicidades -->
      <section class="card col">
        <h2>📣 Publicidades (moderación)</h2>
        <p class="help">Aprobá o archivá anuncios. Se escribe directo en Firestore.</p>
        <div class="grid2" style="margin-bottom:8px;">
          <select id="adsFilter">
            <option value="all">Todas</option>
            <option value="draft">Solo borrador</option>
            <option value="approved">Solo aprobadas</option>
            <option value="archived">Solo archivadas</option>
          </select>
          <button id="btnReloadAds" class="outline">🔄 Recargar</button>
        </div>
        <div id="adsList" class="list"></div>
        <div id="adsEmpty" class="empty" style="display:none;">No hay anuncios con ese filtro.</div>
      </section>

      <!-- Planes manual -->
      <section class="card col">
        <h2>📦 Planes (asignación manual)</h2>
        <p class="help">Asigná plan y estado en <code>iglesias/{uid}.subscription</code>.</p>
        <input id="plan_uid" placeholder="UID de la iglesia"/>
        <div class="grid2">
          <select id="plan_planId">
            <option value="free">FREE</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
          </select>
          <select id="plan_status">
            <option value="active">active</option>
            <option value="past_due">past_due</option>
            <option value="canceled">canceled</option>
            <option value="incomplete">incomplete</option>
          </select>
        </div>
        <div class="actions">
          <button id="btnSetPlan" class="ok">Guardar plan</button>
        </div>
        <div id="planMsg" class="muted" style="margin-top:8px; min-height:20px;"></div>
      </section>

    </div>
  </main>

  <script type="module">
    import { initializeApp }           from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
    import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
    import {
      getFirestore, collection, query, where, orderBy, limit,
      getDocs, doc, updateDoc, setDoc, serverTimestamp
    } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

    const firebaseConfig = {
      apiKey: "AIzaSyBOj5yJQ2kcU4_xrUY1sDPB3XU3lWupX-A",
      authDomain: "miiglesia-plus.firebaseapp.com",
      projectId: "miiglesia-plus",
      storageBucket: "miiglesia-plus.firebasestorage.app",
      messagingSenderId: "407699856167",
      appId: "1:407699856167:web:5d421d407ab7c9789aa702"
    };

    // ⚠️ Email del admin autorizado (debe coincidir con tu cuenta)
    const ADMIN_EMAIL = "miiglesia.on@gmail.com";

    const app  = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db   = getFirestore(app);

    const $  = (id) => document.getElementById(id);
    const toast = (msg, ms=2500) => {
      const t = $('toast');
      t.textContent = msg;
      t.style.display = 'block';
      setTimeout(() => t.style.display = 'none', ms);
    };

    // ======= AUTH GUARD =======
    onAuthStateChanged(auth, async (user) => {
      if (!user) return location.href = 'login.html';

      // Verificar que sea el admin
      if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        alert('No tenés permisos de administrador.');
        await signOut(auth);
        return location.href = 'login.html';
      }

      $('adminEmail').textContent = user.email;

      await Promise.all([
        cargarIglesiasPend(),
        cargarBankPend(),
        cargarAds()
      ]);
    });

    $('btnSalir').onclick = async () => { await signOut(auth); location.href = 'index.html'; };

    // ======= IGLESIAS PENDIENTES =======
    async function cargarIglesiasPend() {
      const cont = $('iglesiasPend'), empty = $('iglesiasPendEmpty');
      cont.innerHTML = 'Cargando…'; empty.style.display = 'none';
      try {
        const qy = query(collection(db, 'iglesias'), where('estado', '==', 'pendiente'), limit(50));
        const snap = await getDocs(qy);
        if (snap.empty) { cont.innerHTML = ''; empty.style.display = 'block'; return; }
        cont.innerHTML = '';
        snap.forEach(docu => {
          const d = docu.data(), uid = docu.id;
          cont.insertAdjacentHTML('beforeend', `
            <div class="item">
              <h3>${d.nombre || '(Sin nombre)'} <span class="tag warn">pendiente</span></h3>
              <div class="muted">${d.ciudad || ''}</div>
              <div class="muted">UID: <code>${uid}</code></div>
              <div class="actions">
                <button class="ok" data-approve="${uid}">✅ Aprobar</button>
                <button class="danger" data-reject="${uid}">❌ Rechazar</button>
              </div>
            </div>
          `);
        });
        cont.querySelectorAll('[data-approve]').forEach(b =>
          b.onclick = () => setIglesiaEstado(b.dataset.approve, 'activa')
        );
        cont.querySelectorAll('[data-reject]').forEach(b =>
          b.onclick = () => {
            const reason = prompt('Motivo del rechazo (opcional):','');
            setIglesiaEstado(b.dataset.reject, 'rechazada', reason || null);
          }
        );
      } catch(e) {
        console.error(e);
        cont.innerHTML = `<div class="empty">Error: ${e.message}</div>`;
      }
    }

    async function setIglesiaEstado(uid, estado, reason = null) {
      try {
        const patch = { estado, updatedAt: serverTimestamp() };
        if (estado === 'activa') patch.approvedAt = serverTimestamp();
        if (estado === 'rechazada' && reason) patch.rejectedReason = reason;
        await setDoc(doc(db, 'iglesias', uid), patch, { merge: true });
        toast(estado === 'activa' ? '✅ Iglesia aprobada' : '❌ Iglesia rechazada');
        await cargarIglesiasPend();
      } catch(e) {
        console.error(e);
        alert('Error: ' + e.message);
      }
    }

    // ======= TRANSFERENCIAS PENDIENTES =======
    async function cargarBankPend() {
      const cont = $('bankPend'), empty = $('bankPendEmpty');
      cont.innerHTML = 'Cargando…'; empty.style.display = 'none';
      try {
        const qy = query(collection(db, 'preonboarding'), where('paid', '==', false), limit(50));
        const snap = await getDocs(qy);
        if (snap.empty) { cont.innerHTML = ''; empty.style.display = 'block'; return; }
        cont.innerHTML = '';
        snap.forEach(docu => {
          const d = docu.data(), uid = docu.id;
          cont.insertAdjacentHTML('beforeend', `
            <div class="item">
              <h3>UID: ${uid}</h3>
              <div class="muted">Método: <b>${d.method || '-'}</b></div>
              ${d.comprobanteUrl ? `<a class="link" href="${d.comprobanteUrl}" target="_blank" rel="noopener">Ver comprobante</a>` : '<div class="muted">Sin comprobante</div>'}
              <div class="actions">
                <button class="ok" data-bank-ok="${uid}">✅ Marcar pagado</button>
                <button class="danger" data-bank-cancel="${uid}">❌ Rechazar</button>
              </div>
            </div>
          `);
        });
        cont.querySelectorAll('[data-bank-ok]').forEach(b =>
          b.onclick = () => setBankPaid(b.dataset.bankOk, true)
        );
        cont.querySelectorAll('[data-bank-cancel]').forEach(b =>
          b.onclick = () => setBankPaid(b.dataset.bankCancel, false, true)
        );
      } catch(e) {
        console.error(e);
        cont.innerHTML = `<div class="empty">Error: ${e.message}</div>`;
      }
    }

    async function setBankPaid(uid, paid, rejected = false) {
      try {
        const patch = { paid, updatedAt: serverTimestamp() };
        if (rejected) patch.rejected = true;
        await setDoc(doc(db, 'preonboarding', uid), patch, { merge: true });
        toast(paid ? '✅ Marcado como pagado' : '❌ Marcado como rechazado');
        await cargarBankPend();
      } catch(e) {
        console.error(e);
        alert('Error: ' + e.message);
      }
    }

    // ======= PUBLICIDADES — escribe directo en Firestore =======
    $('btnReloadAds').onclick = () => cargarAds();
    $('adsFilter').onchange   = () => cargarAds();

    async function cargarAds() {
      const filter = $('adsFilter').value;
      const cont = $('adsList'), empty = $('adsEmpty');
      cont.innerHTML = 'Cargando…'; empty.style.display = 'none';
      try {
        const snap = await getDocs(query(collection(db, 'ads'), limit(100)));
        let ads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (filter !== 'all') {
          ads = ads.filter(a => String(a.status || '').toLowerCase() === filter);
        }
        ads.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        if (!ads.length) { cont.innerHTML = ''; empty.style.display = 'block'; return; }

        cont.innerHTML = '';
        for (const ad of ads) {
          const st = String(ad.status || 'draft').toLowerCase();
          cont.insertAdjacentHTML('beforeend', `
            <div class="item">
              <h3>${ad.title || '(Sin título)'} ${badgeStatus(st)}</h3>
              <div class="muted">Iglesia UID: <code>${ad.iglesiaUid || '-'}</code></div>
              ${ad.imageUrl ? `<div style="margin:6px 0"><img src="${ad.imageUrl}" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px"/></div>` : ''}
              ${ad.href ? `<a class="link" href="${ad.href}" target="_blank" rel="noopener">${ad.href}</a>` : ''}
              <div class="actions">
                <button class="ok"     data-ad-approve="${ad.id}" ${st === 'approved' ? 'disabled' : ''}>✅ Aprobar</button>
                <button class="warn"   data-ad-draft="${ad.id}"   ${st === 'draft'    ? 'disabled' : ''}>📝 Borrador</button>
                <button class="danger" data-ad-archive="${ad.id}" ${st === 'archived' ? 'disabled' : ''}>🗑 Archivar</button>
              </div>
            </div>
          `);
        }

        cont.querySelectorAll('[data-ad-approve]').forEach(b =>
          b.onclick = () => setAdStatus(b.dataset.adApprove, 'approved', b)
        );
        cont.querySelectorAll('[data-ad-draft]').forEach(b =>
          b.onclick = () => setAdStatus(b.dataset.adDraft, 'draft', b)
        );
        cont.querySelectorAll('[data-ad-archive]').forEach(b =>
          b.onclick = () => setAdStatus(b.dataset.adArchive, 'archived', b)
        );

      } catch(e) {
        console.error(e);
        cont.innerHTML = `<div class="empty">Error al cargar: ${e.message}</div>`;
      }
    }

    // ✅ Escribe DIRECTO en Firestore — sin pasar por Functions
    async function setAdStatus(adId, status, btn) {
      btn.disabled = true;
      btn.textContent = 'Guardando…';
      try {
        await updateDoc(doc(db, 'ads', adId), {
          status,
          updatedAt: serverTimestamp()
        });
        toast(
          status === 'approved' ? '✅ Anuncio aprobado — ya aparece en el home' :
          status === 'archived' ? '🗑 Anuncio archivado' : '📝 Vuelto a borrador'
        );
        await cargarAds();
      } catch(e) {
        console.error(e);
        alert('Error al guardar: ' + e.message);
        btn.disabled = false;
      }
    }

    function badgeStatus(st) {
      const map = { draft: 'warn', approved: 'ok', archived: 'danger' };
      return `<span class="tag ${map[st] || 'warn'}">${st}</span>`;
    }

    // ======= PLANES MANUAL =======
    $('btnSetPlan').onclick = async () => {
      const uid    = $('plan_uid').value.trim();
      const planId = $('plan_planId').value;
      const status = $('plan_status').value;
      const lbl    = $('planMsg');
      if (!uid) { alert('Ingresá el UID de la iglesia'); return; }
      lbl.textContent = 'Guardando...';
      try {
        await setDoc(doc(db, 'iglesias', uid), {
          subscription: {
            provider: planId === 'free' ? 'none' : 'mercado_pago',
            priceIdOrPlanId: planId,
            status,
            updatedAt: serverTimestamp()
          }
        }, { merge: true });
        lbl.textContent = '✔ Plan guardado correctamente';
        toast('✅ Plan actualizado');
      } catch(e) {
        console.error(e);
        lbl.textContent = '❌ ' + (e?.message || 'Error');
      }
    };

  </script>
</body>
</html>
