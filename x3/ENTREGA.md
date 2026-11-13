# Mi Tienda · Servus 3.0 · Entrega

La portada nueva con la diagramación de las capturas de MartFury (la "V2 · Inicio · escritorio" del lienzo), con el contenido real de Mi Tienda. Todo lo de Servus 0.2 sigue funcionando igual.

## 1. Qué cambió

### Encabezado
- Franja de arriba "Nuevo · Registra tu negocio en Mi Tienda" con su botón.
- Barra de utilidades con Seguir mi pedido, Instalar la app, Hazte domiciliario y Entrar a mi negocio.
- El buscador muestra el selector de categoría (ya existía, estaba escondido).
- El botón lima **Comprar por departamento** abre el mismo menú de categorías de antes.
- Al bajar, la franja y la barra se esconden para que el encabezado pegado no ocupe tanto.
- En celular no salen la barra de utilidades ni el selector de categoría.

### Franja de pautas (lo que pediste)
- Ocupa todo el ancho.
- Cada vez que cambia la pauta, toda la franja toma el color de esa pauta y muestra su misma foto difuminada y opaca detrás. El cambio es suave.
- Los textos entran por capas.
- Siguen las reglas de la 0.2: mínimo 3 y máximo 5 pautas, "Patrocinado", se pausa con el mouse y se desliza con el dedo.
- A la derecha quedan las 2 pautas fijas de antes ("Mercado a domicilio" y "¿Tienes un negocio?").

### Debajo de la franja
1. **Caja de atajos** con divisores: son los mismos 6 atajos de la 0.2, ahora toda la casilla es el botón.
2. **Estados de los negocios** en una franja gris de lado a lado.
3. **Círculos de categorías**: se conservan.
4. **3 vitrinas**: el aviso que cada uno de los 3 negocios mejor calificados montó en su tienda.
5. **Súper ofertas** en franja roja con "Ver más" y un reloj de Horas, Minutos y Segundos. El riel sigue moviéndose solo.
6. **4 franjas rojas por categoría**, cada una con el mayor descuento real que hay hoy en esa categoría. Si hay menos de 2 categorías con descuento, la sección no sale.
7. **Top 5, Combos y Negocios que debes conocer**: siguen moviéndose solos, ahora sobre fondo gris.
8. **Un bloque por departamento**, hasta 6, los que más productos con foto tienen. Cada bloque trae:
   - las subcategorías y los negocios del departamento;
   - una pauta vertical con sus 3 productos más vendidos, que rota sola cada 5 segundos y se cambia con los puntos;
   - 6 productos.
9. **Más para ti** y **Todos los negocios**: se conservan.
10. **Vistos recientemente**: sale del historial que ya guardaba la app y lleva a cada producto.
11. **Cupones del pueblo**: lleva a la página de cupones que ya existía.

### Pie de página
- Ahora es claro, con las palabras clave por categoría y los medios de pago.
- **Línea de atención:** sale solo si escribes el número en `js/config.js` (`lineaAtencion`). Mientras esté vacío, no sale.

## 2. Supuestos
1. El enlace de MartFury no abrió desde mi espacio de trabajo. Seguí tus dos capturas.
2. **Boletín de cupones:** en vez de inventar una suscripción por correo que no existe, el recuadro lleva a la página de **Cupones**.
3. **Las 3 pautas medianas** las armé con el aviso que cada negocio ya montó en su tienda, no con pautas nuevas pagadas.
4. **Departamentos:** usé las 12 categorías que ya tiene Mi Tienda. Salen las que tienen al menos 3 productos con foto.

## 3. Qué probé
Corrí todas las pruebas automáticas el 13 de noviembre de 2026 en mi espacio de trabajo, con PostgreSQL 16. Pasan **163 de 163**:

| Grupo | Resultado |
|---|---|
| Navegador: tienda base, v7, v8, v9 | 29 + 19 + 9 + 22 |
| Navegador: Servus 0.1 y 0.2 | 18 + 11 |
| **Navegador: Servus 3.0** (nuevo, `npm run test:sv3`) | **10 de 10** |
| API: base, v9, Servus 0.1, Servus 0.2 | 22 + 7 + 9 + 7 |

**Lo que prueban las 10 pruebas nuevas:**
- **Encabezado:** franja, barra de utilidades, buscar con categoría y "Comprar por departamento" que abre el menú.
- **Franja de pautas:** al cambiar de pauta cambian el color de la franja y la foto difuminada de atrás, que es la de la pauta activa y sí está difuminada.
- **Atajos:** son 6 y funcionan.
- **Súper ofertas:** el reloj corre y "Ver más" lleva a las ofertas.
- **Franjas por categoría:** cada una muestra el mayor descuento real de esa categoría.
- **Departamentos:** cada uno tiene 6 productos y su pauta vertical cambia con los puntos y lleva al producto.
- **Rieles:** los 4 se mueven solos.
- **Vistos recientemente y Cupones:** llevan al producto y a la página de cupones.
- **Orden:** las secciones salen en el orden del diseño.
- **Celular:** nada se sale de lado.

**Una prueba que falló una vez:** en una de las vueltas completas, una prueba vieja de la v9 (el dueño invita a un cocinero) se pasó del tiempo de espera. Esa prueba no toca la portada. La corrí 2 veces más y pasó las 2; en la primera vuelta completa también había pasado.

**Sin probar:** cómo se ve en un celular físico y en Render con Neon de verdad. Revisé capturas de computador (1440 px) y de celular (390 px) en el navegador automático.

## 4. Cómo subirla
Si ya tienes Servus 0.2 en GitHub, sube **solo la tanda 1**: todo menos `img` y `galeria`, que no cambiaron. No hay migración de base de datos ni variables nuevas en Render. Los pasos están en `GUIA-DESPLIEGUE.md`, sección "Actualizar desde Servus 0.2".

## 5. Pendientes y alertas
- **Productos sin foto:** algunos productos (por ejemplo, pescados y algunos de droguería y agro) no tienen foto y salen con su ícono. Se arregla cuando cada negocio sube sus fotos.
- **Animación del slider:** si me mandas una grabación de pantalla de la página de MartFury, ajusto los tiempos para que quede igual.
- Siguen vigentes los pendientes de Servus 0.2 (abajo).

# Historial

# Mi Tienda · Servus 0.2 · Entrega

**Fecha:** 13 nov. 2026 · **Antes:** Servus 0.1.
**Archivo:** `xervus 2.0.zip`. La marca sigue siendo **Mi Tienda**.
**Qué es:** Servus 0.1 completa más lo que pediste el 12 y el 13 de noviembre. No se reconstruyó nada de lo anterior.

## 1. Qué cambió

### Inicio
- **Franja de pautas arriba:** la foto grande rota sola cada 5,5 segundos (se detiene con el mouse o al tocar) y el **color de toda la franja cambia** según la foto de cada pauta. Las 6 tarjetas de atajos (Ingresa a tu cuenta, Medios de pago…) quedan encima de ese color. A la derecha siguen "Mercado a domicilio desde $2.000" y "¿Tienes un negocio?".
- **Pautas pagadas:** mínimo 3, máximo 5 al aire. Cada una lleva la etiqueta **Patrocinado**. Si hay menos de 3 pagadas, la app completa con anuncios propios (Mi Tienda Pago, Toño, Registra tu negocio) sin esa etiqueta. La app no deja poner una sexta en las mismas fechas.
- **Estados de los negocios:** un círculo por negocio. Al tocarlo se ven sus estados a pantalla completa, con barras de avance, texto y botón (ver la tienda, pedir un producto o escribir por WhatsApp). Mantener presionado pausa. Mientras un negocio no suba los suyos, ve 3 o 4 de ejemplo armados con su portada y sus productos.
- **Carruseles que se mueven solos**, como tu video: Súper ofertas, **Top 5 mejor calificados**, Combos y Negocios que debes conocer. Se detienen al pasar el mouse, al tocar o con el teclado; el producto se levanta y muestra su descripción. Si el celular tiene activado "reducir movimiento", no se mueven.
- **Todos los negocios** muestra la portada de cada negocio, su logo, el tipo y si está abierto. Los que no tienen portada propia muestran una foto según su tipo (asadero, taller, droguería…).
- La oferta que publica un dueño sale **de primera en Súper ofertas** (antes salía en la portada, que ahora es para pautas pagadas).

### Buscar, Toño y subir
- **Micrófono en el buscador:** dictas y busca (Chrome en Android, Safari en iPhone, Chrome o Edge en computador). Pide permiso del micrófono la primera vez.
- **Cámara en el buscador:** tomar foto, subir foto o arrastrar la foto (también sobre la barra de búsqueda). Lee el **código QR o de barras** del producto y abre su ficha. Buscar por lo que se ve en la foto (con inteligencia artificial) quedó como **sugerencia sujeta a tu aprobación** (tiene costo mensual).
- **Micrófono en Toño** y botón **Subir al inicio** al lado de Toño (aparece al bajar).

### Instalar la app
- Al entrar por primera vez **sale la ventana para instalar**. Si la cierran, queda el **aviso pequeño** abajo.
- **Corregido:** antes, si el navegador no ofrecía instalar, la app mostraba "¡Listo! quedó instalada" **sin instalarla** (era una demostración). Ahora explica los pasos reales según el celular (Chrome, Samsung Internet, computador, o "ábrela en Chrome" si se abrió dentro de WhatsApp o Facebook).
- **Corregido:** el service worker fallaba completo si faltaba un solo archivo en el servidor (por ejemplo `js/vendor/qrcode.min.js`), y sin service worker el celular no deja instalar bien. Ahora guarda los archivos uno por uno.
- Si falta `js/vendor/qrcode.min.js` en GitHub, el QR ya no dice solo "QR": dice qué archivo falta.

### Superadministrador (`/#super`)
- **Resumen:** negocios activos, clientes (nuevos en 7 días y hoy), pedidos y ventas de hoy, pautas al aire (de 5) y "Lo que necesita tu atención" (solicitudes, domiciliarios por aprobar, PQR, cupos de pauta libres).
- **Solicitudes:** los negocios llenan **"Registra tu negocio"** (nuevo formulario, enlazado desde el encabezado y el inicio). Aprobar crea el negocio y la cuenta del dueño con una **clave temporal** que se muestra una sola vez, con botón para mandarla por WhatsApp. Rechazar pide el motivo.
- **Negocios:** buscar, ver, suspender o activar. **Clientes:** buscar por nombre, celular o usuario. **Pautas:** cupos de hoy, crear, editar, pausar y borrar, con foto de la galería o subida.
- Usuario de prueba: **`superadmin` / `1234`** (solo con `SERVUS_DEMO=1` o sin servidor). En el servidor real se crea con `SUPERADMIN_USUARIO`, `SUPERADMIN_CLAVE` y `SUPERADMIN_TELEFONO`.

### Restaurantes y asaderos: pedido paso a paso
- La mesera toca la mesa → **Tomar el pedido paso a paso**: una categoría por paso (Asados, Almuerzos, Pescados, Bebidas…), con − y + en cada plato y "Siguiente: …".
- **Resumen tipo factura** con lo pedido, valores y total → **forma de pago**: efectivo con **cálculo de vueltas** (billetes rápidos o el valor exacto), transferencia o QR (muestra el QR con la cuenta del negocio), llave Bre-B o tarjeta (se anota; la app no cobra tarjetas).
- **Enviar pedido** → queda **por aprobar**. El dueño o la cajera lo **envía a cocina** o lo **cancela**; la mesera no puede aprobar.
- Sale un **ticket con QR**: el cliente lo escanea y ve el ticket en su celular (y lo puede imprimir o guardar en PDF). Dice "Ticket de control interno. No es factura electrónica".
- El cliente hace lo mismo desde la app: en la tienda del restaurante, **"Arma tu pedido paso a paso"** → resumen → domicilio, recoger o comer allá → cómo paga → **Hacer pedido**.
- El menú es uno solo, el que maneja el dueño en Productos. No tuve los archivos de la app "El Fogón del Río" en esta sesión; lo armé con tu descripción y tu pantallazo de Mis mesas.

### Billar (como el lienzo L que aprobaste, más la pantalla de la mesa)
- **Anotar partidas:** juego (Bola 8, Bola 9, Carambola, Tres bandas, Chicago, Libre), modo (1 vs 1, 2 vs 2, todos contra todos), jugadores por nombre o apodo, y apuesta (cerveza o gaseosa con cantidad por partida, el tiempo de la mesa, o sin apuesta).
- **¿Quién perdió?** con un toque: suma la apuesta a la cuenta del que perdió; **Deshacer** la última. Botones para agregar jugador, ver la **cuenta por jugador** (con vueltas) y cerrar.
- **Pantalla de cada mesa** (`#marcador-negocio-mesa`): jugadores con su foto de perfil, ganadas, perdidas, lo que debe cada uno, quién va ganando, últimas partidas, reloj y QR. Se actualiza cada 3 segundos y no deja que la pantalla se apague. No muestra plata ni celulares.
- **El jugador escanea el QR**, escoge su nombre y queda vinculado: su foto sale en la pantalla y sus partidas quedan en **Mis partidas** (en Mi cuenta).
- **Foto de perfil** del cliente en Mi cuenta.

### Mis estados (dueño)
- Panel → **Mis estados**: foto o video de máximo **15 segundos y 8 MB**, texto y botón. Máximo 10. La app revisa la duración del video antes de subirlo.
- Con servidor, se guardan en la base de datos de Neon y el video se puede adelantar (también en iPhone).

## 2. Supuestos
1. "Fogón del Río": sin sus archivos, seguí tu descripción (categorías por botones, cantidades, Siguiente, resumen, forma de pago, enviar). Si me mandas pantallazos, lo ajusto.
2. Estados: no se borran solos a las 24 horas (no lo pediste). El dueño los borra.
3. Videos de estados en Neon por ahora (dijiste 15 segundos). Cuando crezca, se mueven a Cloudflare R2.
4. Pautas: el valor lo escribes tú en cada una; no puse precios.
5. El superadministrador usa el mismo rol "admin" que ya aprobaba domiciliarios.

## 3. Qué probé
Todas las pruebas automáticas pasan (**153 de 153**), corridas el 13 de noviembre en este espacio de trabajo con PostgreSQL 16:

| Grupo | Resultado |
|---|---|
| Navegador: tienda base, v7, v8, v9, Servus 0.1 | 29 + 19 + 9 + 22 + 18 |
| **Navegador: Servus 0.2** (nuevo, `npm run test:sv2`) | **11 de 11** |
| API: base, v9, Servus 0.1 | 22 + 7 + 9 |
| **API: Servus 0.2** (nuevo, `npm run test:api-sv2`) | **7 de 7** |

Lo nuevo que prueban: franja con 3 pautas "Patrocinado" y cambio de color; estados (abrir, avanzar, botón a la tienda); los 4 carruseles se mueven y se detienen con el mouse; buscar con la foto de un QR abre el producto; Subir al inicio; billar completo (partidas, apuesta en la cuenta, pantalla de la mesa sin plata, jugador que se vincula y ve Mis partidas); pedido paso a paso de la mesera con vueltas de $100.000, aprobación del dueño y ticket abierto por QR; pedido paso a paso del cliente; registro de negocio → aprobación con clave temporal → el dueño entra; máximo de 5 pautas; Mis estados con foto; videos de más de 15 s rechazados; video que se adelanta (Range); superadministrador creado con variables; ventana de instalar al entrar + aviso pequeño + pasos reales sin simular; nada se sale de lado en el celular.

Se cambiaron pruebas viejas que esperaban lo de antes (la oferta del dueño en la portada, las tarjetas viejas de negocios, el aviso de instalar sin ventana y la instalación simulada).

**Sin probar:** la instalación real en un celular físico (Playwright no puede tocar el botón del sistema; probé que ya no se simula y que el aviso real del navegador muestra dónde quedó el ícono), el micrófono real (el navegador automático no tiene micrófono; probé que el botón está), el lector de códigos de barras del sistema (BarcodeDetector; probé la lectura de QR con jsQR), un televisor real con la pantalla de la mesa, y Render y Neon de verdad.

## 4. Cómo subirla
Igual que Servus 0.1, en 3 tandas (ver `GUIA-DESPLIEGUE.md` y los 5 videotutoriales). Desde Servus 0.1 no se pierde nada: la migración `007_servus02.sql` solo agrega.

## 5. Pendientes y alertas
- **Fotos:** usé todas las fotos libres (CC0) útiles que tengo a mano. Para comida, droguería y talleres no hay más fotos libres buenas: lo mejor es que cada negocio suba las suyas (portada, productos y estados). Desde este espacio de trabajo no puedo descargar de bancos de fotos.
- **Búsqueda por lo que se ve en la foto (IA):** pendiente de tu aprobación por el costo mensual.
- **Videos en Neon:** el plan gratis tiene poco espacio. Con muchos negocios subiendo videos, hay que pasarlos a un almacenamiento aparte.
- **Factura electrónica:** la app genera tickets de control, no facturas electrónicas de la DIAN.
- **Nombre de la marca:** sigue siendo Mi Tienda; te propuse 10 nombres en el chat.

# Historial

# Mi Tienda · Servus 0.1 · Entrega

**Fecha:** 12 nov. 2026 · **Antes:** Mi Tienda v9.
**Archivo:** `xervus.zip`. La marca sigue siendo **Mi Tienda**; "Servus 0.1" es el nombre de esta versión.
**Qué es:** la v9 completa más lo que pediste a partir de "Lainec · 7 propuestas de interfaz", "7 propuestas de interfaz 3" y "G · AliExpress · Tienda del negocio". No se reconstruyó nada de lo anterior.

## 1. Qué cambió

### Diseño
- Estilo de las propuestas: verde petróleo, letra Inter, tarjetas blancas y fondo gris claro.
- Encabezado blanco con "Registra tu negocio" y "Hazte domiciliario".
- En el celular, la barra de abajo tiene Inicio, Buscar, Pedidos, Carrito e Ingresar / Mi cuenta.
- El panel de cada negocio tiene el menú oscuro con los grupos **HOY, DINERO, NEGOCIO y EQUIPO** y, al pie, la persona que está dentro con su cargo.

### Inicio (como tu imagen, con el cambio que pediste)
1. **Portada:** muestra la última oferta que publique un dueño. Si no hay, sale la de ejemplo (hamburguesa del Rancho).
2. **Círculos de categorías:** comida, mercado, granos, droguería, moda, calzado, granja, agro, pesca, mascotas, helados y mandados.
3. **Súper ofertas**, con el reloj de cuánto les falta.
4. **Los mejor calificados** (por estrellas y número de reseñas, con el sello Confianza) **al lado de Combos** (dos negocios en un solo domicilio). "Agregar combo" pone los dos productos en el carrito.
5. **Negocios que debes conocer:** logo, seguidores, Seguir, 3 fotos y el dueño con "Escribir" por WhatsApp.
6. **Más para ti:** el resto de productos con foto, con "Ver más".
7. **Todos los negocios:** el directorio. El enlace "Negocios" del encabezado baja hasta aquí.

En el celular va uno debajo del otro, como la propuesta 7, y además aparece "Abiertos cerca de ti". La cliente que ya tiene pedidos entregados ve también **"Pedir de nuevo"**.

### Ingreso y contraseña
- Los logos de **Google, Facebook y WhatsApp se ven siempre**. Si alguno no está configurado, al tocarlo la app explica que todavía no está activo.
- Debajo están **"Registrarme con mis datos"** (con correo opcional) y **"¿Ya tienes cuenta con correo? Ingresar"**.
- **Se puede entrar con el correo**, además de con el usuario o el celular.
- **"¿Olvidaste tu contraseña?":**
  - la persona escribe su correo o su celular y escoge **al correo** o **al WhatsApp**;
  - le llega un código de 6 números que vence en 10 minutos;
  - con el código crea la clave nueva, entra, y las sesiones abiertas en otros aparatos se cierran.
- El correo sale con **Brevo** y el WhatsApp con la misma plantilla de autenticación de Meta. En el computador funciona en modo de prueba, con el código en pantalla.

### "Ver mi negocio" (como el PDF de AliExpress)
- **Portada y encabezado:** portada con foto, logo, sello Confianza, estrellas, reseñas y seguidores, más los botones **+ Seguir** y **Escribir al negocio**.
- **Pestañas:** Inicio, Productos (con buscador), Combos, Reseñas y Sobre el negocio.
- **En Inicio:**
  - la tarjeta del dueño, con foto, cargo y frase;
  - los **cupones del negocio**, con botón **Tomar**;
  - **Así entregamos**: zonas, valores y medios de pago;
  - la promoción destacada, lo más pedido y "Lo que dicen los vecinos".
- **Cupones nuevos:**
  - de **valor fijo** desde un mínimo ("$2.000 desde $15.000"): al pagar dice cuánto falta si no alcanza;
  - de **porcentaje**;
  - de **regalo** ("Jugo natural gratis con 2 asados"): el regalo queda anotado en el pedido.
  - Todos tienen fecha de vencimiento.
- **Mi vitrina y cupones** (menú del dueño): el dueño escoge la portada o sube su foto, y cambia su nombre, su cargo, su frase y la promoción. También crea, prende y apaga cupones. Cuando el dueño ve su tienda, arriba sale "Así ven tu negocio los clientes · Editar mi vitrina".
- **Cada tienda muestra lo propio de su negocio:**
  - billar: mesas libres, tarifas, apartar una mesa por 15 minutos y el aviso de licor;
  - barbería: pedir turno con servicio, barbero y hora;
  - taller: "¿Tu moto está en el taller?" para ver y aprobar la cotización;
  - droguería: cómo enviar la fórmula.

### Cómo atiende cada negocio (según "7 propuestas de interfaz 3")
El menú es igual para todos. En **HOY** aparece una sola pantalla que cambia según el negocio:

| Negocio | Pantalla | Qué se puede hacer |
|---|---|---|
| Billar | Mesas de billar | Reloj por mesa, pausar, consumo, pasar a otra mesa, dividir la cuenta, parar y cobrar por fracciones de 15 min, y las tarifas |
| Barbería | Turnos y fila | Agenda por barbero (hoy y mañana), turnos de la app, pasar de la fila a la silla, terminar y cobrar |
| Tienda, papelería, frutas | Mostrador | Código de barras o nombre, lo más vendido, venta por peso, 6 medios de pago, fiado al cuaderno y pedidos para armar |
| Droguería | Mostrador y fórmulas | Tableta, blíster o caja; los de fórmula no se venden sin aprobación; revisar fórmulas y lotes por vencer |
| Taller | Órdenes de taller | Tablero de 5 columnas, recibir moto, diagnóstico, cotización, enviarla por WhatsApp con el enlace, aprobada y entregar cobrando |
| Granero | Venta por mayor | Precio tendero o público, libra, arroba o bulto, pedidos de tenderos con crédito y cupo, contado o crédito |
| Ferretería | Mostrador y cotizaciones | Medida en metros, kilos o galones, filtros por medida, cotización por WhatsApp, imprimir y convertir en venta |
| Moda y calzado | Tallas y separados | Color × talla (tocar para vender), más vendidos, plan separe con abonos y cambios |
| Pescadores | Acopio y nevera | Recibir pescado por pescador, precio del día, vender por libra y liquidación de la semana (queda en gastos) |
| Quesera | Producción y encargos | Leche por finca, producción al inventario, venta por peso y encargos |
| Distribuidora | Rutas y preventa | Mapa de la ruta, paradas, tomar pedido, sin pedido, cobrar cartera y armar el camión |
| Agro | Mostrador y visitas | Venta con historial por finca y visitas del veterinario (la consulta va a la caja) |
| Granja | Producción y encargos | Recolección por galpón (los panales van al inventario), lo publicado hoy y encargos que se repiten |
| Restaurante | Mis mesas + Cocina | 9 mesas con estados, pedido por QR para confirmar, enviar a cocina, "comida lista", pidió la cuenta y cobrar |

- **Cocina:** comandas de las mesas, de los domicilios y de los pedidos de la app, en tres colores (recién llegada, preparando, atrasada a los 10 min). Al marcar **LISTO**, la mesera recibe el aviso.
- **Caja del turno** (cajera de cualquier negocio): cobrado en su turno, efectivo en caja, **pagos por confirmar** ("Sí llegó / No ha llegado"), mesas que pidieron la cuenta, anotar gasto y nueva venta. El balance solo lo ve el dueño.

### Roles con datos de ejemplo
- **Rol nuevo "atención"**, con el nombre del cargo que se ve (barbero, mecánico, auxiliar de farmacia, despachador, vendedor de ruta, veterinaria, galponero…). Solo ve la pantalla de atención, los pedidos y la asistencia.
- **Cómo entra cada cargo:**
  - cocina → comandas;
  - mesera → mis mesas;
  - cajera → caja del turno (en la tienda, el mostrador);
  - atención → la pantalla de su negocio.
- **Un usuario por cargo en cada negocio** (clave 1234), y todas las pantallas traen datos de ejemplo. La lista está en `CONFIGURACION-PLATAFORMAS.md`.
- **Página `#demo`:** toca a una persona y entras como ella. En el servidor real se apaga sola, salvo que pongas `SERVUS_DEMO=1`.
- **Perfil de ejemplo del domiciliario** (`#domi-demo`, Danto): mapa, conectarse, pedidos cerca con su tarifa, tomar, los 3 pasos y las ganancias del día. El domiciliario real sigue en `#rep`.

### Compartido entre celulares (con servidor)
- El estado de cada pantalla de atención se guarda en el servidor (tabla `sv_estado`). Los celulares del mismo negocio lo traen cada 12 segundos mientras la pantalla está abierta.
- Si dos guardan al mismo tiempo, el segundo recibe "otra persona cambió algo" y repite lo último. No se pisa lo del primero.
- **Lo público** (vitrina, cupones activos, mesas libres, horas ocupadas) se ve sin datos de clientes ni de dinero.
- **Desde la tienda, el cliente:**
  - **aparta una mesa** del billar;
  - **pide turno** en la barbería;
  - **aprueba la cotización** de su moto. El servidor comprueba que el celular de la orden sea el suyo.

### Servidor
- Migración `006_servus01.sql`: códigos de recuperación (solo el hash), rol `atencion` con `cargo` y la tabla `sv_estado`. **No borra nada.**
- Rutas nuevas en `api/sv01.mjs`.
- Con `SERVUS_DEMO=1`, al arrancar se crean una sola vez las cuentas de prueba.
- Fotos: las de productos y portadas están en `galeria/`; las de personas y los logos, en `img/sv/`. Así cada carpeta tiene menos de 100 archivos para subirla a GitHub en 3 tandas.
- Si se descargan las fotos profesionales (`npm run fotos`), esas reemplazan a las de ejemplo.

## 2. Supuestos (tomados sin preguntar, porque no respondiste esas dos preguntas)
1. **Correo:** dejé preparado **Brevo** (plan gratis). Se activa con 2 variables en Render.
2. **Tutorial de configuración:** **escrito** (`CONFIGURACION-PLATAFORMAS.md` y `GUIA-DESPLIEGUE.md`). Si quieres, te hago el video como el de la v9.
3. **"Lightning 7"** lo entendí como **la propuesta 7** del PDF principal (la vista del celular).
4. **Nombres de negocios como en las propuestas:** Droguería La Loba, Barbería El Estilo, Taller El Pistón y Agro La Loba. Hay dos negocios de ejemplo nuevos: **Variedades Chimí** y **Calzado El Paso**, que salen en los combos y en el inicio.
5. **Fotos de ejemplo:** son de una biblioteca libre (CC0) y no son de los negocios reales; cada negocio debe cambiarlas. Hay productos sin foto adecuada (cemento, medicamentos, queso…) y esos siguen con su ícono.
6. **Lo de la v9 que quedó por debajo:** las herramientas de la v9 para los 6 negocios nuevos se reemplazaron en el menú por las pantallas nuevas, pero siguen existiendo por dentro. Las **mesas con QR del servidor** (billar y restaurante) siguen y se abren con el botón "Mesas con QR".
7. **"Los mejor calificados"** usa la calificación y el número de reseñas de cada negocio. En los de ejemplo son números de muestra.

## 3. Qué probé
Corrí todas las pruebas automáticas con la versión final, cada una en su base de pruebas y una tras otra. **Total: 135 de 135 pasaron.**

**Nuevas de Servus 0.1 en navegador: 18 de 18** (`npm run test:sv`):
- **Inicio:**
  - el orden de las secciones, con Los mejor calificados al lado de Combos;
  - que las fotos carguen;
  - que en el celular nada se salga de lado;
  - "Agregar combo".
- **Ingreso y contraseña:**
  - la ventana de ingreso con los 3 logos;
  - recuperar la contraseña por correo de punta a punta (en modo de prueba) y entrar con la clave nueva;
  - escoger WhatsApp.
- **Tienda y cupones:**
  - la tienda del negocio con sus pestañas y el buscador;
  - un cupón de valor fijo que dice cuánto falta y luego descuenta $2.000;
  - el dueño crea un cupón de regalo y cambia la portada, y los dos salen en la tienda.
- **Pantallas de atención:**
  - las 14 pantallas abren con datos de ejemplo y el menú común completo, también en el celular;
  - billar: iniciar, consumo y cobrar queda en la caja;
  - tienda: fiado al cuaderno.
- **Roles:**
  - cocina, mesera, cajera, barbero y mesera de billar entran a lo suyo y lo encuentran lleno;
  - el barbero no ve el balance;
  - `#demo` y el domiciliario de ejemplo.
- **Entre dos celulares, con el servidor:**
  - la mesera manda a cocina, la cocina lo ve, marca LISTO y la mesera recibe "comida lista";
  - la clienta aprueba la cotización de su moto y el taller la ve en reparación;
  - el cliente pide turno y el barbero lo ve en su agenda.

**API de Servus 0.1: 9 de 9** (`npm run test:api-sv`):
- entrar con el correo, y el registro con correo sin repetidos;
- recuperar por **Brevo**: mensaje correcto, código de un solo uso, la clave vieja deja de servir y se cierran las otras sesiones;
- recuperar por **WhatsApp**;
- en producción no muestra códigos ni revela si la cuenta existe;
- rol atención con cargo;
- estado compartido con versión (409 si dos guardan a la vez), y lo público sin consumos;
- apartar mesa, sin repetir;
- turno: misma hora tomada, "el que esté libre" y sin sesión;
- la moto: solo el dueño del celular la ve y la aprueba.

**Las anteriores, actualizadas al diseño nuevo:** tienda 29/29, API 22/22, API v9 7/7, navegador v7 19/19, identidad v8 9/9, v9 22/22.

**Arreglé de paso tres errores que venían de antes:**
1. El servidor podía seguir entregando una versión vieja de un archivo si el nuevo tenía el mismo tamaño.
2. Después de las 7 p. m. la asistencia del servidor no salía en "Hoy" (se comparaba con el día en hora UTC), y el balance tenía el mismo problema con el día.
3. La asistencia no llegaba al servidor si el QR se escaneaba antes de que cargara la sesión. También se corrigió el nombre del rol que salía en esa tabla.

**No probé:**
- el envío real de correos con Brevo ni de WhatsApp con Meta (se simularon sus respuestas);
- Google y Facebook con cuentas reales;
- un celular físico;
- Render y Neon.

Antes de mostrarla, monta el **servidor de pruebas** (sección 0 de `CONFIGURACION-PLATAFORMAS.md`) y recórrela en un Android y un iPhone.

## 4. Cómo subirla
Ver `GUIA-DESPLIEGUE.md`: GitHub en 3 tandas y la sección "Actualizar desde la v9". Lo que se configura en cada plataforma está en `CONFIGURACION-PLATAFORMAS.md`.

## 5. Pendientes y alertas
- **Marca:** "Mi Tienda" es muy genérica; es probable que la SIC no la registre sola. Revisa el SIPI antes de invertir.
- **Seguridad:**
  - cambia la clave de Neon que salió en pantallazos;
  - **nunca** pongas `SERVUS_DEMO=1` ni corras la semilla en la base real, porque crean un administrador y cuentas con clave 1234;
  - no dejes un servidor en internet sin `NODE_ENV=production`, porque mostraría los códigos en pantalla.
- **Datos de ejemplo:** cada negocio real debe borrar o cambiar los de su pantalla de atención (mesas, turnos, órdenes, pedidos de muestra).
- **Fórmulas médicas:** el cliente envía la foto por el chat del pedido. La pantalla de la regente trae un pedido de ejemplo. Confirma las reglas con el regente o con la secretaría de salud.
- **Costos:** cada código por WhatsApp cuesta; Brevo es gratis hasta 300 correos al día.
- **Lo que no se hizo:**
  - pasarela de pagos (no se pidió);
  - subir la foto de la fórmula desde la tienda;
  - el registro completo de un negocio nuevo desde "Registra tu negocio" (por ahora abre el ingreso de negocios);
  - tiempo real instantáneo en las pantallas compartidas (se actualizan cada 12 segundos).

---

# Historial
# Mi Tienda v9 · Entrega

**Fecha:** 12 nov. 2026 · **Antes:** Lainec v8 (y antes LobaMall y HatilloMall).
**Qué es:** la misma plataforma de la v8 con el nombre nuevo **Mi Tienda** y lo que se diseñó en las propuestas I, J y K: la tienda abre sin registrarse, el ingreso con WhatsApp, Google o Facebook, cada rol del equipo entra a lo suyo, el panel completo del negocio y la forma de atender de cada tipo de negocio. No se reconstruyó nada: todo lo de la v8 sigue funcionando.

## 1. Qué cambió

### Nombre
- **Mi Tienda** en toda la app, el manifiesto, el ícono (una tienda con toldo, en Ciénaga, Luciérnaga y Corozo), la ficha de instalación (6 pantallazos nuevos), los avisos, la política de datos y los documentos. El eslogan sigue siendo "Lo que conecta a Loba".

### Entrada sin registro (Propuesta J)
- La app y el enlace **abren de una en la tienda**: ofertas, negocios y productos sin pedir cuenta ni municipio (queda Hatillo por defecto y se cambia en "Enviar a").
- La ficha de instalación ya no tapa la tienda: sale un **aviso pequeño abajo** ("Instala Mi Tienda") y la ficha se abre al tocar Instalar.
- **El ingreso sale solo cuando hace falta** (pedir, chatear, seguir el domicilio): Continuar con WhatsApp (código de 6 números), Continuar con Google, Continuar con Facebook, **Registrarme con mis datos** (nombre, celular, correo opcional, dirección, zona y clave, con autorización de datos) o **usuario / celular / correo y clave**. El carrito no se pierde y el pedido sigue después de entrar.
- Google, Facebook y WhatsApp **solo aparecen cuando están configurados** en el servidor; el servidor comprueba cada ingreso con Google y con Meta antes de abrir la sesión.
- **Cada cuenta entra a lo suyo:** cliente → tienda; dueño → la primera vez elige "Mi negocio" o "Comprar" y después abre directo (con un botón para volver a su negocio); cajero → punto de venta; mesero → mesas; cocina → pantalla de comandas; domiciliario de confianza → domicilios; domiciliario independiente → modo trabajo.

### Panel del negocio (Propuesta I)
- **Medios de pago:** Efectivo, Nequi, **Daviplata**, **Bre-B** (llave), Bancolombia y Fiado, en el pedido, el punto de venta, las mesas y la configuración (cada negocio pone sus números y su llave). Los pagos digitales los confirma el negocio a mano: **no hay pasarela de pagos**.
- **Equipo por roles:** el dueño invita con el celular y el rol (cajero, mesero, cocina, domiciliario de confianza); la app da una clave temporal y un botón para mandarla por WhatsApp. Al quitar a alguien se le cierra la sesión en todos sus aparatos. **El servidor no deja** que un rol use lo que no le toca (la mesera no ve la caja, la cocina no confirma pagos).
- **Pantalla de cocina:** comandas de las mesas (por el servidor) y de los pedidos aceptados; se toca para empezarla (naranja), se pone roja sola al pasar los minutos que fije el dueño (10 por defecto) y **LISTO** la quita. Pantalla completa para tablet.
- **QR de asistencia:** el dueño lo imprime; cada persona del equipo lo escanea con la cámara al llegar y al salir. Queda en el servidor y el dueño ve quién llegó y a qué hora.
- **Balance por día, semana, quincena y mes**, con lo que entró, lo que salió, lo que quedó y lo vendido por forma de pago.
- **PQR:** el cliente envía peticiones, quejas, reclamos o sugerencias (desde el pie de página o "Mi cuenta"); el dueño las ve con los días hábiles que le quedan y responde.
- **Opciones de producto:** la gaseosa pregunta sabor y si va fría; el jugo, sabor, en agua o en leche y el azúcar; en la droguería, la presentación cambia el precio (tableta, blíster, caja).

### Atención por tipo de negocio (Propuesta K)
6 negocios de ejemplo nuevos y la pantalla de atención de cada modelo (lo demás es igual para todos):
| Negocio | Pantalla | Qué hace |
|---|---|---|
| Granero Central (por mayor) | Venta por mayor | Libra, arroba o bulto; precio de tendero o público; inventario en kilos; pedidos de tiendas a crédito con cupo |
| Ferretería El Tornillo (y el depósito) | Por medida y cotizaciones | Metros, kilos, galones o cuartos; cotización por WhatsApp que se vuelve venta |
| Asociación de Pescadores | Acopio y nevera | Lo que trae cada pescador, precio de venta del día por libra, liquidación que queda como gasto |
| Quesera El Playón | Producción y encargos | Leche por finca, queso producido al inventario, encargos con fecha |
| Distribuidora Loba | Rutas y preventa | Paradas de la ruta, pedidos por tienda, cartera, armar el camión |
| Granja Chimí | Recolección y encargos | Huevos por galpón (panales al inventario), encargos que se repiten cada semana |
| Droguería | Fórmulas y vencimientos | Pedidos con medicamentos de fórmula para aprobar o rechazar, lotes próximos a vencer |
| Barbería | Turnos y fila | Fila de los que llegan sin turno, que pasan a la silla |
El restaurante (mesas, comandas, QR), el billar, el taller, la ropa y el agro siguen como en la v8.

### Servidor
- Migración nueva `api/migraciones/005_mitienda_v9.sql` (no borra nada): columnas de correo, Google y Facebook; códigos de WhatsApp (solo el hash); pagos Daviplata y Bre-B; roles nuevos; asistencia; PQR.
- Rutas nuevas en `api/v9.mjs`. WhatsApp real por la Cloud API de Meta en `api/canales/whatsapp.mjs` (se activa con variables de entorno).

## 2. Supuestos
1. **"Moneda de plata" = Daviplata** y **"breve" = Bre-B**, como se interpretó en el diseño.
2. Los **identificadores internos no cambian** (almacenamiento del celular, cookie `lm_sesion`, encabezado `X-Lainec`, nombres `lm-*.js`), para no perder sesiones ni datos de quienes ya tienen la app.
3. El ingreso con Google ya **no se simula**: si no hay ID de cliente configurado, el botón no aparece (antes salía un Google de mentira).
4. Las pantallas nuevas de los tipos de negocio (por mayor, ferretería, pesca, quesera, distribuidora, granja, fórmulas, fila) **guardan en el aparato donde se usan**, igual que la caja, los gastos y el inventario de la v8. Lo que se comparte entre aparatos por el servidor: pedidos, mesas, domicilios, ingreso, equipo, asistencia y PQR.
5. Los días anteriores del balance de los negocios de ejemplo son datos de muestra; en un negocio real salen de lo que se anote cada día.
6. No hay dominio comprado: los documentos dicen "tudominio.com".

## 3. Qué probé
- **Nuevas de la v9 en navegador: 22 de 22** (`npm run test:v9`): marca, tienda sin cuenta, ingreso con WhatsApp en modo de prueba y pedido que sigue, registro, cada rol a su pantalla y sin balance, dueño que elige una vez, permisos del servidor, cocina, asistencia en dos aparatos, balance por periodos, PQR de un cliente a un dueño, invitación de empleado que entra a la cocina, opciones en el punto de venta, por mayor, ferretería, pescadores, quesera, granja, distribuidora, droguería, barbería y que nada se salga de lado en el celular.
- **API nueva: 7 de 7** (`npm run test:api9`): WhatsApp apagado en producción, mensaje correcto a Meta y código de un solo uso, Google y Facebook (con respuestas simuladas de Google y Meta), equipo y permisos, asistencia, PQR, pagos Daviplata y Bre-B.
- Las pruebas anteriores se actualizaron a la entrada nueva (ingreso con la hoja nueva, la ficha que se abre desde el aviso, 23 negocios) y pasaron: tienda **29/29**, API **22/22**, navegador v7 **19/19**, identidad v8 **9/9**.
- **Total: 108 pruebas pasaron.**
- Revisé a ojo las pantallas en celular y computador.

**No probé:** con cuentas reales de Google, Facebook y WhatsApp (no tengo acceso; se probó con respuestas simuladas), en un celular físico, ni en Render y Neon. Antes de anunciar, ábrela en un Android y un iPhone y prueba cada forma de entrar.

## 4. Cómo subirla
Ver `GUIA-DESPLIEGUE.md` (y la sección "Actualizar desde la v8") y `CONFIGURACION-PLATAFORMAS.md`. Video: `tutorial-mi-tienda-v9.mp4`.

## 5. Pendientes y alertas
- **Marca:** "Mi Tienda" es un nombre muy común; es probable que la SIC no lo registre solo. Haz la búsqueda en el SIPI y consulta a un asesor antes de invertir (detalle en `CONFIGURACION-PLATAFORMAS.md`).
- **Seguridad:** cambiar la clave de la base de Neon que salió en pantallazos y la clave del administrador.
- **WhatsApp cuesta:** cada código de ingreso es un mensaje pagado a Meta.
- **Droguería:** confirmar con el regente las reglas de venta con fórmula, fraccionada y a domicilio.
- **Lo que no se hizo:** pasarela de pagos (no se pidió), sincronizar por el servidor las pantallas nuevas de cada tipo de negocio, la red Lainet, el corte mensual de comisiones y las devoluciones.

---

# Historial
# Lainec v8 · Entrega

**Fecha:** 8 nov. 2026 · **Antes:** LobaMall v7 (y antes HatilloMall).
**Qué es:** la misma plataforma de la v7, con el nombre nuevo **Lainec**, la identidad visual aprobada (eslogan **"Lo que conecta a Loba"**) y cinco mejoras de experiencia tomadas de las plataformas de referencia. No se reconstruyó nada: todos los flujos de la v7 siguen igual.

## 1. Qué cambió

### Nombre e identidad
- **Lainec** en toda la app, la ficha de instalación, el manifiesto, el servidor, los avisos, la política de datos y los documentos. Lainec Pago reemplaza a LobaPago/HatilloPago.
- **Logo:** la "C" abierta (la curva del río) con la onda de agua, en el encabezado, el panel del negocio, el pie de página y los íconos de la app (`icons/favicon.svg`, `icon-192.png`, `icon-512.png`, `maskable-512.png`).
- **Colores con nombre propio:** Ciénaga (encabezado, botones), Corozo (el botón más importante: Buscar, Comprar, Pedir, Hacer pedido), Luciérnaga (resaltados), Garza (fondos), Bocachico y Totumo. Todo está en un solo archivo nuevo: `css/lainec.css`.
- **Letras:** Bricolage Grotesque para títulos y el logo, Figtree para textos.
- **Entrada de la app** (municipio, "¿Cómo vas a usar Lainec?", iniciar sesión) en Ciénaga en vez de amarillo.
- **6 pantallazos nuevos** de la ficha de instalación, tomados de la app real con la nueva identidad.

### Mejoras de experiencia (tomadas de las referencias)
| Mejora | De dónde se tomó | Dónde está |
|---|---|---|
| Atajos de categorías deslizables arriba del inicio | Temu, Shein, Dafiti | Inicio, debajo del encabezado |
| Franja de confianza: pagas al recibir, domicilio desde $X, compra protegida, funciona sin señal | Dafiti, Temu | Inicio |
| **Pedir de nuevo** con lo que la cliente ya recibió, con botón Agregar | Amazon, Rappi | Inicio (solo con sesión de cliente) |
| **Lo más buscado en el pueblo** al tocar el buscador | Amazon, Mercado Libre | Buscador |
| Barra fija de compra (precio, Agregar, Comprar) en la ficha del producto, solo en celular | Shein, Temu, Mercado Libre app | Ficha del producto |
| Accesos grandes del inicio más compactos en el celular | Mercado Libre app | Inicio en celular |

Lo que ya traía la v7 al estilo Mercado Libre (carrusel, ofertas del día con cuenta regresiva, cupones, más vendidos, carrito por negocio, opiniones, preguntas, seguimiento) se mantuvo.

## 2. Supuestos
1. **Los identificadores internos no cambian de nombre**, para no perder datos ni romper celulares que ya tienen la app: la clave del almacenamiento del celular (`hatillomall-4-demo`), la cookie de sesión (`lm_sesion`), el valor `origen = 'lobamall'` en la tabla de pedidos (marca lo que se vendió por la app), los nombres de archivos `lm-*.js` y `css/lobamall.css`, y el puente `window.LM`. Nadie los ve en pantalla.
2. El encabezado de seguridad pasa a llamarse `X-Lainec`. El servidor acepta también el viejo `X-LobaMall`, para que un celular con la versión anterior en caché no falle mientras se actualiza.
3. El dominio supuesto es **lainec.com**: está en `related_applications` del manifiesto (sirve para detectar que la app ya está instalada) y en el contacto de los avisos (`soporte@lainec.com`). Si usan otro, cámbienlo ahí y en `VAPID_CONTACTO`.
4. Los logos de los 17 negocios de ejemplo y los emblemas provisionales de los municipios no se cambiaron.

## 3. Qué probé
- Tienda: **29/29** · API con base de datos: **22/22** · Navegador con base de datos (repartidor, admin, QR, billar, punto de venta): **19/19** · **Nuevas de la v8: 9/9** (`npm run test:v8`, no necesita base de datos). Total **79 pruebas pasaron**.
- Las pruebas v8 revisan: que no quede "LobaMall" ni "HatilloMall" en pantalla, el manifiesto y el ícono, los colores del encabezado y del buscador, los atajos (y que el celular no se desplace de lado), la franja de confianza, "Pedir de nuevo" sumando al carrito, lo más buscado, la barra fija (aparece en celular, no en computador, y desaparece al salir de la ficha) y la entrada en Ciénaga.
- Revisé a ojo las pantallas del celular y del computador.

**No probé:** en un celular físico, ni en el servidor de Render (no tengo acceso). Antes de anunciar, ábranla en un Android y un iPhone.

## 4. Cómo subirla sin perder nada
1. Reemplacen los archivos del repositorio por los de `lainec-v8.zip` (no suban `node_modules/`).
2. Render se actualiza solo al detectar el cambio. **No hay migraciones nuevas**: la base de Neon queda igual, con las mismas cuentas y pedidos.
3. Los celulares que ya tenían la app reciben la versión nueva la próxima vez que la abran con señal (el `sw.js` cambió de versión a `lainec-v8-1`). Si alguien sigue viendo el amarillo, que la cierre y la vuelva a abrir.
4. El ícono de la app ya instalada puede tardar en cambiar: Android lo actualiza solo en unos días; en iPhone y computador hay que quitarla e instalarla otra vez.
5. Cuando tengan el dominio: Render → Settings → Custom Domains → `lainec.com`.

## 5. Pendientes y alertas
- **Marca:** registrar Lainec y Lainek en la SIC (clases 35, 39 y 42) y Lainet (clase 38); comprar `lainec.com`, `lainec.co` y `lainek.com`. Hasta entonces, el nombre no es de ustedes.
- **Etiquetas QR impresas:** los QR llevan el dominio con el que se crearon. Impriman las etiquetas cuando ya estén en `lainec.com`.
- **Seguridad:** sigue pendiente cambiar la clave de la base de Neon que salió en pantallazos, y la clave del administrador.
- **Lo que no se hizo:** la red Lainet (servidor local con batería), el corte mensual automático de comisiones, la confirmación del pedido por WhatsApp y el flujo de devoluciones. Son desarrollos nuevos que se discutieron, no parte de esta versión.

---

# Historial (LobaMall v7)

# LobaMall v7 · Entrega

## Segunda entrega (6 nov. 2026): entrada a la app, punto de venta por categoría y mesas con QR

**Nuevo**
1. **Entrada completa:**
   - La ficha de instalación tipo Play Store sale **de primero**, con tamaño real (0,3 MB comprimida), versión, 6 pantallazos nuevos, descripción, novedades y **"¿Dónde va a quedar?"** según el aparato (celular Android, iPhone, Windows, Mac).
   - Si ya está instalada: **"Ya tienes LobaMall instalada · ABRIR APP"**.
   - Al abrir la app: **elegir el municipio** (Hatillo, San Martín o Barranco), como Mercado Libre pide el país. Luego **"¿Cómo vas a usar LobaMall?"**: cliente, negocio o domiciliario.
2. **Punto de venta** en todos los negocios, con lo propio de cada tipo (ver `CATEGORIAS-Y-CAJA.md`).
3. **Mesas con QR de un solo uso** para billar (chicos o tiempo, jugadores, extras, factura por jugador) y para restaurantes y asaderos (comensales, comanda, cuenta dividida).
4. Los 5 negocios nuevos ya existen en el servidor (`billar`, `billar-cajero` como mesera, `barberia`, `taller`, `ropa`, `agro`; clave 1234).
5. El servidor ahora envía la app **comprimida** (gzip), que pesa menos de la mitad.

**Archivos nuevos:** `api/mesas.mjs`, `api/migraciones/004_mesas.sql`, `js/lm-mesas.js`, `js/lm-pos.js`, `js/lm-entrada.js`, `CATEGORIAS-Y-CAJA.md`.
**Modificados:** `js/app.js` (ganchos de entrada, ficha v7, cerveza por unidad), `servidor.mjs`, `api/semilla.mjs`, `api/rutas.mjs`, `js/lm-api.js`, `js/lm-inventario.js`, `js/lm-tipos.js`, `css/lobamall.css`, `index.html`, `sw.js`, `manifest.webmanifest`, `icons/screens/*.jpg` y las pruebas.

**Pruebas:** tienda **29/29**, API **22/22** (incluye mesa de billar y mesa de restaurante), navegador **19/19**. En navegador se probó:
- Mesa de billar con 3 celulares: el QR **se decodificó** y lleva a la mesa; los jugadores ven el chico y los extras en vivo; un pedido hecho desde el celular espera a que la mesera lo acepte.
- Al cerrar, "paga uno solo"; si escanean el código usado, sale "ya se usó"; al reabrir la mesa sale un código diferente.
- Punto de venta en tienda (lector y cambio), comidas rápidas (turno), droguería (fórmula) y ropa (talla).
- Entrada completa con municipio y rol.

**Límite honesto:** ningún navegador deja que una página web **abra a la fuerza** la app instalada. "ABRIR APP" la intenta abrir; si el navegador la abre en otra pestaña, la app funciona igual ahí, y la pantalla explica dónde está el ícono. La detección de "ya está instalada" funciona en Chrome y Edge con el dominio real (`related_applications` apunta a `https://lobamall.com/manifest.webmanifest`: cámbialo si usas otro dominio).

**Logos de los municipios:** son **provisionales**, dibujados para la app. Para usar los escudos oficiales, pon `img/municipios/hatillo.png`, `sanmartin.png` y `barranco.png`: la app los usa sola. Pide permiso a cada alcaldía para usarlos.

---

# Primera entrega

Base: **HatilloMall v6** (prototipo funcional). No se reconstruyó: se agregó de forma incremental.
Nuevo nombre: **LobaMall** (lobamall.com) para Hatillo, San Martín y Barranco de Loba.

---

## 1. Auditoría (Paso 0)

1. **Stack:** HTML + CSS + JavaScript sin frameworks, en un solo `js/app.js` (420 KB, un IIFE). PWA con `sw.js` y `manifest`. Servidor Node de 35 líneas que solo entregaba archivos.
2. **Base de datos: no había.** Todo vivía en `localStorage` (clave `hatillomall-4-demo`). Dos celulares no compartían nada.
3. **Autenticación:** simulada en el navegador, clave fija `1234`; Google en modo simulado.
4. **Roles reales:** cliente, dueño y cajero. **No existían**: admin, botón [NECESITO REPARTIDOR], Barranco de Loba, servicios con turno, ni tablas `users/pedidos/pagos` (el prompt los daba por hechos).
5. **Pedidos:** objeto `S.orders` con estados por pasos y una simulación que los hace avanzar solos.
6. **Hosting previsto:** Netlify (estático). Pruebas: 29 con Playwright, todas pasaban.
7. **Reutilicé:** toda la tienda, el panel, el checkout, los estados del pedido, los estilos (variables de color), los íconos, el sistema de hojas (`sheet`), el `toast`, el service worker, el servidor Node y las pruebas.
8. **Decisión clave:** el rol repartidor exige cosas que el navegador solo no puede dar (aceptación atómica entre celulares, validar en el servidor, avisos). Siguiendo la ruta que ya traía el README v6, agregué **una API en el mismo `servidor.mjs` + PostgreSQL**. Sin React ni frameworks: 2 dependencias (`pg` y `web-push`).

## 2. Supuestos (decisiones tomadas sin preguntar)

| # | Supuesto | Por qué |
|---|---|---|
| 1 | Se agregó API Node + PostgreSQL en vez de seguir solo con `localStorage` | Sin servidor no hay aceptación atómica, ni validación de permisos, ni avisos entre celulares |
| 2 | PostgreSQL, no Supabase | Se puede probar completo aquí y desplegar gratis (Neon). Los permisos por fila se validan en el servidor (no hay RLS: la base solo la toca la API) |
| 3 | Las tablas "existentes" (`usuarios`, `pedidos`, `pagos`, `calificaciones`) se crean con `IF NOT EXISTS` en `001_base.sql` | No existían en SQL. Si ya estuvieran, no se tocan |
| 4 | Pedidos viejos quedan con `origen = 'lobamall'` | En v6 todo pedido venía por la app; las ventas de mostrador iban a la caja |
| 5 | La tienda, el panel y el cliente siguen en `localStorage`; el servidor se usa en los puntos de integración | Era la instrucción: no cambiar el comportamiento existente |
| 6 | Un repartidor lleva **un domicilio a la vez** | Es una moto; simplifica el bloqueo de modo. Se cambia quitando un índice |
| 7 | **Fiado:** el domicilio lo cubre el **negocio** (le paga al repartidor y cobra producto + domicilio en la cuenta del cliente) | El negocio es quien decide fiar |
| 8 | **Efectivo:** el repartidor cobra producto + domicilio, se queda su domicilio y le debe el resto al negocio. **Nequi:** el cliente le paga todo al negocio y el negocio le debe el domicilio al repartidor | Una sola "caja del repartidor" con saldo + o − por negocio |
| 9 | Si el negocio **sube el valor**, la diferencia la pone el negocio | El cliente ya pagó la tarifa normal |
| 10 | Si el negocio cancela con el repartidor ya en camino, se le reconoce el domicilio | Hizo el viaje |
| 11 | El cliente solo cancela antes de que el repartidor recoja | Después debe llamar al negocio |
| 12 | Al entrar, el repartidor aprobado arranca en modo trabajo; al recargar se respeta el modo guardado en el servidor | Las dos reglas del prompt juntas |
| 13 | Coordenadas de Hatillo, San Martín y Barranco tomadas de Wikipedia; **Chimí sin coordenadas** (usa 6 km de referencia, editable) | No encontré una fuente confiable para Chimí |
| 14 | Fotos (cédula, pase, evidencias, productos) guardadas en la base, comprimidas en el celular | Evita otro servicio; a escala de La Loba alcanza. Ver pendientes |
| 15 | Los 5 negocios nuevos y sus herramientas guardan sus datos en el navegador (como el resto del panel v6) | Coherente con el prototipo |

## 3. Plan por fases (ejecutado completo)

1. **Datos y API** — migraciones, autenticación real, rol repartidor, ofertas atómicas, tiempo real, push, vencimiento, caja, Nequi manual, calificaciones, comisión por origen.
2. **Pantallas del repartidor** — registro con fotos y Habeas Data, "en revisión", tablero de trabajo, modo dual, entrega con foto, mapa, ganancias.
3. **Admin** — aprobación, tarifas por zona, reglas, cajas, comisiones, domicilios, fotos pendientes.
4. **Integración negocio/cliente** — [NECESITO REPARTIDOR], sección Domicilios, pedidos entre celulares, seguimiento real para el cliente.
5. **Tu pedido extra** — 5 tipos de negocio nuevos con su herramienta propia, e inventario con foto, QR, etiquetas y escáner.
6. **Pruebas y documentación.**

## 4. Archivos nuevos y modificados

**Nuevos**
- `api/db.mjs`, `api/auth.mjs`, `api/rutas.mjs`, `api/tiempo-real.mjs`, `api/notificaciones.mjs`, `api/geo.mjs`, `api/semilla.mjs`
- `api/canales/webpush.mjs`, `api/canales/whatsapp.mjs` (adaptador fase 3, apagado)
- `api/migraciones/001_base.sql`, `002_repartidor.sql`, `003_inventario_qr.sql`
- `js/lm-api.js`, `js/lm-repartidor.js`, `js/lm-admin.js`, `js/lm-negocio.js`, `js/lm-tipos.js`, `js/lm-inventario.js`
- `js/vendor/qrcode.min.js` (MIT), `js/vendor/jsQR.min.js` (Apache 2.0, se carga solo al escanear), `js/vendor/leaflet/` (BSD), `js/vendor/LICENCIAS.md`
- `css/lobamall.css`, `privacidad.html`, `.env.ejemplo`, `GUIA-DESPLIEGUE.md`, `ENTREGA.md`
- `tests/api/api.test.mjs` (20 pruebas), `tests/pruebas-v7.mjs` (17 pruebas)

**Modificados**
- `servidor.mjs` — API + solo publica archivos de la app (antes publicaba `package.json`, `tests/`, todo).
- `js/app.js` — cambios mínimos y marcados con "LobaMall v7": puntos de integración (`EXT`), 5 categorías, 5 negocios, 19 productos, Barranco de Loba, logo provisional, foto del inventario en la tienda, marca LobaMall. La llave de `localStorage` no cambió (no se pierden datos de la demo).
- `index.html`, `manifest.webmanifest`, `sw.js` (push + nunca guarda la API), `package.json`, `tests/pruebas.mjs` (12 → 17 negocios).

## 5. Lo que preguntaste: ¿las opciones del dueño cambian según el negocio?

**Tienes razón, pero solo en parte.** El 70 % del panel es igual para todos y debe seguir igual (así el equipo capacita una sola vez):
tablero, caja, gastos, balance, productos, **inventario con foto y QR**, promociones, clientes y fiados, reseñas, empleados y configuración.
Lo que cambia es **la herramienta principal de trabajo**, porque cada negocio cobra distinto:

| Tipo | Cómo cobra | Herramienta propia (nueva) |
|---|---|---|
| Restaurante, comidas rápidas | Por plato, con domicilio | Pedidos + Domicilios (ya existía) |
| **Billar y juegos** | Por **tiempo** de mesa + consumo | **Mesas y cuentas**: cronómetro por mesa, consumo, cobrar → caja |
| **Barbería y belleza** | Por **servicio con hora** | **Turnos del día**: agenda, estilista, a domicilio (+$5.000), recordatorio por WhatsApp, lo que gana cada estilista. No usa repartidores |
| **Taller de motos** | Repuestos + mano de obra | **Órdenes de servicio**: placa, falla, estados, repuestos que salen del inventario, aviso por WhatsApp, **historial por placa** |
| **Ropa y calzado** | Por prenda, **talla y color** | **Tallas y apartados**: inventario por talla, apartado con abonos, vence a 30 días |
| **Agro y veterinaria** | Por unidad, **lote/vencimiento**, a granel | **Lotes y vencimientos**: alerta de lo que vence, bloquea lo vencido, venta por kilo |
| Ferretería / depósito | Producto pesado, flete | Atributos referencia/medida; fiado apagado por defecto (ya existía) |

El menú del panel se arma solo según el tipo (`LM.TIPOS` en `js/lm-tipos.js`). Al crear un producto, el asistente pide los datos propios del tipo (talla y color en ropa; lote, vencimiento y registro ICA en agro; INVIMA en droguería).

## 6. Inventario con foto profesional y QR: sí es posible, y quedó así

1. **Agregar producto (asistente de 3 pasos):** datos y **dónde está en el local** → foto profesional (lista de chequeo del montaje: fondo blanco, luz, centrado) o "la toma el equipo después" → se crea el **código** (`RC-0012`) y el **QR**.
2. **Fotos pendientes:** el equipo de LobaMall entra con su cuenta (`equipo`) y ve todos los productos sin foto de todos los negocios.
3. **Al terminar el inventario:** "Seleccionar las que faltan" → **Imprimir** en hoja carta (21 por hoja) o rollo térmico 50 × 30 mm. Cada etiqueta trae **QR + código de barras 128 + código escrito + precio + lugar**.
4. **Cómo se lee:**
   - **Cámara normal del celular** (sin instalar nada): abre la ficha del producto.
   - **Escáner de la app** (celular, tablet o **cámara USB** en el computador).
   - **Lector USB tipo pistola:** sí, funciona como un teclado. Uno barato de línea roja lee las **barras**; uno 2D lee el QR. No hay que abrir nada: se dispara en cualquier pantalla. Si el lector está configurado en inglés y Windows en español (escribe `RC'0012`), la app lo corrige sola.
   - **Buscador:** escribe el código, el nombre, la categoría o el lugar.
5. **La ficha** muestra foto, precio grande, **"Dónde está"**, disponibles y, si quien escanea es del negocio, **VENDER** (queda en la caja).

## 7. Qué probé y qué no

**Probado aquí (PostgreSQL 16 real + Chromium):**
- `npm test`: **29/29** pruebas originales de la tienda siguen pasando.
- `npm run test:api`: **20/20**. Incluye: aceptación simultánea (10 rondas, 2 repartidores, siempre gana uno), no aprobado (403 y sin avisos), modo cliente sin avisos en la app ni push ni tiempo real (filtro del servidor), bloqueo de cambio de modo con entrega en curso, pedido propio rechazado, migración segura con datos viejos, placa/cédula repetidas, Habeas Data, archivos privados, vencimiento sin avisos duplicados, comisión solo por origen LobaMall, caja en efectivo y fiado, Nequi manual, calificaciones.
- `npm run test:v7`: **17/17** en navegador: registro con fotos y aprobación en vivo, oferta en tiempo real, dos repartidores tocando a la vez, flujo con foto, modo cliente tras recargar, pedido entre 3 celulares (cliente, negocio, repartidor) con el mismo número, asistente de producto con QR (**el QR se decodificó con jsQR**), escaneo desde otro celular, lector USB simulado, impresión, los 5 tipos de negocio, botones ≥ 48 px y letra ≥ 18 px, sin desplazamiento lateral.
- Las barras Code 128 dan exactamente lo mismo que JsBarcode. La hoja carta se generó como PDF y salen 3 columnas.

**No probado (no se puede desde aquí):**
- **Web Push real** a un celular (se probó el filtro y el envío con un enviador simulado; falta probarlo con llaves VAPID y un Android).
- Cámara física, lector USB físico, impresora real, GPS real y los mapas de OpenStreetMap (sin internet en la prueba).
- Despliegue en Render/Neon, dominio y HTTPS. Celulares Android de gama baja reales.

## 8. Alertas (riesgos en lo existente o en lo nuevo)

1. **Seguridad del servidor v6:** publicaba cualquier archivo de la carpeta (incluidos `package.json` y `tests/`). Ya corregido con una lista de archivos públicos.
2. **Claves "1234" y usuarios de demostración** siguen en la tienda local. La semilla del servidor se niega a correr en producción.
3. El **pedido entre celulares** solo funciona si el cliente entró con una cuenta que existe en el servidor (las cuentas nuevas de la tienda local todavía no se crean en el servidor).
4. Los **números de pedido** los propone cada celular; el servidor los iguala si están libres, pero con mucho uso simultáneo podrían diferir.
5. El **límite de intentos** está en memoria: con más de un servidor hay que moverlo a la base.
6. **Render gratis se duerme**: los avisos y el vencimiento de ofertas se detienen mientras duerme.
7. **Fotos en la base**: bien para empezar; con miles de productos conviene moverlas a un almacenamiento de archivos.
8. Los **mosaicos de OpenStreetMap** tienen política de uso justo: con mucho tráfico hay que usar un proveedor.
9. Los QR llevan el dominio con que se imprimieron: **imprime en lobamall.com**.
10. `privacidad.html` es un **borrador** con espacios en amarillo (responsable, NIT, correo, plazos). Que lo revise un abogado antes de publicar.
11. Los 5 negocios nuevos tienen **logo provisional**; falta su identidad de marca como los 12 de v5.
12. Los botones "Avisar por WhatsApp" solo abren un enlace `wa.me` (gratis). **La API de WhatsApp no se usa** (fase 3 apagada).

## 9. Pendientes para la siguiente etapa

1. Probar push, cámara, lector e impresora en celulares y equipos reales de La Loba.
2. Pasar a servidor el resto de la tienda (cuentas, catálogo, caja), para que todo sea multi-celular.
3. Que el servidor asigne siempre el número del pedido.
4. Reportes del admin por municipio (ventas totales, impulso/publicidad) y cobro de mensualidades.
5. Fotos en almacenamiento de archivos (Supabase Storage o Cloudflare R2).
6. Identidad de marca de los 5 negocios nuevos y sus fotos profesionales.
7. Clave de 6 dígitos o código por SMS para repartidores.
8. WhatsApp Business (fase 3) cuando haya presupuesto.
