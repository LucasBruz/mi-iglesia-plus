# Mi Iglesia+ — Paquete listo para GitHub Pages

Este paquete contiene el frontend estático para **Mi Iglesia+** con:
- 🔐 Registro/Login real (Email/Contraseña + Google)
- ✉️ Verificación de email
- ♻️ Reset de contraseña
- ⏳ Estado **pendiente** tras registro
- 🛡️ Panel **SuperAdmin** para aprobar/banear
- 🔎 Buscador público que lista solo iglesias **activas** (Firestore)

## 1) Requisitos
- Cuenta de **Firebase** (Auth + Firestore habilitados)
- Crear una **app Web** en Firebase y copiar el `firebaseConfig`.

## 2) Configurar Firebase en el proyecto
1. Abrí `js/firebase-init.js` y reemplazá todos los valores.
2. En Firebase Console → **Authentication → Sign-in method**: habilitá **Email/Password** y **Google**.
3. En Firebase Console → **Firestore Database**: crear base de datos (modo producción).

## 3) Reglas de seguridad (OBLIGATORIO)
- Abrí Firestore → **Rules** y pegá el contenido de `firestore.rules`. Guardá y publicá.
- Asigná tu usuario como **superadmin** en la colección `roles`.

## 4) Flujo
- `registro.html` → crea cuenta, registra iglesia (**pendiente**) y envía verificación.
- `admin.html` → aprobar/banear.
- `dashboard.html` → solo verificados + activa.
- `index.html` → lista solo **activas**.

## 5) Publicar en GitHub Pages
1. Subí todo el contenido a un repositorio público.
2. **Settings → Pages → Source: main / root**.
3. Abrí la URL `https://usuario.github.io/REPO/`.

## 6) Personalización
- Reemplazá `assets/logo.jpg` y `assets/lucas-bruz.jpg`.
- Editá textos/estilos en `index.html`.

## 7) Troubleshooting
- Si el buscador no carga: confirmá `firebaseConfig` y Reglas.
- Permisos: recordá que **estado** lo cambia el SuperAdmin y el email debe estar **verificado**.

---

## 8) Verificación por dominio (GitHub Pages + Firebase)

### GitHub Pages (recomendado por seguridad)
1. En GitHub: **Profile Settings → Pages → Verify a custom domain**. Ingresá tu dominio y copiá el **TXT** que te muestra.
2. En tu proveedor de DNS, agregá ese **TXT** en la zona del dominio.
3. Volvé a GitHub y presioná **Verify**.
4. En el **repo → Settings → Pages**, en **Custom domain** ingresá tu dominio. Esto crea (o respeta) el archivo **CNAME** en la raíz del repo.
5. En DNS, configurá:
   - **A** (apex): `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - **CNAME** (www): `www` → `tuusuario.github.io.`
6. Activá **Enforce HTTPS** en Settings → Pages cuando esté disponible.

> Este repo incluye **CNAME** con `tu-dominio.com`. Cambialo por el tuyo o hacelo desde Settings.

### Firebase (para que el login funcione con tu dominio)
1. Firebase Console → **Authentication → Settings → Authorized domains** → **Add domain** → agregá `tu-dominio.com` y `www.tu-dominio.com` si aplica.
2. (Opcional) **Auth → Templates → Customize domain**: verificá tu dominio para que los emails de verificación/reset salgan con tu dominio. El asistente te da **TXT/CNAME**.
3. Si querés que el **selector de Google** muestre tu dominio en la URL de callback (`/__/auth/handler`), necesitás **Firebase Hosting** en un subdominio (p.ej. `auth.tu-dominio.com`). Podés usar Hosting solo para el handler y mantener el sitio en Pages.

### Comprobaciones
- Usá `dig` o dnschecker.org para verificar A/CNAME/TXT.
- La propagación DNS puede tardar hasta 24 h.
