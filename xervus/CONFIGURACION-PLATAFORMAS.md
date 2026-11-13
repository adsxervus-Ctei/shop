# Mi Tienda · Servus 0.1 · Qué configurar y en qué plataforma

Esta es la lista de lo que hay que hacer **fuera del código** para que todo funcione: la tienda, el ingreso con Google, Facebook y WhatsApp, la recuperación de la contraseña, los domiciliarios, los avisos y el dominio. El paso a paso para subir y publicar está en `GUIA-DESPLIEGUE.md`.

> Las pantallas de Google, Meta, Brevo, Render y Neon cambian de vez en cuando. Si un botón no se llama igual, busca el más parecido. Yo no tengo acceso a tus cuentas: todo esto lo haces tú.

## Resumen

| # | Plataforma | Para qué | ¿Obligatorio? | Costo |
|---|---|---|---|---|
| 1 | **GitHub** | Guardar el código | Sí | Gratis |
| 2 | **Neon** | Base de datos (pedidos, cuentas, domicilios, pantallas de atención) | Sí | Gratis para empezar |
| 3 | **Render** | Servidor: app + API | Sí | Gratis para probar · Starter para operar |
| 4 | **Llaves VAPID** (en tu computador) | Avisos al celular de domiciliarios y negocios | Sí, para domicilios | Gratis |
| 5 | **Dominio** + HTTPS | Dirección propia | Muy recomendado | Pago anual |
| 6 | **Google Cloud** | Botón "Continuar con Google" | Opcional | Gratis |
| 7 | **Meta for Developers** (Facebook) | Botón "Continuar con Facebook" | Opcional | Gratis |
| 8 | **WhatsApp Business Platform** (Meta) | Código de ingreso y de recuperar clave por WhatsApp | Opcional | **Cobra por mensaje** |
| 9 | **Brevo** (nuevo) | Correo con el código para **recuperar la contraseña** | Opcional | Plan gratis (300 correos al día) |
| 10 | **Panel de administración** (`/#admin`) | Tarifas, zonas y aprobación de domiciliarios | Sí, para domicilios | — |
| 11 | **Cada negocio** (dentro de la app) | Medios de pago, equipo y cargos, vitrina y cupones, QR | Sí | — |

Sin 6, 7, 8 y 9 la app funciona: se entra con usuario o celular y clave, o con "Registrarme con mis datos". Los botones de Google, Facebook y WhatsApp **se ven siempre** (así lo pediste); mientras no estén configurados, al tocarlos la app explica que todavía no están activos.

---

## 0. El prototipo en internet, para probarlo con tu equipo (lo primero que te recomiendo)

Monta **un servidor de pruebas aparte** del que usarás de verdad. Así puedes probar con las cuentas de ejemplo sin mezclar datos reales.

1. **Neon:** en tu proyecto crea una rama o base llamada `pruebas` (Branches → New branch) y copia su cadena de conexión.
2. **Render:** crea un segundo Web Service con el mismo repositorio, por ejemplo `mitienda-pruebas`. Usa las mismas indicaciones de build y start de la guía.
3. Variables de ese servicio:

| Variable | Valor | Qué hace |
|---|---|---|
| `DATABASE_URL` | la de la rama `pruebas` | Base solo de pruebas |
| `NODE_ENV` | `production` | Cookies seguras; no muestra códigos en pantalla |
| `SERVUS_DEMO` | `1` | Al arrancar crea **una sola vez** todas las cuentas de ejemplo (clave `1234`) y muestra la página **`/#demo`** |
| `VAPID_PUBLICA`, `VAPID_PRIVADA`, `VAPID_CONTACTO` | las tuyas | Avisos a domiciliarios |

4. Abre `https://mitienda-pruebas.onrender.com/#demo`. Ahí está cada negocio con una persona por cargo; tocas una y entras como ella.
5. ⚠️ **Nunca pongas `SERVUS_DEMO=1` en el servidor real.** Esa variable crea un administrador y decenas de cuentas con clave `1234`. En el servidor real la página `/#demo` dice "Las cuentas de prueba están apagadas".

### Cuentas de ejemplo (clave 1234)

| Negocio | Dueño | Equipo (usuario → cargo → lo que ve) |
|---|---|---|
| Rancho Costeño | `rancho` | `rancho-cajero` Karen (caja del turno) · `rancho-mesera` Sofía (mis mesas) · `rancho-cocina` Rubén (comandas) · `rancho-domi` Danto (domicilios del negocio) |
| Billares La Carambola | `billar` | `billar-mesera` Keila (mesas con reloj) · `billar-cajero` |
| Barbería El Estilo | `barberia` | `barberia-atencion` Kevin, barbero (turnos y fila) |
| Tienda Mi Pueblo | `tienda` | `tienda-cajero` Valentina (mostrador y fiado) |
| Droguería La Loba | `drogueria` | `drogueria-atencion` María José, auxiliar (mostrador y fórmulas) · `drogueria-cajero` |
| Taller El Pistón | `taller` | `taller-atencion` Elkin, mecánico (órdenes) |
| Granero Central | `granero` | `granero-atencion` Jairo, despachador (venta por mayor) |
| Ferretería El Tornillo | `ferreteria` | `ferreteria-atencion` Wilson (venta por medida) |
| Variedades La Ribereña | `ropa` | `ropa-atencion` Andrea, asesora (tallas y separados) |
| Asociación de Pescadores | `pescadores` | `pescadores-atencion` Jesús (acopio) |
| Quesera El Playón | `quesera` | `quesera-atencion` Wilmer, quesero (producción) |
| Distribuidora Loba | `distribuidora` | `distribuidora-atencion` Julio, vendedor de ruta |
| Agro La Loba | `agro` | `agro-atencion` Paola, veterinaria (visitas) |
| Granja Chimí | `granja` | `granja-atencion` Fredy, galponero |
| Variedades Chimí · Calzado El Paso | `chimi` · `calzado` | — |
| Clientes | `maria` (también tiene el correo `maria@ejemplo.com`), `juan` | — |
| Domiciliario | `danto` (aprobado) · `yeison` (en revisión) · `kelly` (rechazado) | — |
| Administración | `admin` | — |

Cada pantalla trae **datos de ejemplo**. Así la cocina tiene comandas, la mesera mesas ocupadas, la cajera pagos por confirmar, el barbero su agenda y el taller sus motos. Con servidor, lo que cambia uno lo ven los demás del mismo negocio en unos 12 segundos.

---

## 1–3. GitHub, Neon y Render
Ver `GUIA-DESPLIEGUE.md` (pasos 2, 3 y 5). Lo importante:
- **GitHub:** el proyecto tiene más de 100 archivos, el límite por subida en la página. Súbelo en **3 tandas**: (1) todo menos las carpetas `img` y `galeria`; (2) la carpeta `img`; (3) la carpeta `galeria`. Cada tanda tiene menos de 100 archivos. Está explicado en la guía.
- **Render:** Build `npm install --omit=dev` · Start `npm start` · Health check `/api/estado`.
- **Variables obligatorias** en Render → Environment: `DATABASE_URL`, `NODE_ENV=production`, `DB_MAX_CONEXIONES=5`.
- ⚠️ Cambia la clave de la base de Neon que salió en pantallazos (Neon → Roles → Reset password) y actualiza `DATABASE_URL`.
- Para operar con domiciliarios reales usa **Render Starter**: el plan gratis se duerme, y mientras duerme no salen avisos ni vencen las ofertas.

## 4. Avisos al celular (Web Push)
1. En tu computador, dentro de la carpeta: `npm install` y luego `npm run llaves-push`.
2. Copia en Render: `VAPID_PUBLICA`, `VAPID_PRIVADA` y `VAPID_CONTACTO=mailto:tu-correo@…`.
3. Cada domiciliario y cada negocio toca **Activar avisos** en la app; el celular pide permiso.
4. En iPhone los avisos solo llegan si la app está **instalada en la pantalla de inicio** (iOS 16.4 o más nuevo).

## 5. Dominio y HTTPS
1. Compra el dominio y revisa la nota de marca al final.
2. Render → tu servicio → **Settings → Custom Domains** → agrega `tudominio.com` y `www.tudominio.com`.
3. En tu registrador crea los registros DNS que Render te muestre. Render saca el certificado HTTPS solo.
4. **Sin HTTPS no funcionan** la cámara (escanear QR), la ubicación del domiciliario, los avisos ni el ingreso con Google y Facebook.
5. Imprime los QR (mesas, asistencia, etiquetas) cuando ya estés en el dominio final.

## 6. Continuar con Google
1. Entra a https://console.cloud.google.com y crea un proyecto llamado `Mi Tienda`.
2. **Pantalla de consentimiento de OAuth:**
   - Tipo **Externo**, nombre "Mi Tienda", tu correo de soporte.
   - Dominio y el enlace a `https://tudominio.com/privacidad.html`.
   - Permisos: `email`, `profile` y `openid`.
   - Publícala (pasa de "Prueba" a "En producción").
3. **Credenciales → ID de cliente de OAuth → Aplicación web.**
   - Orígenes autorizados: `https://tudominio.com`, `https://www.tudominio.com` y `https://TU-SERVICIO.onrender.com` (también el de pruebas).
   - En tu computador: `http://localhost:8080`.
4. En Render: `GOOGLE_CLIENT_ID` (termina en `.apps.googleusercontent.com`).
5. Comprueba que `/api/auth/proveedores` diga `"google":true`.

## 7. Continuar con Facebook
1. https://developers.facebook.com → **Crear app** → caso de uso "Autenticar y solicitar datos de usuarios con el inicio de sesión con Facebook".
2. **Inicio de sesión con Facebook → Configuración:**
   - SDK para JavaScript: **Sí**.
   - Dominios permitidos: tu dominio y el de Render.
3. **Configuración → Básica:** URL de la política de privacidad, URL de eliminación de datos, categoría e ícono.
4. Permisos: solo `public_profile` y `email`.
5. Pasa la app a modo **Activo** (Live).
6. En Render pon `FACEBOOK_APP_ID` y `FACEBOOK_APP_SECRET`.
7. Comprueba que `/api/auth/proveedores` diga `"facebook":true`.

## 8. Código por WhatsApp (ingreso y recuperar la contraseña)
Es la forma más cómoda para la gente del pueblo, pero **Meta cobra cada mensaje de autenticación**. La misma plantilla sirve para entrar y para recuperar la clave.
1. Necesitas un **Business Manager** de Meta y un **número que no esté usado en WhatsApp**.
2. developers.facebook.com → tu app → **Agregar producto → WhatsApp**. Agrega y verifica el número.
3. **Plantillas → Crear → categoría "Autenticación":**
   - Nombre `codigo_ingreso`, idioma **Español (COL)** (`es_CO`), botón **Copiar código**.
   - Espera la aprobación.
4. **Token permanente:** Business Manager → Usuarios del sistema → Generar token con `whatsapp_business_messaging` y `whatsapp_business_management`.
5. En Render:
   - `WHATSAPP_TOKEN`
   - `WHATSAPP_NUMERO_ID` (el *Phone number ID*, no el número)
   - `WHATSAPP_PLANTILLA_CODIGO=codigo_ingreso`
   - `WHATSAPP_IDIOMA=es_CO`
6. Verifica el negocio en Business Manager y pon un **límite de gasto**.
7. Comprueba que `/api/auth/proveedores` diga `"whatsapp":true`.

Sin estas variables y con `NODE_ENV=production`, el botón de WhatsApp avisa que no está activo y la recuperación por WhatsApp responde "todavía no está activa".

## 9. Correo para recuperar la contraseña (Brevo) — nuevo en Servus 0.1
Cuando alguien toca **"¿Olvidaste tu contraseña?"**, escribe su correo o su celular y escoge **al correo** o **al WhatsApp**. Le llega un código de 6 números que vence en 10 minutos. Con ese código crea la clave nueva, y las sesiones abiertas en otros celulares se cierran.

Para que el correo salga de verdad:
1. Crea una cuenta en https://www.brevo.com (plan gratis: 300 correos al día).
2. **Remitentes y dominios → Agregar remitente:** usa un correo tuyo, por ejemplo `no-responder@tudominio.com`, y verifícalo.
   - Lo mejor es **autenticar el dominio** (Brevo te da registros DNS: DKIM y DMARC) para que los correos no lleguen a spam.
3. **SMTP y API → Claves API → Generar una nueva clave** (empieza por `xkeysib-`).
4. En Render:
   - `BREVO_API_KEY` = la clave
   - `CORREO_REMITENTE` = el correo verificado
   - `CORREO_NOMBRE` = `Mi Tienda`
5. Comprueba que `/api/auth/proveedores` diga `"correo":true`. Después prueba con tu propio correo.

Notas:
- Para recuperar por correo, la persona debe haber escrito su correo al registrarse. Con Google también queda guardado el correo.
- La respuesta del servidor es igual exista o no la cuenta, para no revelar quién está registrado.
- Límites: 3 códigos cada 15 minutos por correo o celular, y 5 intentos fallidos por código.
- **En tu computador** (sin `NODE_ENV=production`) funciona en **modo de prueba**: el código sale en pantalla. Nunca dejes un servidor en internet sin `NODE_ENV=production`, porque cualquiera vería los códigos.

## 10. Domiciliarios — y cómo probar el perfil de ejemplo en internet
En la app hay dos cosas:
- **El perfil de ejemplo** (`/#domi-demo`, también desde `/#demo` → "Danto · Domiciliario"). Funciona solo en el celular, sin servidor: se conecta, toma un pedido, marca los pasos y ve sus ganancias. Sirve para mostrar el recorrido.
- **El domiciliario real** (`/#rep`), que necesita servidor. En el servidor de pruebas (paso 0) ya existe la cuenta `danto` / `1234` **aprobada**.

Para probar domicilios de verdad en el prototipo:
1. **Avisos:** pon las llaves VAPID (paso 4) en el servicio de pruebas.
2. **HTTPS:** la dirección `onrender.com` ya lo tiene; con eso funcionan la ubicación y los avisos.
3. **Tarifas y zonas:** entra como `admin` → `/#admin` → **Tarifas y reglas**. Revisa el valor por zona, pon las coordenadas de Chimí y los minutos para que venza una oferta (10 por defecto).
4. **En el celular del domiciliario:**
   - Abre la dirección de pruebas, entra con `danto` / `1234` y abre **Hazte domiciliario** (`/#rep`).
   - Toca **Activar avisos** y **Conectarme**.
   - Instala la app en la pantalla de inicio (en iPhone es obligatorio para los avisos).
5. **En otro celular:** entra como `maria`, pide al Rancho Costeño **a domicilio** y paga en efectivo.
6. Con `rancho` (o `rancho-cajero`) acepta el pedido. Cuando esté listo, a Danto le llega la **oferta** con la tarifa. La toma, la recoge y la entrega, y María ve el avance.
7. **Domiciliario de confianza de un negocio:** `rancho-domi` solo ve los domicilios del Rancho. El dueño los invita en **Empleados y roles** con el rol "Domiciliario".
8. **Un domiciliario nuevo:** se registra en `/#rep` con cédula, pase, foto, moto, placa y Nequi. El admin lo aprueba en `/#admin → Solicitudes`; mientras no lo apruebe, no ve ofertas.
9. **Render Starter** cuando ya sea en serio: el plan gratis se duerme, y dormido no salen ofertas.
10. **Cobros:** el domiciliario cobra en efectivo si es contra entrega. Nequi, Daviplata, Bre-B y Bancolombia los confirma el negocio en **Pagos por confirmar**. La app **no mueve dinero** y no tiene pasarela de pagos.

## 11. Dentro de la app, cada negocio
- **Configuración:** medios de pago y sus datos, horario, zonas y valor del domicilio.
- **Empleados y roles:** invita con el celular, el rol y el **cargo**.
  - Roles: cajero, mesero, cocina, domiciliario o **atención**.
  - El cargo es el nombre que se ve: "Barbero", "Mecánico", "Regente", "Vendedor de ruta"…
  - El rol **atención** solo ve la pantalla de atención del negocio, los pedidos y la asistencia.
- **Mi vitrina y cupones** (nuevo):
  - Cambia la portada (escoge una foto o sube la tuya), tu nombre, tu cargo, tu frase y la promoción destacada.
  - Crea cupones de **valor fijo** (ej.: $2.000 desde $15.000), de **porcentaje** o de **regalo** (ej.: jugo gratis con 2 asados), con fecha de vencimiento. El cliente los ve en tu tienda y toca **Tomar**.
  - "Ver mi negocio" te muestra la tienda como la ve el cliente.
- **La pantalla de atención** (en el menú, bajo HOY) cambia según el negocio: mesas de billar, turnos y fila, mostrador, fórmulas, órdenes de taller, venta por mayor, venta por medida, tallas y separados, acopio, producción y encargos, rutas, visitas a fincas o mesas del restaurante. Trae datos de ejemplo: bórralos o cámbialos por los tuyos.
- **Pantalla de cocina:** abre el panel en una tablet con la cuenta del rol Cocina → **Pantalla completa**.
- **QR de asistencia y de mesas:** imprímelos ya en el dominio final.

---

## Variables de Render (todas)

| Variable | Obligatoria | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Sí | `postgresql://…neon.tech/…?sslmode=require` |
| `NODE_ENV` | Sí | `production` |
| `DB_MAX_CONEXIONES` | Sí | `5` |
| `VAPID_PUBLICA` / `VAPID_PRIVADA` / `VAPID_CONTACTO` | Para domicilios | `mailto:tu-correo@…` |
| `GOOGLE_CLIENT_ID` | No | `…apps.googleusercontent.com` |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | No | — |
| `WHATSAPP_TOKEN` / `WHATSAPP_NUMERO_ID` / `WHATSAPP_PLANTILLA_CODIGO` / `WHATSAPP_IDIOMA` | No | `codigo_ingreso` · `es_CO` |
| `BREVO_API_KEY` / `CORREO_REMITENTE` / `CORREO_NOMBRE` | No (para recuperar por correo) | `xkeysib-…` · `no-responder@tudominio.com` · `Mi Tienda` |
| `SERVUS_DEMO` | **Solo en el servidor de pruebas** | `1` |

## Lo que la versión Servus 0.1 guarda y dónde
- **En el servidor** (si hay `DATABASE_URL`): las cuentas, los pedidos, los domicilios, los códigos de recuperar la clave (solo su hash) y el **estado de cada pantalla de atención**. Ese estado incluye mesas, turnos, órdenes de taller, acopio, encargos, la vitrina y los cupones del negocio, y se comparte entre los celulares del equipo.
- **Si dos personas cambian algo al mismo tiempo**, la segunda ve "Otra persona del equipo cambió algo" y repite lo último. No se pierde lo que guardó la primera.
- **Lo público de cada negocio** (vitrina, cupones activos, mesas libres del billar, horas ocupadas de la barbería) lo puede ver cualquiera, **sin datos de clientes ni de dinero**.
- **Sin servidor**, todo queda en el celular (modo demostración).

---

## Alertas que debes saber
- **Marca "Mi Tienda":** es un nombre muy genérico. Es probable que la SIC no lo registre solo, sin un logo o una palabra distintiva. Antes de invertir en dominio y publicidad, busca antecedentes en el SIPI de la SIC y consulta con un asesor. "Servus 0.1" es solo el nombre de esta versión del código; no aparece ante el cliente.
- **Cuentas de prueba:** `SERVUS_DEMO=1` y `npm run semilla` crean un administrador y cuentas con clave `1234`. Úsalos solo en una base de pruebas.
- **Fotos de ejemplo:** las fotos de productos y personas son de una biblioteca libre (CC0) y solo sirven para el prototipo.
  - Cada negocio debe poner **sus fotos reales**, porque mostrar una foto que no es del producto puede confundir al comprador.
  - Las personas de los perfiles de ejemplo no son los dueños reales.
- **Datos personales:** completa en `privacidad.html` los datos del responsable antes de publicar. El correo que ahora se guarda para recuperar la clave también es un dato personal. Lo recomendable es que lo revise un abogado.
- **Droguería:** la venta con fórmula, la venta fraccionada y los domicilios de medicamentos tienen reglas del servicio farmacéutico. Confírmalas con el regente o con la secretaría de salud.
- **Billares y licor:** la venta de licor a menores está prohibida. La tienda del billar lo recuerda, pero el negocio debe verificar la edad.
- **PQR:** la app muestra 15 días hábiles como plazo guía. Confírmalo con un asesor.
- **Costos de Meta (WhatsApp):** cada código enviado cuesta, también los de recuperar la clave. Pon un límite de gasto.
