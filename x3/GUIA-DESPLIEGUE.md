# Mi Tienda · Servus 0.2 · Guía para publicarla (paso a paso)

> Hay **5 videotutoriales** con estos mismos pasos: GitHub, Neon, Render, las llaves y los primeros pasos.

> Yo no puedo publicar por ti: estos pasos los haces tú en cada servicio, con tus cuentas.
> Lo que probé y lo que no está en `ENTREGA.md`. Lo que hay que configurar en cada plataforma (Google, Facebook, WhatsApp, dominio, avisos) está explicado con detalle en `CONFIGURACION-PLATAFORMAS.md`.

**¿Ya tenías Servus 0.1, la v9 o la v8 en Render y Neon?** No repitas todo: ve directo a **"Actualizar desde Servus 0.1"** al final.

**¿Solo quieres el prototipo en internet para probar con tu equipo?** Haz los pasos 1 a 5 y luego la sección 0 de `CONFIGURACION-PLATAFORMAS.md` (servidor de pruebas con `SERVUS_DEMO=1`).

## Qué necesitas

| Pieza | Servicio | Costo |
|---|---|---|
| Código | **GitHub** (github.com) | Gratis |
| Base de datos PostgreSQL | **Neon** (neon.tech) | Plan gratis |
| Servidor Node.js (app + API) | **Render** (render.com) → Web Service | Gratis para probar; **Starter** para operar |
| Dominio (por ejemplo, mitienda…) | El registrador donde lo compres | Pago anual |

⚠️ En el plan gratis de Render el servidor se duerme a los ~15 minutos sin visitas y tarda unos 50 segundos en despertar. Mientras duerme no llegan avisos a los domiciliarios ni vencen las ofertas. Para operar con domiciliarios reales usa el plan Starter.

---

## Paso 1 · Descomprimir
1. Descarga `V2 · Inicio · escritorio (diagramación MartFury).zip` (Servus 3.0).
2. Windows: clic derecho → **Extraer todo**. Mac: doble clic. Celular: no se recomienda, usa un computador.
3. Queda una carpeta `xervus` con `index.html`, `servidor.mjs`, `package.json`, `api/`, `js/`, `css/`, `img/`, `galeria/`…

## Paso 2 · Subir a GitHub (sin instalar nada)
1. Entra a https://github.com con tu cuenta → botón **New** (nuevo repositorio).
2. Nombre: `mi-tienda`. Déjalo **Private** (privado). No marques "Add a README". **Create repository**.
3. En la página del repositorio vacío, toca el enlace **uploading an existing file**.
4. GitHub deja subir **máximo 100 archivos por vez** y esta versión tiene unos 200 (por las fotos). Por eso se sube en **3 tandas**:
   - **Tanda 1:** abre la carpeta `xervus`, selecciona **todo menos las carpetas `img` y `galeria`** (Ctrl + clic o Cmd + clic para quitarlas de la selección) y arrástralo a la página de GitHub. Son menos de 100 archivos. Abajo escribe `Servus 3.0` y toca **Commit changes**.
   - **Tanda 2:** en el repositorio toca **Add file → Upload files** y arrastra **la carpeta `img`** completa (la carpeta, no su contenido). Chrome y Edge conservan las subcarpetas. **Commit changes**.
   - **Tanda 3:** otra vez **Add file → Upload files** y arrastra **la carpeta `galeria`**. **Commit changes**.
5. Revisa que se vean las carpetas `api`, `css`, `js`, `icons`, `img`, `galeria` y el archivo `servidor.mjs`. Entra a `img` y comprueba que estén `sv`, `logos`, `municipios` y `productos`. Entra a **`js/vendor`** y comprueba que estén **`qrcode.min.js`** y **`jsQR.min.js`**: si falta `qrcode.min.js`, los QR (asistencia, mesas, tickets) salen con el aviso "Falta el archivo js/vendor/qrcode.min.js". **No** debe haber `node_modules` ni ningún `.env`.
6. Si una tanda se queda a medias o algo queda en la raíz por error, bórralo y súbelo de nuevo dentro de su carpeta.

> Con GitHub Desktop o la terminal no hay límite de archivos: `git init`, `git add .`, `git commit -m "Servus 3.0"`, y `git push` a tu repositorio. El `.gitignore` ya excluye `node_modules/` y `.env`.

## Paso 3 · Crear la base de datos (Neon)
1. https://neon.tech → crea cuenta → **New project** → nombre `mi-tienda`, región **AWS US East (N. Virginia)**.
2. En **Connect**, copia la **connection string** (empieza por `postgresql://` y termina en `sslmode=require`).
3. No crees tablas: el servidor aplica solo las migraciones al arrancar (`api/migraciones/*.sql`). No borran datos.
4. ⚠️ La clave de la base de la versión anterior salió en unos pantallazos: en Neon → **Roles** → **Reset password** y usa la cadena nueva.

## Paso 4 · Llaves de los avisos (una sola vez)
En tu computador, con Node.js 20 o más nuevo instalado (nodejs.org), dentro de la carpeta `mi-tienda`:
```bash
npm install
npm run llaves-push
```
Guarda las dos líneas `VAPID_PUBLICA=…` y `VAPID_PRIVADA=…`. Si las cambias después, todos deben volver a activar los avisos.

## Paso 5 · Crear el servidor (Render)
1. https://render.com → **New → Web Service** → conecta tu cuenta de GitHub → escoge tu repositorio.
2. Configura:
   - **Runtime:** Node · **Build command:** `npm install --omit=dev` · **Start command:** `npm start`
   - **Health check path:** `/api/estado`
3. En **Environment** agrega las variables de `.env.ejemplo`. Las obligatorias:
   - `DATABASE_URL` = la de Neon · `NODE_ENV` = `production` · `DB_MAX_CONEXIONES` = `5`
   - `VAPID_PUBLICA`, `VAPID_PRIVADA`, `VAPID_CONTACTO`
   - Las de Google, Facebook, WhatsApp y Brevo (correo para recuperar la clave) las pones cuando las tengas (ver `CONFIGURACION-PLATAFORMAS.md`). Sin ellas se entra con usuario o celular y clave; los botones se ven, pero avisan que todavía no están activos.
   - `SERVUS_DEMO=1` **solo** en un servidor de pruebas: crea las cuentas de ejemplo al arrancar.
4. **Create Web Service**. En **Logs** debe salir `API y base de datos: activas.`
5. Abre `https://TU-SERVICIO.onrender.com/api/estado` → debe responder `{"ok":true,"db":true,"push":true,…}`.
6. Abre `https://TU-SERVICIO.onrender.com/api/auth/proveedores` → dice qué formas de entrar están activas.

## Paso 6 · Datos de prueba (opcional, en una base de PRUEBAS)
La semilla crea cuentas con clave `1234`. **No la corras en la base real.** En internet es más fácil poner `SERVUS_DEMO=1` en el servidor de pruebas: hace lo mismo al arrancar, una sola vez.
```bash
DATABASE_URL="la-de-neon-de-PRUEBAS" npm run semilla
```
La lista completa de cuentas, con el cargo de cada una, está en `CONFIGURACION-PLATAFORMAS.md` (sección 0) y en la página **`/#demo`** de la app.

## Paso 7 · Administrador, negocios reales y su equipo
1. Regístrate en la app con tu celular y una clave fuerte. En la consola SQL de Neon:
```sql
update usuarios set roles = array['admin','cliente'] where telefono = '3XXXXXXXXX';
```
2. Para cada negocio real (el `id` debe ser el mismo de la tienda: `rancho`, `drogueria`, `granero`…):
```sql
insert into negocios(id, nombre, categoria, municipio, zona_id, direccion, lat, lng, telefono, nequi)
values ('rancho','Rancho Costeño','comida','Hatillo de Loba','hatillo','Calle Principal', 8.95612, -74.07721, '300…', '310…');
insert into negocio_usuarios values ('rancho', (select id from usuarios where telefono='3XXXXXXXXX'), 'dueno');
update usuarios set usuario='rancho', roles = array['negocio','cliente'] where telefono='3XXXXXXXXX';
```
3. **El equipo ya no se crea por SQL:** el dueño entra a **Panel → Empleados y roles → Invitar** con el celular de la persona, su rol (cajero, mesero, cocina, domiciliario o atención) y su cargo (barbero, mecánico, regente…). La app le da una clave temporal y un botón para mandársela por WhatsApp.

## Paso 8 · Tarifas de domicilio
`https://TU-SERVICIO.onrender.com/#admin` → **Tarifas y reglas**: revisa los valores por zona, agrega veredas, pon las coordenadas reales de Chimí y los minutos para que venza una oferta (10 por defecto).

## Paso 9 · Dominio
Render → tu servicio → **Settings → Custom Domains** → agrega tu dominio y `www`. En tu registrador crea los registros DNS que Render indique. Render saca el HTTPS solo. **Sin HTTPS no funcionan la cámara, la ubicación, los avisos ni el ingreso con Google y Facebook.** Imprime los QR (mesas, asistencia, etiquetas) cuando ya estés en el dominio final.

## Paso 10 · Probar en celulares
- [ ] Abrir el enlace sin cuenta: se ve la tienda de una; abajo sale "Instala Mi Tienda".
- [ ] Agregar algo al carrito y pedir: sale la ventana para entrar (WhatsApp, Google, Facebook o registrarse).
- [ ] El dueño invita a una mesera y a la cocina desde Empleados; cada una entra y ve solo lo suyo.
- [ ] La cocina en una tablet: la comanda de una mesa aparece, se toca para prepararla y LISTO la quita.
- [ ] Imprimir el QR de asistencia; la mesera lo escanea con la cámara normal y queda la hora.
- [ ] Domiciliario: se registra en `/#rep`, el admin lo aprueba, se conecta, activa avisos y recibe una oferta con la app cerrada.
- [ ] Un cliente envía una PQR desde el pie de página y el dueño la responde.
- [ ] (Servus 0.1) "¿Olvidaste tu contraseña?" → código al correo o al WhatsApp → clave nueva.
- [ ] (Servus 0.1) La mesera manda un pedido de una mesa y la cocina lo ve en la tablet; la cocina marca LISTO y la mesera recibe el aviso.
- [ ] (Servus 0.1) El dueño cambia su portada y crea un cupón en **Mi vitrina y cupones**; un cliente lo ve en la tienda y toca **Tomar**.
- [ ] (Servus 0.1) Un cliente pide turno en la barbería o aparta una mesa del billar desde la tienda, y el negocio lo ve.
- [ ] (Servus 0.2) Al abrir la app en un celular nuevo sale la ventana para instalar; al cerrarla queda el aviso pequeño. Instalar de verdad deja el ícono.
- [ ] (Servus 0.2) Un negocio llena "Registra tu negocio" y el superadministrador lo aprueba en `/#super`; el dueño entra con la clave temporal.
- [ ] (Servus 0.2) El superadministrador pone 3 pautas; la franja de arriba cambia de color con cada una.
- [ ] (Servus 0.2) Un dueño sube un video de 10 segundos en **Mis estados** y se ve en el inicio, en otro celular.
- [ ] (Servus 0.2) Billar: la mesera anota partidas; la pantalla de la mesa (tablet o TV) muestra el marcador; un jugador escanea el QR y ve "Mis partidas".
- [ ] (Servus 0.2) Restaurante: la mesera toma el pedido paso a paso; el dueño lo envía a cocina; el cliente escanea el QR del ticket.
- [ ] (Servus 0.2) Buscar por voz (Chrome) y por foto del QR de un producto.

---

## Actualizar desde Servus 0.2 (lo más común)
Servus 3.0 solo cambia la portada, el encabezado y el pie de página. **No trae migración de base de datos ni variables nuevas en Render**, y las carpetas `img` y `galeria` no cambiaron.
1. En tu repositorio toca **Add file → Upload files**.
2. Abre la carpeta `xervus` y arrastra **todo menos las carpetas `img` y `galeria`** (solo la tanda 1). GitHub reemplaza los archivos que tienen el mismo nombre. Abajo escribe `Servus 3.0` y toca **Commit changes**.
3. Render se actualiza solo en 2 o 3 minutos.
4. Los celulares reciben la versión nueva la próxima vez que abran la app con señal (`sw.js` cambió a `mitienda-servus-3-0`). En el computador, si ves la portada vieja, recarga con Ctrl + Shift + R.
5. (Opcional) Para mostrar la línea de atención en el pie de página, escribe el número en `js/config.js` (`lineaAtencion`). Ver `CONFIGURACION-PLATAFORMAS.md`.

## Actualizar desde Servus 0.1 sin perder datos
1. Sube los archivos de esta versión a tu repositorio (las 3 tandas del paso 2; GitHub reemplaza los que tengan el mismo nombre).
2. Render se actualiza solo. Al arrancar aplica la migración `007_servus02.sql`. Esa migración:
   - agrega la foto de perfil y el estado (activo o suspendido) de cada negocio;
   - agrega las tablas de solicitudes de negocios nuevos, pautas del inicio y estados de los negocios.
   **No borra nada.**
3. Agrega en Render `SUPERADMIN_USUARIO`, `SUPERADMIN_CLAVE` (10 o más caracteres) y `SUPERADMIN_TELEFONO`, y entra en `/#super`.
4. Los celulares reciben la versión nueva la próxima vez que abran la app con señal (`sw.js` cambió a `mitienda-servus-0-2`).

## Actualizar desde la v9 sin perder datos
1. Sube los archivos de esta versión a tu repositorio (las 3 tandas del paso 2). Si quedaron archivos de la v9 que ya no vienen, no estorban; puedes borrarlos.
2. Render se actualiza solo. Al arrancar aplica la migración `006_servus01.sql`. Esa migración:
   - agrega la tabla de códigos para recuperar la clave;
   - agrega el rol "atención" con su cargo;
   - agrega la tabla del estado de las pantallas de atención.
   **No borra nada.** Después aplica también la `007_servus02.sql` (ver arriba).
3. Agrega en Render las variables nuevas que quieras usar: `BREVO_API_KEY`, `CORREO_REMITENTE`, `CORREO_NOMBRE` y las del superadministrador.
4. Los celulares reciben la versión nueva la próxima vez que abran la app con señal (`sw.js` cambió a `mitienda-servus-0-1`).
5. Los negocios encuentran en su menú la pantalla de atención con **datos de ejemplo**. Hay que decirles que los borren o los cambien por los suyos.

## Actualizar desde la v8 (Lainec) sin perder datos
1. En tu repositorio, reemplaza los archivos por los de esta versión (borra los viejos que ya no estén, como los `.js` que no vengan en el zip, o sube todo a un repositorio nuevo y conecta Render a ese).
2. Render se actualiza solo. Al arrancar aplica la migración `005_mitienda_v9.sql`: agrega columnas y tablas (WhatsApp, Google, Facebook, roles, asistencia, PQR, pagos Daviplata y Bre-B). **No borra nada.**
3. Los celulares reciben la versión nueva la próxima vez que abran la app con señal (`sw.js` cambió a `mitienda-v9-1`). El ícono de la app instalada cambia en unos días en Android; en iPhone y computador hay que quitarla e instalarla otra vez.
4. Los identificadores internos no cambiaron (cookie `lm_sesion`, almacenamiento del celular, encabezado `X-Lainec`): las sesiones y los datos guardados siguen sirviendo.

## Correr todo en tu computador
```bash
npm install
DATABASE_URL=postgres://usuario:clave@localhost/mitienda npm run semilla
DATABASE_URL=postgres://usuario:clave@localhost/mitienda npm start
# abre http://localhost:8080
```
Sin `NODE_ENV=production`, el ingreso con WhatsApp y la recuperación de la clave funcionan en **modo de prueba**: el código sale en pantalla en vez de llegar por WhatsApp o por correo. Abre `http://localhost:8080/#demo` para entrar con cualquier cargo.

## Pruebas automáticas
```bash
npm test                                                          # tienda (no necesita base)
TEST_DATABASE_URL=postgres://…/mitienda_test npm run test:api     # API
TEST_DATABASE_URL=postgres://…/mitienda_test npm run test:v7      # repartidor, admin, QR, billar
npm run test:v8                                                   # identidad y mejoras de experiencia
TEST_DATABASE_URL=postgres://…/mitienda_test npm run test:v9      # lo nuevo de la v9
TEST_DATABASE_URL=postgres://…/mitienda_test npm run test:api9    # API de la v9
TEST_DATABASE_URL=postgres://…/mitienda_test npm run test:api-sv  # API de Servus 0.1 (recuperar clave, pantallas compartidas)
TEST_DATABASE_URL=postgres://…/mitienda_test npm run test:sv      # navegador: lo nuevo de Servus 0.1
TEST_DATABASE_URL=postgres://…/mitienda_test npm run test:api-sv2 # API de Servus 0.2 (superadministrador, pautas, estados, billar)
TEST_DATABASE_URL=postgres://…/mitienda_test npm run test:sv2     # navegador: lo nuevo de Servus 0.2
npm run instalar-navegador                                        # una vez, si Playwright pide Chromium
```
`TEST_DATABASE_URL` debe ser una base **solo de pruebas** (el nombre debe contener "test"): las pruebas la borran.
