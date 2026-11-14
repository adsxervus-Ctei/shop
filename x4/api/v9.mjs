// Mi Tienda v9 · rutas nuevas
//  1. Ingreso sin clave: código por WhatsApp, cuenta de Google y cuenta de Facebook.
//  2. Equipo de trabajo por roles (cajero, mesero, cocina, domiciliario de confianza).
//  3. Asistencia del equipo con el QR del negocio.
import { randomInt, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { q, uno, filas } from './db.mjs';
import * as auth from './auth.mjs';
import { ruta, falla, requiereSesion, requiereNegocio, txt, perfil, ip } from './rutas.mjs';
import { whatsappCodigoActivo, enviarCodigoWhatsApp } from './canales/whatsapp.mjs';

const ENV = process.env;
const produccion = () => ENV.NODE_ENV === 'production';
const sha = t => createHash('sha256').update(String(t)).digest('hex');
const ROLES_EQUIPO = ['cajero', 'mesero', 'cocina', 'domiciliario', 'atencion'];
const celular = v => { const d = auth.soloDigitos(v).replace(/^57(?=3\d{9}$)/, ''); if (!/^3\d{9}$/.test(d)) falla(400, 'telefono', 'El celular debe tener 10 números y empezar por 3.'); return d; };

// Para las pruebas: se puede cambiar cómo se consulta a Google y a Facebook
let consultar = (url, op) => fetch(url, op);
export const usarConsultor = fn => { consultar = fn; };

async function abrirSesion(ctx, u) {
  const token = await auth.crearSesion(u.id, ctx.req.headers['user-agent']);
  ctx.cookie = auth.cookieSesion(token, ctx.segura);
  return { token, usuario: await perfil(u) };
}

/* ================= 1. ingreso ================= */
// Qué formas de entrar están activas (la app muestra solo las que funcionan)
ruta('GET', '/api/auth/proveedores', async () => ({
  google: !!ENV.GOOGLE_CLIENT_ID, google_client_id: ENV.GOOGLE_CLIENT_ID || '',
  facebook: !!(ENV.FACEBOOK_APP_ID && ENV.FACEBOOK_APP_SECRET), facebook_app_id: ENV.FACEBOOK_APP_ID || '',
  whatsapp: whatsappCodigoActivo() || !produccion(),
  whatsapp_prueba: !whatsappCodigoActivo() && !produccion(),
  // Servus 0.1
  correo: !!(ENV.BREVO_API_KEY && ENV.CORREO_REMITENTE), demo: ENV.SERVUS_DEMO === '1' || !produccion()
}));

// WhatsApp, paso 1: enviar el código de 6 números
ruta('POST', '/api/auth/whatsapp/codigo', async (ctx, b) => {
  const tel = celular(b.telefono);
  if (!auth.limitar('wa-ip:' + ip(ctx.req), 10, 3600e3) || !auth.limitar('wa-tel:' + tel, 3, 15 * 60e3))
    falla(429, 'muchos_intentos', 'Pediste muchos códigos. Espera 15 minutos.');
  const activo = whatsappCodigoActivo();
  if (!activo && produccion()) falla(503, 'whatsapp_apagado', 'El ingreso con WhatsApp todavía no está activo. Entra con tu celular y clave.');
  const codigo = String(randomInt(0, 1e6)).padStart(6, '0');
  await q(`update codigos_whatsapp set usado=true where telefono=$1 and not usado`, [tel]);
  await q(`insert into codigos_whatsapp(telefono, codigo_hash, expira) values ($1,$2, now() + interval '10 minutes')`, [tel, sha(tel + ':' + codigo)]);
  if (activo) {
    const r = await enviarCodigoWhatsApp(tel, codigo);
    if (!r.ok) falla(502, 'whatsapp_fallo', 'No pudimos enviar el código por WhatsApp. Intenta de nuevo en un momento.');
    return { ok: true, enviado: true };
  }
  // Modo de prueba (solo fuera de producción): el código se muestra en pantalla
  return { ok: true, enviado: false, prueba: true, codigo };
});

// WhatsApp, paso 2: comprobar el código. Si el celular no tiene cuenta, pide el nombre y la crea.
ruta('POST', '/api/auth/whatsapp/verificar', async (ctx, b) => {
  const tel = celular(b.telefono), codigo = txt(b.codigo, 6);
  if (!auth.limitar('wa-ver:' + tel, 8, 15 * 60e3)) falla(429, 'muchos_intentos', 'Muchos intentos. Pide un código nuevo en 15 minutos.');
  const c = await uno(`select * from codigos_whatsapp where telefono=$1 and not usado and expira > now() order by id desc limit 1`, [tel]);
  if (!c) falla(400, 'codigo_vencido', 'El código se venció. Pide uno nuevo.');
  if (c.intentos >= 5) falla(400, 'codigo_bloqueado', 'Escribiste mal el código muchas veces. Pide uno nuevo.');
  const a = Buffer.from(c.codigo_hash, 'hex'), bb = Buffer.from(sha(tel + ':' + codigo), 'hex');
  if (!(a.length === bb.length && timingSafeEqual(a, bb))) {
    await q('update codigos_whatsapp set intentos=intentos+1 where id=$1', [c.id]);
    falla(400, 'codigo_malo', 'Ese código no es. Revisa el mensaje de WhatsApp.');
  }
  let u = await uno('select * from usuarios where telefono=$1', [tel]);
  if (u && !u.activo) falla(403, 'inactivo', 'Esta cuenta está desactivada.');
  if (!u) {
    const nombre = txt(b.nombre, 80);
    if (nombre.length < 3) return { nuevo: true }; // la app pide el nombre y vuelve a llamar con el mismo código
    if (!b.acepta_datos) falla(400, 'habeas', 'Debes autorizar el tratamiento de tus datos para crear la cuenta.');
    u = await uno(`insert into usuarios(telefono, nombre, correo, clave_hash, roles) values ($1,$2,$3,$4,'{cliente}') returning *`,
      [tel, nombre, txt(b.correo, 120) || null, auth.hashClave(randomBytes(12).toString('hex'))]);
  }
  await q('update codigos_whatsapp set usado=true where id=$1', [c.id]);
  return abrirSesion(ctx, u);
});

// Busca la cuenta por el identificador del proveedor o por el correo; si no existe, la crea
async function cuentaExterna(campo, id, nombre, correo) {
  let u = await uno(`select * from usuarios where ${campo}=$1`, [id]);
  if (!u && correo) {
    u = await uno('select * from usuarios where lower(correo)=lower($1)', [correo]);
    if (u) await q(`update usuarios set ${campo}=$2 where id=$1`, [u.id, id]);
  }
  if (!u) u = await uno(`insert into usuarios(nombre, correo, ${campo}, clave_hash, roles) values ($1,$2,$3,$4,'{cliente}') returning *`,
    [txt(nombre, 80) || 'Cliente', correo || null, id, auth.hashClave(randomBytes(12).toString('hex'))]);
  if (!u.activo) falla(403, 'inactivo', 'Esta cuenta está desactivada.');
  return u;
}

// Google: la app manda el "credential" (ID token) y aquí se comprueba con Google
ruta('POST', '/api/auth/google', async (ctx, b) => {
  if (!ENV.GOOGLE_CLIENT_ID) falla(503, 'google_apagado', 'El ingreso con Google no está configurado.');
  if (!auth.limitar('g:' + ip(ctx.req), 20, 3600e3)) falla(429, 'muchos_intentos', 'Muchos intentos. Espera un momento.');
  const r = await consultar('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(txt(b.credential, 4000)));
  const d = r.ok ? await r.json() : null;
  if (!d || d.aud !== ENV.GOOGLE_CLIENT_ID || !['accounts.google.com', 'https://accounts.google.com'].includes(d.iss) || String(d.email_verified) !== 'true')
    falla(401, 'google_invalido', 'Google no confirmó tu cuenta. Intenta de nuevo.');
  return abrirSesion(ctx, await cuentaExterna('google_sub', d.sub, d.name || d.email, d.email));
});

// Facebook: la app manda el accessToken del SDK y aquí se comprueba con Meta
ruta('POST', '/api/auth/facebook', async (ctx, b) => {
  if (!ENV.FACEBOOK_APP_ID || !ENV.FACEBOOK_APP_SECRET) falla(503, 'facebook_apagado', 'El ingreso con Facebook no está configurado.');
  if (!auth.limitar('fb:' + ip(ctx.req), 20, 3600e3)) falla(429, 'muchos_intentos', 'Muchos intentos. Espera un momento.');
  const tk = encodeURIComponent(txt(b.accessToken, 4000)), app = encodeURIComponent(ENV.FACEBOOK_APP_ID + '|' + ENV.FACEBOOK_APP_SECRET);
  const r1 = await consultar(`https://graph.facebook.com/debug_token?input_token=${tk}&access_token=${app}`);
  const dbg = r1.ok ? (await r1.json()).data : null;
  if (!dbg || !dbg.is_valid || String(dbg.app_id) !== String(ENV.FACEBOOK_APP_ID)) falla(401, 'facebook_invalido', 'Facebook no confirmó tu cuenta. Intenta de nuevo.');
  const r2 = await consultar(`https://graph.facebook.com/me?fields=id,name,email&access_token=${tk}`);
  const me = r2.ok ? await r2.json() : null;
  if (!me || String(me.id) !== String(dbg.user_id)) falla(401, 'facebook_invalido', 'Facebook no confirmó tu cuenta. Intenta de nuevo.');
  return abrirSesion(ctx, await cuentaExterna('facebook_id', String(me.id), me.name, me.email));
});

// Completar datos después de entrar con Google o Facebook (el celular sirve para los domicilios)
ruta('POST', '/api/auth/datos', async (ctx, b) => {
  const u = requiereSesion(ctx);
  const tel = b.telefono ? celular(b.telefono) : null;
  if (tel) { const otro = await uno('select id from usuarios where telefono=$1 and id<>$2', [tel, u.id]); if (otro) falla(409, 'ya_existe', 'Ese celular ya está en otra cuenta.'); }
  const n = await uno('update usuarios set telefono=coalesce($2, telefono), nombre=coalesce(nullif($3,\'\'), nombre) where id=$1 returning *', [u.id, tel, txt(b.nombre, 80)]);
  return { usuario: await perfil(n) };
});

/* ================= 2. equipo de trabajo ================= */
ruta('GET', '/api/negocio/:nid/equipo', async (ctx, b, p) => {
  await requiereNegocio(ctx, p.nid, ['dueno']);
  return { equipo: await filas(`select u.id, u.nombre, u.telefono, nu.rol, nu.cargo from negocio_usuarios nu join usuarios u on u.id=nu.usuario_id where nu.negocio_id=$1 order by nu.rol, u.nombre`, [p.nid]) };
});

// El dueño agrega a alguien con su celular y su rol. Si no tenía cuenta, se crea con una clave temporal
// que el dueño le manda por WhatsApp junto con el enlace (también puede entrar con el código de WhatsApp).
ruta('POST', '/api/negocio/:nid/equipo', async (ctx, b, p) => {
  await requiereNegocio(ctx, p.nid, ['dueno']);
  const rol = txt(b.rol, 20), tel = celular(b.telefono), nombre = txt(b.nombre, 80);
  if (!ROLES_EQUIPO.includes(rol)) falla(400, 'rol', 'Escoge un rol: cajero, mesero, cocina, domiciliario o atención.');
  let u = await uno('select * from usuarios where telefono=$1', [tel]), clave = null;
  if (!u) {
    if (nombre.length < 3) falla(400, 'nombre', 'Escribe el nombre de la persona.');
    clave = String(randomInt(100000, 1e6));
    u = await uno(`insert into usuarios(telefono, nombre, clave_hash, roles) values ($1,$2,$3,'{negocio,cliente}') returning *`, [tel, nombre, auth.hashClave(clave)]);
  } else if (!u.roles.includes('negocio')) await q(`update usuarios set roles=array_append(roles,'negocio') where id=$1`, [u.id]);
  const ya = await uno('select rol from negocio_usuarios where negocio_id=$1 and usuario_id=$2', [p.nid, u.id]);
  if (ya && ya.rol === 'dueno') falla(409, 'es_dueno', 'Esa persona es dueña del negocio.');
  const cargo = txt(b.cargo, 40) || null;
  await q(`insert into negocio_usuarios(negocio_id, usuario_id, rol, cargo) values ($1,$2,$3,$4) on conflict (negocio_id, usuario_id) do update set rol=excluded.rol, cargo=excluded.cargo`, [p.nid, u.id, rol, cargo]);
  return { ok: true, usuario_id: Number(u.id), nombre: u.nombre, telefono: tel, rol, cargo, clave_temporal: clave };
});

ruta('POST', '/api/negocio/:nid/equipo/:uid/quitar', async (ctx, b, p) => {
  await requiereNegocio(ctx, p.nid, ['dueno']);
  const r = await uno(`delete from negocio_usuarios where negocio_id=$1 and usuario_id=$2 and rol<>'dueno' returning usuario_id`, [p.nid, p.uid]);
  if (!r) falla(404, 'no_existe', 'Esa persona no está en el equipo.');
  await q(`delete from sesiones where usuario_id=$1`, [p.uid]); // sale de todos los aparatos
  return { ok: true };
});

/* ================= 3. asistencia ================= */
ruta('POST', '/api/negocio/:nid/asistencia', async (ctx, b, p) => {
  const { u } = await requiereNegocio(ctx, p.nid, ['dueno', 'cajero', 'mesero', 'cocina', 'domiciliario', 'atencion']);
  const ult = await uno('select tipo from asistencia where negocio_id=$1 and usuario_id=$2 and en::date = now()::date order by id desc limit 1', [p.nid, u.id]);
  const tipo = b.tipo === 'salida' || b.tipo === 'entrada' ? b.tipo : (ult && ult.tipo === 'entrada' ? 'salida' : 'entrada');
  const r = await uno('insert into asistencia(negocio_id, usuario_id, tipo) values ($1,$2,$3) returning id, tipo, en', [p.nid, u.id, tipo]);
  return { ok: true, registro: r };
});
ruta('GET', '/api/negocio/:nid/asistencia', async (ctx, b, p) => {
  await requiereNegocio(ctx, p.nid, ['dueno']);
  return { registros: await filas(`select a.id, a.tipo, a.en, u.nombre, nu.rol from asistencia a join usuarios u on u.id=a.usuario_id
                                     left join negocio_usuarios nu on nu.negocio_id=a.negocio_id and nu.usuario_id=a.usuario_id
                                    where a.negocio_id=$1 and a.en > now() - interval '16 days' order by a.en desc limit 300`, [p.nid]) };
});

/* ================= 4. PQR ================= */
const TIPOS_PQR = ['peticion', 'queja', 'reclamo', 'sugerencia'];
ruta('POST', '/api/negocio/:nid/pqr', async (ctx, b, p) => {
  const u = requiereSesion(ctx);
  if (!auth.limitar('pqr:' + u.id, 10, 24 * 3600e3)) falla(429, 'muchos_intentos', 'Ya enviaste muchas PQR hoy.');
  const tipo = TIPOS_PQR.includes(b.tipo) ? b.tipo : falla(400, 'tipo', 'Escoge si es petición, queja, reclamo o sugerencia.');
  const texto = txt(b.texto, 2000);
  if (texto.length < 10) falla(400, 'texto', 'Cuéntanos un poco más (mínimo 10 letras).');
  const neg = await uno('select id from negocios where id=$1', [p.nid]);
  if (!neg) falla(404, 'no_existe', 'Ese negocio no existe.');
  const r = await uno(`insert into pqr(negocio_id, usuario_id, nombre, telefono, tipo, texto) values ($1,$2,$3,$4,$5,$6) returning id, creado`, [p.nid, u.id, u.nombre, u.telefono, tipo, texto]);
  return { ok: true, radicado: 'PQR-' + String(r.id).padStart(5, '0'), id: Number(r.id) };
});
ruta('GET', '/api/pqr/mias', async ctx => {
  const u = requiereSesion(ctx);
  return { pqr: await filas(`select p.*, n.nombre as negocio from pqr p join negocios n on n.id=p.negocio_id where p.usuario_id=$1 order by p.id desc limit 50`, [u.id]) };
});
ruta('GET', '/api/negocio/:nid/pqr', async (ctx, b, p) => {
  await requiereNegocio(ctx, p.nid, ['dueno']);
  return { pqr: await filas('select * from pqr where negocio_id=$1 order by estado, id desc limit 200', [p.nid]) };
});
ruta('POST', '/api/negocio/:nid/pqr/:id/responder', async (ctx, b, p) => {
  await requiereNegocio(ctx, p.nid, ['dueno']);
  const resp = txt(b.respuesta, 2000);
  if (resp.length < 5) falla(400, 'respuesta', 'Escribe la respuesta.');
  const r = await uno(`update pqr set respuesta=$3, estado='respondida', respondido=now() where id=$1 and negocio_id=$2 returning id`, [p.id, p.nid, resp]);
  if (!r) falla(404, 'no_existe', 'Esa PQR no existe.');
  return { ok: true };
});
