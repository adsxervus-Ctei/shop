// Mi Tienda · Servus 0.2 · rutas nuevas
//  1. Superadministrador: resumen, solicitudes de negocios nuevos (aprobar o rechazar), negocios, clientes y pautas.
//  2. Pautas del inicio: lo público (máximo 5 activas) y lo que maneja el superadministrador.
//  3. Estados de los negocios: imagen o video de máximo 15 s, con texto y botón.
//  4. Foto de perfil, marcador público de cada mesa de billar y "Mis partidas" del cliente.
//  5. Ticket de una mesa del restaurante que el cliente abre con el QR.
import { randomInt } from 'node:crypto';
import { q, uno, filas, tx } from './db.mjs';
import * as auth from './auth.mjs';
import { ruta, falla, requiereSesion, requiereNegocio, txt, entero, tiene, ip } from './rutas.mjs';

const ENV = process.env;
export const MAX_PAUTAS = 5, MIN_PAUTAS = 3;
const CATEGORIAS = ['comida', 'rapida', 'tienda', 'farmacia', 'papeleria', 'deposito', 'campo', 'billar', 'belleza', 'taller', 'ropa', 'agro', 'mayorista', 'pesca', 'quesera', 'distribuidora', 'granja', 'otro'];
const MUNICIPIOS = ['Hatillo de Loba', 'San Martín de Loba', 'Barranco de Loba', 'Otro'];

function requiereAdmin(ctx) {
  const u = requiereSesion(ctx);
  if (!tiene(u, 'admin')) falla(403, 'sin_permiso', 'Solo el superadministrador puede entrar aquí.');
  return u;
}
const fechaCol = (d = new Date()) => new Date(d.getTime() - 5 * 3600e3).toISOString().slice(0, 10); // Colombia

/* ---------- archivos: fotos y videos en base64 ---------- */
const MIMES_IMG = ['image/jpeg', 'image/png', 'image/webp'], MIMES_VID = ['video/mp4', 'video/webm', 'video/quicktime'];
export const MAX_FOTO = 900 * 1024, MAX_VIDEO = 8 * 1024 * 1024;
function media(dataUrl, permitirVideo) {
  const m = /^data:([a-z]+\/[a-z0-9.+-]+)(?:;[a-z0-9=.+-]+)*;base64,([A-Za-z0-9+/=]+)$/i.exec(String(dataUrl || ''));
  if (!m) falla(400, 'archivo_falta', 'Falta la foto o el video.');
  const mime = m[1].toLowerCase(), esVid = MIMES_VID.includes(mime);
  if (!MIMES_IMG.includes(mime) && !(permitirVideo && esVid)) falla(400, 'archivo_tipo', permitirVideo ? 'Sube una foto (JPG, PNG o WEBP) o un video (MP4 o WEBM).' : 'Sube una foto JPG, PNG o WEBP.');
  const datos = Buffer.from(m[2], 'base64');
  if (datos.length > (esVid ? MAX_VIDEO : MAX_FOTO)) falla(413, 'archivo_pesado', esVid ? 'El video pesa más de 8 MB. Grábalo más corto o en menor calidad.' : 'La foto pesa mucho. Tómala de nuevo.');
  return { mime: mime === 'video/quicktime' ? 'video/mp4' : mime, datos, video: esVid };
}
async function guardar(c, propietario, tipo, a, privado = false) {
  return (await c.uno('insert into archivos(propietario_id, tipo, mime, datos, bytes, privado) values ($1,$2,$3,$4,$5,$6) returning id',
    [propietario, tipo, a.mime, a.datos, a.datos.length, privado])).id;
}
// Fotos y videos públicos (estados, pautas, fotos de perfil) con "Range" para que el video se pueda adelantar en iPhone
ruta('GET', '/api/sv/media/:id', async (ctx, b, p) => {
  const a = await uno("select mime, datos, bytes from archivos where id=$1 and not privado and tipo in ('estado','pauta','perfil')", [entero(p.id)]);
  if (!a) falla(404, 'no_existe', 'No encontrado.');
  const res = ctx.res, total = a.bytes, rango = /bytes=(\d*)-(\d*)/.exec(ctx.req.headers.range || '');
  const h = { 'Content-Type': a.mime, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' };
  if (rango) {
    const ini = rango[1] ? Number(rango[1]) : Math.max(0, total - Number(rango[2] || 0));
    const fin = rango[1] && rango[2] ? Math.min(Number(rango[2]), total - 1) : total - 1;
    if (ini >= total || ini > fin) { res.writeHead(416, { 'Content-Range': 'bytes */' + total }); res.end(); return ctx.SSE; }
    res.writeHead(206, Object.assign(h, { 'Content-Range': `bytes ${ini}-${fin}/${total}`, 'Content-Length': fin - ini + 1 }));
    res.end(a.datos.subarray(ini, fin + 1)); return ctx.SSE;
  }
  res.writeHead(200, Object.assign(h, { 'Content-Length': total })); res.end(a.datos); return ctx.SSE;
});
const urlMedia = id => id ? '/api/sv/media/' + id : null;

/* ================= 1. foto de perfil ================= */
ruta('POST', '/api/yo/foto', async (ctx, b) => {
  const u = requiereSesion(ctx);
  if (!auth.limitar('foto:' + u.id, 10, 3600e3)) falla(429, 'muchos_intentos', 'Cambiaste la foto muchas veces. Espera un rato.');
  const a = media(b.foto, false);
  const id = await tx(async c => { const id = await guardar(c, u.id, 'perfil', a); await c.q('update usuarios set foto_id=$2 where id=$1', [u.id, id]); return id; });
  return { ok: true, foto: urlMedia(id) };
}, { limite: 1300 * 1024 });
ruta('GET', '/api/yo/foto', async ctx => {
  const u = requiereSesion(ctx);
  const r = await uno('select foto_id from usuarios where id=$1', [u.id]);
  return { foto: urlMedia(r && r.foto_id) };
});

/* ================= 2. solicitudes de negocios nuevos ================= */
// Cualquiera puede mandar la solicitud (con o sin cuenta). El superadministrador la revisa.
ruta('POST', '/api/sv/solicitud-negocio', async (ctx, b) => {
  if (!auth.limitar('solneg:' + ip(ctx.req), 5, 3600e3)) falla(429, 'muchos_intentos', 'Ya enviaste varias solicitudes. Espera una hora o escríbenos.');
  const s = {
    nombre: txt(b.nombre, 80), categoria: CATEGORIAS.includes(b.categoria) ? b.categoria : 'otro',
    municipio: MUNICIPIOS.includes(b.municipio) ? b.municipio : 'Otro', direccion: txt(b.direccion, 140),
    dueno: txt(b.dueno, 80), tel: auth.soloDigitos(b.telefono).replace(/^57(?=3\d{9}$)/, ''), correo: txt(b.correo, 120).toLowerCase(), mensaje: txt(b.mensaje, 400)
  };
  if (s.nombre.length < 3) falla(400, 'nombre', 'Escribe el nombre del negocio.');
  if (s.dueno.length < 3) falla(400, 'dueno', 'Escribe el nombre del dueño o la dueña.');
  if (!/^3\d{9}$/.test(s.tel)) falla(400, 'telefono', 'Escribe un celular de 10 números que empiece por 3.');
  if (s.correo && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(s.correo)) falla(400, 'correo', 'Revisa el correo.');
  if (!b.acepta) falla(400, 'acepta', 'Debes aceptar la política de privacidad para enviar la solicitud.');
  const ya = await uno("select id from solicitudes_negocio where telefono=$1 and estado='pendiente'", [s.tel]);
  if (ya) return { ok: true, id: ya.id, repetida: true };
  const r = await uno(`insert into solicitudes_negocio(nombre, categoria, municipio, direccion, dueno_nombre, telefono, correo, mensaje)
    values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`, [s.nombre, s.categoria, s.municipio, s.direccion, s.dueno, s.tel, s.correo || null, s.mensaje]);
  return { ok: true, id: r.id };
});

/* ================= 3. superadministrador ================= */
ruta('GET', '/api/super/resumen', async ctx => {
  requiereAdmin(ctx);
  const hoy = fechaCol();
  const [neg, cli, ped, sol, rep, pau, pqr] = await Promise.all([
    uno(`select count(*)::int total, count(*) filter (where estado='activo')::int activos, count(*) filter (where creado > now() - interval '30 days')::int nuevos30 from negocios`),
    uno(`select count(*)::int total, count(*) filter (where creado > now() - interval '7 days')::int nuevos7, count(*) filter (where creado > now() - interval '1 day')::int hoy from usuarios where 'cliente' = any(roles)`),
    uno(`select count(*)::int pedidos, coalesce(sum(total),0)::bigint ventas from pedidos where (creado - interval '5 hours')::date = $1::date`, [hoy]),
    uno(`select count(*)::int n from solicitudes_negocio where estado='pendiente'`),
    uno(`select count(*)::int n from repartidores where estado_aprobacion='pendiente'`).catch(() => ({ n: 0 })),
    uno(`select count(*)::int n, coalesce(sum(valor),0)::bigint valor from pautas where estado='activa' and $1::date between inicio and fin`, [hoy]),
    uno(`select count(*)::int n from pqr where estado = 'abierta'`).catch(() => ({ n: 0 }))
  ]);
  const semana = await filas(`select to_char((creado - interval '5 hours')::date, 'YYYY-MM-DD') dia, count(*)::int n from usuarios
     where creado > now() - interval '7 days' group by 1 order by 1`);
  const top = await filas(`select n.id, n.nombre, count(p.id)::int pedidos, coalesce(sum(p.total),0)::bigint ventas from negocios n
     left join pedidos p on p.negocio_id=n.id and p.creado > now() - interval '30 days' group by n.id order by pedidos desc, n.nombre limit 5`);
  return { negocios: neg, clientes: cli, hoy: ped, solicitudes: sol.n, repartidores: rep.n, pautas: pau, pqr: pqr.n, semana, top };
});

ruta('GET', '/api/super/solicitudes', async (ctx, b, p, qs) => {
  requiereAdmin(ctx);
  const estado = ['pendiente', 'aprobada', 'rechazada'].includes(qs.get('estado')) ? qs.get('estado') : 'pendiente';
  return { solicitudes: await filas('select * from solicitudes_negocio where estado=$1 order by creado desc limit 200', [estado]) };
});
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'negocio';
ruta('POST', '/api/super/solicitudes/:id/aprobar', async (ctx, b, p) => {
  const adm = requiereAdmin(ctx);
  return tx(async c => {
    const s = await c.uno('select * from solicitudes_negocio where id=$1 for update', [entero(p.id)]);
    if (!s) falla(404, 'no_existe', 'Esa solicitud no existe.');
    if (s.estado !== 'pendiente') falla(409, 'revisada', 'Esa solicitud ya fue revisada.');
    let id = slug(b.id || s.nombre), n = 1;
    while (await c.uno('select 1 from negocios where id=$1', [id])) id = slug(b.id || s.nombre).slice(0, 26) + '-' + (++n);
    await c.q(`insert into negocios(id, nombre, categoria, municipio, direccion, telefono) values ($1,$2,$3,$4,$5,$6)`,
      [id, s.nombre, s.categoria, s.municipio === 'Otro' ? 'Hatillo de Loba' : s.municipio, s.direccion, s.telefono]);
    // El dueño: si ya tiene cuenta con ese celular, se le suma el negocio; si no, se le crea con una clave temporal.
    let u = await c.uno('select id, roles from usuarios where telefono=$1', [s.telefono]), clave = null;
    if (u) {
      if (!u.roles.includes('negocio')) await c.q("update usuarios set roles=array_append(roles,'negocio') where id=$1", [u.id]);
    } else {
      clave = String(randomInt(100000, 1000000));
      let usuario = id, k = 1; while (await c.uno('select 1 from usuarios where usuario=$1', [usuario])) usuario = id + (++k);
      u = await c.uno(`insert into usuarios(telefono, usuario, nombre, clave_hash, roles, correo) values ($1,$2,$3,$4,$5,$6) returning id`,
        [s.telefono, usuario, s.dueno_nombre, auth.hashClave(clave), ['negocio', 'cliente'], s.correo]);
    }
    await c.q('insert into negocio_usuarios(negocio_id, usuario_id, rol) values ($1,$2,$3) on conflict do nothing', [id, u.id, 'dueno']);
    await c.q("update solicitudes_negocio set estado='aprobada', negocio_id=$2, revisado_por=$3, revisado=now() where id=$1", [s.id, id, adm.id]);
    const usr = await c.uno('select usuario from usuarios where id=$1', [u.id]);
    return { ok: true, negocio: id, usuario: usr.usuario, telefono: s.telefono, clave_temporal: clave };
  });
});
ruta('POST', '/api/super/solicitudes/:id/rechazar', async (ctx, b, p) => {
  const adm = requiereAdmin(ctx);
  const motivo = txt(b.motivo, 300);
  if (motivo.length < 5) falla(400, 'motivo', 'Escribe el motivo para que el negocio sepa qué corregir.');
  const r = await uno("update solicitudes_negocio set estado='rechazada', motivo=$2, revisado_por=$3, revisado=now() where id=$1 and estado='pendiente' returning id", [entero(p.id), motivo, adm.id]);
  if (!r) falla(409, 'revisada', 'Esa solicitud ya fue revisada.');
  return { ok: true };
});

ruta('GET', '/api/super/negocios', async ctx => {
  requiereAdmin(ctx);
  return { negocios: await filas(`select n.id, n.nombre, n.categoria, n.municipio, n.estado, n.mensualidad, n.comision_pct, n.creado,
      (select u.nombre from negocio_usuarios nu join usuarios u on u.id=nu.usuario_id where nu.negocio_id=n.id and nu.rol='dueno' limit 1) dueno,
      (select u.telefono from negocio_usuarios nu join usuarios u on u.id=nu.usuario_id where nu.negocio_id=n.id and nu.rol='dueno' limit 1) telefono,
      (select count(*)::int from pedidos p where p.negocio_id=n.id and p.creado > now() - interval '30 days') pedidos30,
      (select count(*)::int from negocio_usuarios nu where nu.negocio_id=n.id) equipo
     from negocios n order by n.creado desc, n.nombre`) };
});
ruta('POST', '/api/super/negocios/:id/estado', async (ctx, b, p) => {
  requiereAdmin(ctx);
  const estado = b.estado === 'suspendido' ? 'suspendido' : 'activo';
  const r = await uno('update negocios set estado=$2 where id=$1 returning id, estado', [p.id, estado]);
  if (!r) falla(404, 'no_existe', 'Ese negocio no existe.');
  return { ok: true, estado: r.estado };
});
ruta('GET', '/api/super/clientes', async (ctx, b, p, qs) => {
  requiereAdmin(ctx);
  const t = txt(qs.get('q') || '', 60).toLowerCase();
  const ls = await filas(`select u.id, u.nombre, u.telefono, u.usuario, u.roles, u.municipio, u.creado, u.activo,
      (select count(*)::int from pedidos p where p.cliente_id=u.id) pedidos
     from usuarios u where ($1 = '' or lower(u.nombre) like '%'||$1||'%' or u.telefono like '%'||$1||'%' or lower(coalesce(u.usuario,'')) like '%'||$1||'%')
     order by u.creado desc limit 100`, [t]);
  return { clientes: ls };
});

/* ================= 4. pautas ================= */
const dia = x => x instanceof Date ? x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0') : x;
const pautaPublica = r => ({ id: r.id, negocio: r.negocio_id, titulo: r.titulo, texto: r.texto, imagen: r.imagen_id ? urlMedia(r.imagen_id) : r.imagen_url, color: r.color, enlace: r.enlace, boton: r.boton, fin: dia(r.fin) });
ruta('GET', '/api/sv/pautas', async () => {
  const ls = await filas(`select * from pautas where estado='activa' and $1::date between inicio and fin order by orden, inicio limit $2`, [fechaCol(), MAX_PAUTAS]);
  return { pautas: ls.map(pautaPublica), minimo: MIN_PAUTAS, maximo: MAX_PAUTAS };
});
ruta('GET', '/api/super/pautas', async ctx => {
  requiereAdmin(ctx);
  const ls = await filas(`select p.*, n.nombre negocio_nombre from pautas p left join negocios n on n.id=p.negocio_id order by p.fin desc, p.orden limit 200`);
  return { pautas: ls.map(r => Object.assign(pautaPublica(r), { inicio: dia(r.inicio), valor: r.valor, estado: r.estado, orden: r.orden, negocio_nombre: r.negocio_nombre })), hoy: fechaCol(), maximo: MAX_PAUTAS };
});
async function choques(c, inicio, fin, sinId) {
  // ¿Algún día del rango ya tiene 5 pautas activas?
  const r = await c.uno(`select max(n)::int m from (select d, count(p.id) n from generate_series($1::date, $2::date, '1 day') d
      left join pautas p on p.estado='activa' and d between p.inicio and p.fin and p.id <> $3 group by d) x`, [inicio, fin, sinId || 0]);
  return r.m || 0;
}
function datosPauta(b) {
  const d = {
    negocio: b.negocio ? txt(b.negocio, 40) : null, titulo: txt(b.titulo, 70), texto: txt(b.texto, 140), color: /^#[0-9a-f]{6}$/i.test(b.color || '') ? b.color : null,
    enlace: txt(b.enlace, 80), boton: txt(b.boton, 24) || 'Ver más', inicio: String(b.inicio || ''), fin: String(b.fin || ''), valor: Math.max(0, entero(b.valor) || 0),
    estado: b.estado === 'pausada' ? 'pausada' : 'activa', orden: entero(b.orden) || 0, imagen_url: /^(galeria|img)\/[\w./-]+$/.test(b.imagen_url || '') ? b.imagen_url : null
  };
  if (d.titulo.length < 3) falla(400, 'titulo', 'Escribe el título de la pauta.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(d.fin) || d.fin < d.inicio) falla(400, 'fechas', 'Revisa las fechas: el fin debe ser igual o después del inicio.');
  return d;
}
ruta('POST', '/api/super/pautas', async (ctx, b) => {
  requiereAdmin(ctx);
  const d = datosPauta(b);
  return tx(async c => {
    if (d.estado === 'activa' && await choques(c, d.inicio, d.fin) >= MAX_PAUTAS) falla(409, 'lleno', `En esas fechas ya hay ${MAX_PAUTAS} pautas activas (el máximo). Escoge otras fechas o pausa una.`);
    const img = b.imagen ? await guardar(c, ctx.u.id, 'pauta', media(b.imagen, false)) : null;
    const r = await c.uno(`insert into pautas(negocio_id, titulo, texto, imagen_id, imagen_url, color, enlace, boton, inicio, fin, valor, estado, orden)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`, [d.negocio, d.titulo, d.texto, img, d.imagen_url, d.color, d.enlace, d.boton, d.inicio, d.fin, d.valor, d.estado, d.orden]);
    return { ok: true, id: r.id };
  });
}, { limite: 1300 * 1024 });
ruta('PUT', '/api/super/pautas/:id', async (ctx, b, p) => {
  requiereAdmin(ctx);
  const d = datosPauta(b), id = entero(p.id);
  return tx(async c => {
    if (!(await c.uno('select 1 from pautas where id=$1', [id]))) falla(404, 'no_existe', 'Esa pauta no existe.');
    if (d.estado === 'activa' && await choques(c, d.inicio, d.fin, id) >= MAX_PAUTAS) falla(409, 'lleno', `En esas fechas ya hay ${MAX_PAUTAS} pautas activas (el máximo).`);
    const img = b.imagen ? await guardar(c, ctx.u.id, 'pauta', media(b.imagen, false)) : undefined;
    await c.q(`update pautas set negocio_id=$2, titulo=$3, texto=$4, color=$5, enlace=$6, boton=$7, inicio=$8, fin=$9, valor=$10, estado=$11, orden=$12,
      imagen_url=coalesce($13, imagen_url) ${img ? ', imagen_id=' + Number(img) : ''} where id=$1`, [id, d.negocio, d.titulo, d.texto, d.color, d.enlace, d.boton, d.inicio, d.fin, d.valor, d.estado, d.orden, d.imagen_url]);
    return { ok: true };
  });
}, { limite: 1300 * 1024 });
ruta('POST', '/api/super/pautas/:id/borrar', async (ctx, b, p) => {
  requiereAdmin(ctx);
  await q('delete from pautas where id=$1', [entero(p.id)]);
  return { ok: true };
});

/* ================= 5. estados de los negocios ================= */
const estadoPublico = r => ({ id: r.id, negocio: r.negocio_id, tipo: r.tipo, src: urlMedia(r.archivo_id), texto: r.texto, cta: { tipo: r.cta_tipo, ref: r.cta_ref, txt: r.cta_txt }, segundos: r.segundos ? Number(r.segundos) : null, creado: r.creado });
ruta('GET', '/api/sv/estados', async () => {
  const ls = await filas(`select e.* from estados_negocio e join negocios n on n.id=e.negocio_id and n.estado='activo'
     where e.activo order by e.negocio_id, e.creado desc`);
  const por = {};
  ls.forEach(r => { (por[r.negocio_id] = por[r.negocio_id] || []).length < 10 && por[r.negocio_id].push(estadoPublico(r)); });
  return { estados: por };
});
ruta('GET', '/api/negocio/:nid/estados', async (ctx, b, p) => {
  await requiereNegocio(ctx, p.nid, ['dueno']);
  return { estados: (await filas('select * from estados_negocio where negocio_id=$1 and activo order by creado desc', [p.nid])).map(estadoPublico) };
});
ruta('POST', '/api/negocio/:nid/estados', async (ctx, b, p) => {
  const { u } = await requiereNegocio(ctx, p.nid, ['dueno']);
  if (!auth.limitar('estado:' + p.nid, 30, 24 * 3600e3)) falla(429, 'muchos_estados', 'Ya subiste muchos estados hoy. Intenta mañana.');
  const a = media(b.archivo, true);
  const seg = Number(b.segundos) || null;
  if (a.video && (!seg || seg > 15.5)) falla(400, 'video_largo', 'El video debe durar máximo 15 segundos.');
  const cta = ['tienda', 'producto', 'whatsapp', 'ninguno'].includes(b.cta_tipo) ? b.cta_tipo : 'tienda';
  return tx(async c => {
    const n = await c.uno('select count(*)::int n from estados_negocio where negocio_id=$1 and activo', [p.nid]);
    if (n.n >= 10) falla(409, 'muchos', 'Tienes 10 estados (el máximo). Borra uno viejo para subir otro.');
    const arch = await guardar(c, u.id, 'estado', a);
    const r = await c.uno(`insert into estados_negocio(negocio_id, tipo, archivo_id, texto, cta_tipo, cta_ref, cta_txt, segundos) values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [p.nid, a.video ? 'video' : 'imagen', arch, txt(b.texto, 160), cta, txt(b.cta_ref, 60), txt(b.cta_txt, 24) || null, a.video ? seg : null]);
    return { ok: true, estado: estadoPublico(r) };
  });
}, { limite: Math.ceil(MAX_VIDEO * 1.4) + 8192 });
ruta('POST', '/api/negocio/:nid/estados/:id/borrar', async (ctx, b, p) => {
  await requiereNegocio(ctx, p.nid, ['dueno']);
  await q('update estados_negocio set activo=false where id=$1 and negocio_id=$2', [entero(p.id), p.nid]);
  return { ok: true };
});

/* ================= 6. billar: marcador público de cada mesa y "Mis partidas" ================= */
// El marcador se ve en la pantalla de la mesa (TV, tablet o celular). No lleva plata ni celulares.
ruta('GET', '/api/sv/:nid/marcador/:mesa', async (ctx, b, p) => {
  const e = await uno('select datos, version from sv_estado where negocio_id=$1', [p.nid]);
  const neg = await uno('select nombre from negocios where id=$1', [p.nid]);
  const m = e && ((e.datos.billar || {}).mesas || []).find(x => String(x.id) === String(p.mesa));
  if (!m) falla(404, 'mesa', 'Esa mesa no existe.');
  const pa = m.partida || null;
  const uids = pa ? pa.jugadores.map(j => j.uid).filter(Boolean) : [];
  const fotos = uids.length ? Object.fromEntries((await filas('select id, foto_id from usuarios where id = any($1)', [uids])).map(r => [String(r.id), urlMedia(r.foto_id)])) : {};
  return {
    negocio: neg ? neg.nombre : p.nid, mesa: { id: m.id, n: m.n, tipo: m.tipo, ini: m.ini || null, pausa: m.pausa || null, pausado: m.pausado || 0 }, version: e.version,
    partida: pa ? {
      juego: pa.juego, modo: pa.modo, numero: (pa.hist || []).length + 1, apuesta: pa.apuesta ? { n: pa.apuesta.n, q: pa.apuesta.q } : null,
      jugadores: pa.jugadores.map(j => ({ n: j.n, foto: j.uid ? fotos[String(j.uid)] || null : null, vinculado: !!j.uid, ganadas: j.ganadas || 0, perdidas: j.perdidas || 0, debe: j.debe || 0 })),
      hist: (pa.hist || []).slice(-6).map(h => ({ n: h.n, perdio: h.perdio, ts: h.ts }))
    } : null,
    codigo: pa ? pa.codigo : null // el QR de la pantalla: el jugador escoge su nombre y queda vinculado
  };
});
// El cliente escanea el QR de la mesa y dice cuál jugador es. Queda vinculado: su foto sale en la pantalla
// y las partidas le quedan en "Mis partidas".
ruta('POST', '/api/sv/:nid/billar/unirme', async (ctx, b, p) => {
  const u = requiereSesion(ctx);
  if (!auth.limitar('unir:' + u.id, 20, 3600e3)) falla(429, 'muchos_intentos', 'Muchos intentos. Espera un rato.');
  return tx(async c => {
    const r = await c.uno('select datos from sv_estado where negocio_id=$1 for update', [p.nid]);
    const m = r && ((r.datos.billar || {}).mesas || []).find(x => String(x.id) === String(b.mesa));
    if (!m || !m.partida) falla(404, 'mesa', 'Esa mesa no tiene una partida abierta.');
    if (!m.partida.codigo || String(b.codigo) !== String(m.partida.codigo)) falla(403, 'codigo', 'Ese código ya no sirve. Escanea el QR que te muestra la mesera ahora.');
    const j = m.partida.jugadores[entero(b.jugador)];
    if (!j) falla(400, 'jugador', 'Escoge cuál jugador eres.');
    if (j.uid && Number(j.uid) !== Number(u.id)) falla(409, 'ocupado', 'Ese jugador ya está vinculado a otra cuenta.');
    m.partida.jugadores.forEach(x => { if (Number(x.uid) === Number(u.id)) delete x.uid; });
    j.uid = Number(u.id); j.cuenta = u.nombre;
    await c.q('update sv_estado set datos=$2, version=version+1, actualizado=now() where negocio_id=$1', [p.nid, r.datos]);
    return { ok: true, jugador: j.n, mesa: m.n };
  });
});
ruta('GET', '/api/sv/mis-partidas', async ctx => {
  const u = requiereSesion(ctx);
  const ls = await filas(`select s.negocio_id, n.nombre, s.datos->'billar'->'log' log, s.datos->'billar'->'mesas' mesas from sv_estado s join negocios n on n.id=s.negocio_id where s.datos ? 'billar'`);
  const uid = Number(u.id), out = [], abiertas = [];
  for (const r of ls) {
    (r.log || []).forEach(x => {
      const yo = (x.jugadores || []).find(j => Number(j.uid) === uid);
      if (yo) out.push({ negocio: r.negocio_id, negocio_n: r.nombre, mesa: x.mesa, juego: x.juego, ts: x.ts, gane: x.perdio !== yo.n, perdio: x.perdio, rivales: x.jugadores.filter(j => j.n !== yo.n).map(j => j.n), apuesta: x.apuesta || null });
    });
    (r.mesas || []).forEach(m => { const pa = m.partida, yo = pa && pa.jugadores.find(j => Number(j.uid) === uid); if (yo) abiertas.push({ negocio: r.negocio_id, negocio_n: r.nombre, mesa: m.n, mesaId: m.id, juego: pa.juego, ganadas: yo.ganadas || 0, perdidas: yo.perdidas || 0, debe: yo.debe || 0, apuesta: pa.apuesta ? pa.apuesta.n : null }); });
  }
  out.sort((a, b) => b.ts - a.ts);
  return { partidas: out.slice(0, 300), abiertas, ganadas: out.filter(x => x.gane).length, perdidas: out.filter(x => !x.gane).length };
});

/* ================= 7. ticket de una mesa (lo abre el cliente con el QR del ticket) ================= */
ruta('GET', '/api/sv/:nid/ticket/:num', async (ctx, b, p, qs) => {
  const e = await uno('select datos from sv_estado where negocio_id=$1', [p.nid]);
  const tk = e && ((e.datos.resto || {}).tickets || []).find(x => String(x.num) === String(p.num));
  if (!tk || String(tk.codigo) !== String(qs.get('c') || '')) falla(404, 'ticket', 'No encontramos ese ticket.');
  const neg = await uno('select nombre, direccion, telefono from negocios where id=$1', [p.nid]);
  return { ticket: tk, negocio: neg };
});

/* ================= 8. superadministrador inicial (variables de entorno) ================= */
// En Render: SUPERADMIN_USUARIO, SUPERADMIN_CLAVE (mínimo 10 caracteres) y SUPERADMIN_TELEFONO.
// Se crea al arrancar si no existe; si existe, se le asegura el rol. La clave solo se pone al crearlo.
export async function asegurarSuperadmin() {
  const usuario = String(ENV.SUPERADMIN_USUARIO || '').trim().toLowerCase(), clave = String(ENV.SUPERADMIN_CLAVE || ''), tel = auth.soloDigitos(ENV.SUPERADMIN_TELEFONO);
  if (!usuario) return null;
  if (clave.length < 10) { console.warn('[superadmin] SUPERADMIN_CLAVE debe tener mínimo 10 caracteres. No se creó.'); return null; }
  if (!/^3\d{9}$/.test(tel)) { console.warn('[superadmin] SUPERADMIN_TELEFONO debe ser un celular de 10 números. No se creó.'); return null; }
  const ya = await uno('select id, roles from usuarios where usuario=$1 or telefono=$2', [usuario, tel]);
  if (ya) { if (!ya.roles.includes('admin')) await q("update usuarios set roles=array_append(roles,'admin') where id=$1", [ya.id]); return ya.id; }
  const r = await uno(`insert into usuarios(telefono, usuario, nombre, clave_hash, roles) values ($1,$2,'Superadministrador',$3,'{admin,cliente}') returning id`, [tel, usuario, auth.hashClave(clave)]);
  console.log('[superadmin] creado el usuario', usuario);
  return r.id;
}
