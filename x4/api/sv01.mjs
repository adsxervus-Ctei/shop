// Mi Tienda · Servus 0.1 · rutas nuevas
//  1. Recuperar la contraseña: código de 6 números al correo (Brevo) o al WhatsApp registrado.
//  2. Pantalla de atención de cada negocio compartida entre los celulares del equipo (mesas, turnos,
//     órdenes de taller, acopio, encargos…) y su vitrina pública (portada, frase del dueño, cupones).
//  3. Lo que el cliente hace desde la tienda: apartar una mesa de billar, pedir turno en la barbería
//     y aprobar la cotización del taller.
import { randomInt, createHash, timingSafeEqual } from 'node:crypto';
import { q, uno, tx } from './db.mjs';
import * as auth from './auth.mjs';
import { ruta, falla, requiereSesion, requiereNegocio, txt, perfil, ip } from './rutas.mjs';
import { whatsappCodigoActivo, enviarCodigoWhatsApp } from './canales/whatsapp.mjs';

const ENV = process.env;
const produccion = () => ENV.NODE_ENV === 'production';
const sha = t => createHash('sha256').update(String(t)).digest('hex');
const ROLES = ['dueno', 'cajero', 'mesero', 'cocina', 'domiciliario', 'atencion'];

/* ================= 1. recuperar la contraseña ================= */
export const correoActivo = () => !!(ENV.BREVO_API_KEY && ENV.CORREO_REMITENTE);
let enviarHttp = (url, op) => fetch(url, op);
export const usarEnviador = fn => { enviarHttp = fn; };

// Correo transaccional con Brevo (https://www.brevo.com). Solo se usa si están BREVO_API_KEY y CORREO_REMITENTE.
export async function enviarCorreoCodigo(para, nombre, codigo) {
  if (!correoActivo()) return { ok: false, motivo: 'no_configurado' };
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;color:#14181b">
    <p>Hola, ${String(nombre || '').replace(/[<>&]/g, '')}.</p>
    <p>Tu código para crear una clave nueva en <b>Mi Tienda</b> es:</p>
    <p style="font-size:30px;font-weight:700;letter-spacing:6px;color:#0d5c63">${codigo}</p>
    <p>Vence en 10 minutos. Si no lo pediste tú, ignora este correo: tu clave sigue igual.</p></div>`;
  try {
    const r = await enviarHttp('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': ENV.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: { name: ENV.CORREO_NOMBRE || 'Mi Tienda', email: ENV.CORREO_REMITENTE }, to: [{ email: para }], subject: codigo + ' es tu código de Mi Tienda', htmlContent: html })
    });
    if (!r.ok) { console.error('[correo] Brevo respondió', r.status, (await r.text()).slice(0, 300)); return { ok: false, motivo: 'brevo_' + r.status }; }
    return { ok: true };
  } catch (e) { console.error('[correo]', e.message); return { ok: false, motivo: 'sin_red' }; }
}

async function buscarCuenta(dato) {
  const d = String(dato || '').trim().toLowerCase();
  if (d.includes('@')) return uno('select * from usuarios where correo is not null and lower(correo)=$1', [d]);
  let tel = auth.soloDigitos(d).replace(/^57(?=3\d{9}$)/, '');
  if (/^3\d{9}$/.test(tel)) return uno('select * from usuarios where telefono=$1', [tel]);
  return uno('select * from usuarios where usuario=$1', [d]);
}
const ocultarCorreo = c => String(c).replace(/^(.)(.*)(@.*)$/, (_, a, b, d) => a + '•'.repeat(Math.min(6, b.length)) + d);
const ocultarTel = t => String(t).replace(/(\d{3})(\d{3})(\d{4})/, '$1 ••• $3');

ruta('POST', '/api/auth/recuperar/pedir', async (ctx, b) => {
  const canal = b.canal === 'whatsapp' ? 'whatsapp' : 'correo';
  const dato = txt(b.dato, 120);
  if (dato.length < 5) falla(400, 'dato', 'Escribe tu correo o tu celular.');
  if (!auth.limitar('rec-ip:' + ip(ctx.req), 10, 3600e3) || !auth.limitar('rec:' + dato.toLowerCase(), 3, 15 * 60e3))
    falla(429, 'muchos_intentos', 'Pediste muchos códigos. Espera 15 minutos.');
  const activo = canal === 'correo' ? correoActivo() : whatsappCodigoActivo();
  if (!activo && produccion()) falla(503, canal + '_apagado', canal === 'correo'
    ? 'La recuperación por correo todavía no está activa. Prueba por WhatsApp.'
    : 'La recuperación por WhatsApp todavía no está activa. Prueba por correo.');
  const u = await buscarCuenta(dato);
  // La respuesta es igual exista o no la cuenta, para no revelar quién está registrado
  const generica = { ok: true };
  if (!u || !u.activo) return produccion() ? generica : { ok: true, prueba: true, codigo: null, aviso: 'No hay cuenta con ese dato (solo se dice en modo de prueba).' };
  const destino = canal === 'correo' ? u.correo : u.telefono;
  if (!destino) return produccion() ? generica : { ok: true, prueba: true, codigo: null, aviso: 'Esa cuenta no tiene ' + (canal === 'correo' ? 'correo' : 'celular') + ' registrado.' };
  const codigo = String(randomInt(0, 1e6)).padStart(6, '0');
  await q('update codigos_recuperar set usado=true where usuario_id=$1 and not usado', [u.id]);
  await q(`insert into codigos_recuperar(usuario_id, canal, codigo_hash, expira) values ($1,$2,$3, now() + interval '10 minutes')`, [u.id, canal, sha(u.id + ':' + codigo)]);
  if (activo) {
    const r = canal === 'correo' ? await enviarCorreoCodigo(destino, u.nombre, codigo) : await enviarCodigoWhatsApp(destino, codigo);
    if (!r.ok) falla(502, 'envio_fallo', 'No pudimos enviar el código. Intenta de nuevo en un momento.');
    return { ok: true, a: canal === 'correo' ? ocultarCorreo(destino) : ocultarTel(destino) };
  }
  // Modo de prueba (solo fuera de producción): el código se muestra en pantalla
  return { ok: true, prueba: true, codigo, a: canal === 'correo' ? ocultarCorreo(destino) : ocultarTel(destino) };
});

ruta('POST', '/api/auth/recuperar/cambiar', async (ctx, b) => {
  const u = await buscarCuenta(txt(b.dato, 120));
  const codigo = auth.soloDigitos(b.codigo).slice(0, 6), clave = String(b.clave || '');
  if (clave.length < 4) falla(400, 'clave', 'La clave nueva debe tener mínimo 4 números o letras.');
  if (!auth.limitar('rec-ver:' + ip(ctx.req), 20, 15 * 60e3)) falla(429, 'muchos_intentos', 'Muchos intentos. Espera 15 minutos.');
  const c = u && await uno('select * from codigos_recuperar where usuario_id=$1 and not usado and expira > now() order by id desc limit 1', [u.id]);
  if (!c) falla(400, 'codigo_vencido', 'El código no es válido o ya venció. Pide uno nuevo.');
  if (c.intentos >= 5) falla(400, 'codigo_bloqueado', 'Escribiste mal el código muchas veces. Pide uno nuevo.');
  const a = Buffer.from(c.codigo_hash, 'hex'), bb = Buffer.from(sha(u.id + ':' + codigo), 'hex');
  if (!(a.length === bb.length && timingSafeEqual(a, bb))) {
    await q('update codigos_recuperar set intentos=intentos+1 where id=$1', [c.id]);
    falla(400, 'codigo_malo', 'Ese código no es. Revisa el mensaje.');
  }
  await q('update codigos_recuperar set usado=true where id=$1', [c.id]);
  await q('update usuarios set clave_hash=$2 where id=$1', [u.id, auth.hashClave(clave)]);
  await q('delete from sesiones where usuario_id=$1', [u.id]); // se cierra en los demás aparatos
  const token = await auth.crearSesion(u.id, ctx.req.headers['user-agent']);
  ctx.cookie = auth.cookieSesion(token, ctx.segura);
  return { token, usuario: await perfil(u) };
});

/* ================= 2. pantalla de atención compartida ================= */
const MAX_ESTADO = 400 * 1024;
async function leerEstado(nid) {
  const r = await uno('select datos, version, actualizado from sv_estado where negocio_id=$1', [nid]);
  return r || { datos: null, version: 0, actualizado: null };
}
ruta('GET', '/api/negocio/:nid/sv', async (ctx, b, p) => {
  await requiereNegocio(ctx, p.nid, ROLES);
  return await leerEstado(p.nid);
});
// Guarda el estado completo. Si otro celular guardó antes (versión distinta), responde 409 con lo último
// para que la app mezcle y vuelva a guardar.
ruta('PUT', '/api/negocio/:nid/sv', async (ctx, b, p) => {
  await requiereNegocio(ctx, p.nid, ROLES);
  if (!b || typeof b.datos !== 'object' || Array.isArray(b.datos)) falla(400, 'datos', 'Faltan los datos.');
  if (JSON.stringify(b.datos).length > MAX_ESTADO) falla(413, 'muy_grande', 'Hay demasiada información guardada. Borra registros viejos.');
  return tx(async c => {
    const r = await c.uno('select version from sv_estado where negocio_id=$1 for update', [p.nid]);
    const v = r ? r.version : 0;
    if (b.version != null && Number(b.version) !== v) {
      const act = await c.uno('select datos, version, actualizado from sv_estado where negocio_id=$1', [p.nid]);
      falla(409, 'version', 'Otra persona del equipo cambió algo. Se actualizó la pantalla.', { actual: act });
    }
    const n = await c.uno(`insert into sv_estado(negocio_id, datos, version) values ($1,$2,1)
      on conflict (negocio_id) do update set datos=excluded.datos, version=sv_estado.version+1, actualizado=now() returning version, actualizado`, [p.nid, b.datos]);
    return { ok: true, version: n.version, actualizado: n.actualizado };
  });
}, { limite: MAX_ESTADO + 4096 });

// Lo que puede ver cualquiera en la tienda del negocio (sin datos de clientes ni de dinero)
function publico(d) {
  d = d || {};
  const out = { vitrina: d.vitrina || null, cupones: (d.cupones || []).filter(c => c.activo) };
  if (d.billar) out.mesas = (d.billar.mesas || []).map(m => ({ id: m.id, n: m.n, tipo: m.tipo, estado: m.ini ? 'ocupada' : (m.apartada && m.apartada.hasta > Date.now() ? 'apartada' : 'libre') }));
  if (d.billar) out.tarifas = d.billar.tarifas || null;
  if (d.barberia) out.barberos = (d.barberia.barberos || []).map(x => ({ id: x.id, n: x.n, ocupados: (x.agenda || []).filter(a => a.dia === hoy()).map(a => a.h) }));
  if (d.barberia) out.fila = (d.barberia.fila || []).length;
  return out;
}
const hoy = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10); // hora de Colombia
ruta('GET', '/api/sv/:nid/publico', async (ctx, b, p) => {
  const e = await leerEstado(p.nid);
  return Object.assign({ version: e.version }, publico(e.datos));
});

/* ================= 3. lo que hace el cliente desde la tienda ================= */
ruta('POST', '/api/sv/:nid/cliente', async (ctx, b, p) => {
  const u = requiereSesion(ctx);
  if (!auth.limitar('svc:' + u.id, 20, 3600e3)) falla(429, 'muchos_intentos', 'Hiciste muchas solicitudes. Espera un rato.');
  const accion = txt(b.accion, 30);
  return tx(async c => {
    const r = await c.uno('select datos, version from sv_estado where negocio_id=$1 for update', [p.nid]);
    if (!r) falla(404, 'sin_datos', 'Este negocio todavía no abrió su pantalla de atención.');
    const d = r.datos, quien = { id: Number(u.id), nombre: u.nombre, tel: u.telefono || '' };
    let resp = {};
    if (accion === 'apartar-mesa') {
      const m = ((d.billar || {}).mesas || []).find(x => String(x.id) === String(b.mesa));
      if (!m) falla(404, 'mesa', 'Esa mesa no existe.');
      if (m.ini || (m.apartada && m.apartada.hasta > Date.now())) falla(409, 'ocupada', 'Esa mesa ya está ocupada o apartada. Escoge otra.');
      m.apartada = { por: quien.nombre, tel: quien.tel, uid: quien.id, hasta: Date.now() + 15 * 60e3 };
      resp = { mesa: m.n, hasta: m.apartada.hasta };
    } else if (accion === 'turno') {
      const bb = d.barberia || {}, servicio = (bb.servicios || []).find(s => s.id === b.servicio);
      if (!servicio) falla(400, 'servicio', 'Escoge el servicio.');
      let barbero = (bb.barberos || []).find(x => x.id === b.barbero);
      const h = txt(b.hora, 8);
      if (!/^\d{1,2}:\d{2}$/.test(h)) falla(400, 'hora', 'Escoge la hora.');
      const libre = x => !(x.agenda || []).some(a => a.dia === hoy() && a.h === h);
      if (!barbero) barbero = (bb.barberos || []).find(libre);
      if (!barbero || !libre(barbero)) falla(409, 'ocupado', 'Esa hora ya la tomaron. Escoge otra.');
      (barbero.agenda = barbero.agenda || []).push({ dia: hoy(), h, cli: quien.nombre, tel: quien.tel, servicio: servicio.id, app: true, estado: 'turno' });
      resp = { barbero: barbero.n, hora: h, servicio: servicio.n, valor: servicio.p };
    } else if (accion === 'aprobar-ot') {
      const o = ((d.taller || {}).ordenes || []).find(x => x.id === b.ot);
      if (!o) falla(404, 'orden', 'Esa orden no existe.');
      if (!o.tel || auth.soloDigitos(o.tel) !== String(u.telefono || '')) falla(403, 'no_es_tuya', 'Esa moto no está a tu nombre.');
      if (o.estado !== 'aprobacion') falla(409, 'estado', 'Esa cotización ya no espera aprobación.');
      o.aprobada = b.solo ? 'parcial' : 'todo'; if (b.solo) o.items = (o.items || []).filter(i => i.k === b.solo || i.mo);
      o.estado = 'reparacion'; o.log = (o.log || []).concat([{ h: Date.now(), t: 'El cliente aprobó la cotización por la app' }]);
      resp = { ot: o.id, estado: o.estado };
    } else falla(400, 'accion', 'Esa acción no existe.');
    await c.q('update sv_estado set datos=$2, version=version+1, actualizado=now() where negocio_id=$1', [p.nid, d]);
    return Object.assign({ ok: true }, resp);
  });
});

// El cliente consulta su moto en el taller (solo si el celular de la orden es el suyo)
ruta('GET', '/api/sv/:nid/moto/:ot', async (ctx, b, p) => {
  const u = requiereSesion(ctx);
  const e = await leerEstado(p.nid);
  const o = (((e.datos || {}).taller || {}).ordenes || []).find(x => x.id === p.ot);
  if (!o || !o.tel || auth.soloDigitos(o.tel) !== String(u.telefono || '')) falla(404, 'orden', 'No encontramos esa orden a tu nombre.');
  return { orden: o };
});
