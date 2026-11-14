// Mi Tienda · Servus 0.2 · pruebas de la API nueva: superadministrador, solicitudes de negocios, pautas (máximo 5),
// estados con video de máximo 15 s, foto de perfil, marcador del billar, "Mis partidas" y ticket de mesa.
// Uso:  TEST_DATABASE_URL=postgres://usuario:clave@localhost/mitienda_test npm run test:api-sv2
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { iniciar, iniciarApi } from '../../servidor.mjs';
import { cerrar, uno } from '../../api/db.mjs';
import { sembrar } from '../../api/semilla.mjs';
import { reiniciarLimites } from '../../api/auth.mjs';
import { cerrarTodo } from '../../api/tiempo-real.mjs';
import { asegurarSuperadmin } from '../../api/sv02.mjs';

const URL_DB = process.env.TEST_DATABASE_URL;
if (!URL_DB || !/test/.test(URL_DB)) { console.error('Define TEST_DATABASE_URL (debe contener "test").'); process.exit(1); }
const PUERTO = 8094, BASE = `http://localhost:${PUERTO}`;
let srv;
async function api(token, metodo, ruta, cuerpo, extra = {}) {
  const r = await fetch(BASE + ruta, { method: metodo, headers: { 'Content-Type': 'application/json', 'X-Lainec': '1', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...extra }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const t = r.headers.get('content-type') || '';
  return { status: r.status, body: /json/.test(t) ? await r.json() : Buffer.from(await r.arrayBuffer()), h: r.headers };
}
const entrar = async (u, clave = '1234') => (await api(null, 'POST', '/api/auth/entrar', { usuario: u, clave })).body.token;
const dia = n => new Date(Date.now() - 5 * 3600e3 + n * 864e5).toISOString().slice(0, 10);
// JPG de 1×1 y un "video" MP4 pequeño (solo se revisa el tipo, el tamaño y los segundos que dice la app)
const JPG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const MP4 = 'data:video/mp4;base64,' + Buffer.alloc(4000, 7).toString('base64');

before(async () => {
  const c = new pg.Client({ connectionString: URL_DB }); await c.connect(); await c.query('drop schema public cascade; create schema public;'); await c.end();
  await iniciarApi({ url: URL_DB, vencimientoMs: 0 });
  await sembrar({ conOferta: false });
  srv = await iniciar(PUERTO);
});
after(async () => { cerrarTodo(); srv.close(); await cerrar(); });

test('Solo el superadministrador entra al resumen', async () => {
  reiniciarLimites();
  assert.equal((await api(await entrar('maria'), 'GET', '/api/super/resumen')).status, 403);
  const r = await api(await entrar('superadmin'), 'GET', '/api/super/resumen');
  assert.equal(r.status, 200);
  assert.ok(r.body.negocios.total >= 15 && r.body.solicitudes === 2 && r.body.pautas.n === 3, JSON.stringify(r.body).slice(0, 200));
});

test('Un negocio pide entrar, el superadministrador lo aprueba y el dueño entra con la clave temporal', async () => {
  reiniciarLimites();
  const s = await api(null, 'POST', '/api/sv/solicitud-negocio', { nombre: 'Frutería La Mata', categoria: 'campo', municipio: 'Hatillo de Loba', dueno: 'Olga Ruiz', telefono: '311 222 3344', acepta: true });
  assert.equal(s.status, 200);
  assert.equal((await api(null, 'POST', '/api/sv/solicitud-negocio', { nombre: 'X', dueno: 'Olga', telefono: '3112223344', acepta: true })).status, 400, 'Nombre muy corto');
  assert.equal((await api(null, 'POST', '/api/sv/solicitud-negocio', { nombre: 'Otra', dueno: 'Olga Ruiz', telefono: '3112223399' })).status, 400, 'Sin aceptar privacidad');
  const sa = await entrar('superadmin');
  const ls = (await api(sa, 'GET', '/api/super/solicitudes')).body.solicitudes;
  const mia = ls.find(x => x.nombre === 'Frutería La Mata'); assert.ok(mia);
  const ap = await api(sa, 'POST', '/api/super/solicitudes/' + mia.id + '/aprobar', {});
  assert.equal(ap.status, 200); assert.equal(ap.body.negocio, 'fruteria-la-mata'); assert.match(ap.body.clave_temporal, /^\d{6}$/);
  assert.equal((await api(sa, 'POST', '/api/super/solicitudes/' + mia.id + '/aprobar', {})).status, 409, 'No se aprueba dos veces');
  const t = await entrar(ap.body.usuario, ap.body.clave_temporal); assert.ok(t, 'El dueño entra');
  const yo = await api(t, 'GET', '/api/auth/yo');
  assert.ok(yo.body.usuario.negocios.some(n => n.id === 'fruteria-la-mata' && n.rol === 'dueno'));
  const otra = ls.find(x => x.nombre === 'Taller Moto Rápido');
  assert.equal((await api(sa, 'POST', '/api/super/solicitudes/' + otra.id + '/rechazar', { motivo: 'no' })).status, 400, 'El motivo es obligatorio');
  assert.equal((await api(sa, 'POST', '/api/super/solicitudes/' + otra.id + '/rechazar', { motivo: 'Falta el RUT del negocio' })).status, 200);
  const sus = await api(sa, 'POST', '/api/super/negocios/fruteria-la-mata/estado', { estado: 'suspendido' });
  assert.equal(sus.body.estado, 'suspendido');
});

test('Pautas: máximo 5 al mismo tiempo; las públicas solo muestran las vigentes y activas', async () => {
  reiniciarLimites();
  const sa = await entrar('superadmin');
  const base = { negocio: 'rancho', titulo: 'Pauta de prueba', inicio: dia(0), fin: dia(3), valor: 50000 };
  assert.equal((await api(sa, 'POST', '/api/super/pautas', base)).status, 200, '4.ª pauta');
  assert.equal((await api(sa, 'POST', '/api/super/pautas', Object.assign({}, base, { imagen: JPG }))).status, 200, '5.ª pauta con foto');
  const sexta = await api(sa, 'POST', '/api/super/pautas', base);
  assert.equal(sexta.status, 409, 'La 6.ª pauta debe rechazarse'); assert.equal(sexta.body.codigo, 'lleno');
  assert.equal((await api(sa, 'POST', '/api/super/pautas', Object.assign({}, base, { inicio: dia(40), fin: dia(45) }))).status, 200, 'En otras fechas sí cabe');
  assert.equal((await api(sa, 'POST', '/api/super/pautas', Object.assign({}, base, { estado: 'pausada' }))).status, 200, 'Pausada no ocupa cupo');
  assert.equal((await api(sa, 'POST', '/api/super/pautas', Object.assign({}, base, { fin: dia(-2) }))).status, 400, 'Fin antes del inicio');
  const pub = await api(null, 'GET', '/api/sv/pautas');
  assert.equal(pub.body.pautas.length, 5); assert.equal(pub.body.maximo, 5);
  const conFoto = pub.body.pautas.find(p => /^\/api\/sv\/media\/\d+$/.test(p.imagen || ''));
  assert.ok(conFoto, 'La foto subida sale como /api/sv/media/…');
  assert.equal((await api(null, 'GET', conFoto.imagen)).status, 200);
  assert.equal((await api(await entrar('rancho'), 'POST', '/api/super/pautas', base)).status, 403, 'Un dueño no crea pautas');
});

test('Estados: imagen o video de máximo 15 s; el público los ve agrupados por negocio; el video se puede adelantar', async () => {
  reiniciarLimites();
  const t = await entrar('rancho');
  assert.equal((await api(t, 'POST', '/api/negocio/rancho/estados', { archivo: JPG, texto: 'Hoy hay sancocho', cta_tipo: 'producto', cta_ref: 'sancocho' })).status, 200);
  assert.equal((await api(t, 'POST', '/api/negocio/rancho/estados', { archivo: MP4, segundos: 22 })).status, 400, 'Video de 22 s');
  const v = await api(t, 'POST', '/api/negocio/rancho/estados', { archivo: MP4, segundos: 12.4, texto: 'Así asamos' });
  assert.equal(v.status, 200); assert.equal(v.body.estado.tipo, 'video');
  assert.equal((await api(await entrar('drogueria'), 'POST', '/api/negocio/rancho/estados', { archivo: JPG })).status, 403, 'Otro negocio no sube estados aquí');
  const pub = await api(null, 'GET', '/api/sv/estados');
  assert.equal(pub.body.estados.rancho.length, 2);
  const r = await api(null, 'GET', v.body.estado.src, null, { Range: 'bytes=0-99' });
  assert.equal(r.status, 206); assert.equal(r.body.length, 100); assert.match(r.h.get('content-range'), /^bytes 0-99\/4000$/);
  const id = pub.body.estados.rancho[1].id;
  await api(t, 'POST', '/api/negocio/rancho/estados/' + id + '/borrar');
  assert.equal((await api(null, 'GET', '/api/sv/estados')).body.estados.rancho.length, 1);
});

test('Billar: marcador público sin plata, el jugador se vincula con el código y ve "Mis partidas"; foto de perfil', async () => {
  reiniciarLimites();
  const m = await entrar('maria');
  const f = await api(m, 'POST', '/api/yo/foto', { foto: JPG }); assert.equal(f.status, 200);
  const t = await entrar('billar');
  const datos = { billar: { tarifas: { Pool: 6000 }, frac: 15, mesas: [{ id: 3, n: 'Mesa 3', tipo: 'Pool', ini: Date.now() - 600000, cons: [], partida: { juego: 'Bola 8', modo: '1v1', codigo: '482913', apuesta: { tipo: 'cerveza', n: 'Águila', p: 4000, q: 1 }, jugadores: [{ n: 'El Mono', ganadas: 1, perdidas: 0, debe: 0 }, { n: 'Pedro', ganadas: 0, perdidas: 1, debe: 1 }], hist: [{ n: 1, perdio: 'Pedro', quien: ['Pedro'], ts: Date.now() }] } }],
    log: [{ ts: Date.now(), mesa: 'Mesa 3', juego: 'Bola 8', jugadores: [{ n: 'El Mono', uid: null }, { n: 'Pedro', uid: null }], perdio: 'Pedro', quien: ['Pedro'] }] } };
  assert.equal((await api(t, 'PUT', '/api/negocio/billar/sv', { datos, version: 0 })).status, 200);
  const mc = await api(null, 'GET', '/api/sv/billar/marcador/3');
  assert.equal(mc.status, 200); assert.equal(mc.body.partida.jugadores[1].debe, 1);
  assert.ok(!JSON.stringify(mc.body).includes('4000'), 'El marcador no lleva valores en plata');
  assert.equal((await api(m, 'POST', '/api/sv/billar/billar/unirme', { mesa: 3, codigo: '000000', jugador: 0 })).status, 403, 'Código viejo');
  const u = await api(m, 'POST', '/api/sv/billar/billar/unirme', { mesa: 3, codigo: '482913', jugador: 0 });
  assert.equal(u.status, 200); assert.equal(u.body.jugador, 'El Mono');
  assert.equal((await api(await entrar('juan'), 'POST', '/api/sv/billar/billar/unirme', { mesa: 3, codigo: '482913', jugador: 0 })).status, 409, 'Otro no toma el mismo jugador');
  const mc2 = await api(null, 'GET', '/api/sv/billar/marcador/3');
  assert.equal(mc2.body.partida.jugadores[0].foto, f.body.foto, 'Sale la foto de perfil en la pantalla');
  // la mesera anota otra partida con el jugador ya vinculado
  const e = await api(t, 'GET', '/api/negocio/billar/sv');
  const d = e.body.datos, uid = d.billar.mesas[0].partida.jugadores[0].uid;
  d.billar.log.push({ ts: Date.now(), mesa: 'Mesa 3', juego: 'Bola 8', jugadores: [{ n: 'El Mono', uid }, { n: 'Pedro', uid: null }], perdio: 'El Mono', quien: ['El Mono'] });
  assert.equal((await api(t, 'PUT', '/api/negocio/billar/sv', { datos: d, version: e.body.version })).status, 200);
  const mp = await api(m, 'GET', '/api/sv/mis-partidas');
  assert.equal(mp.body.perdidas, 1); assert.equal(mp.body.abiertas.length, 1); assert.equal(mp.body.abiertas[0].mesa, 'Mesa 3');
});

test('Ticket de una mesa: el cliente lo abre solo con el código del QR', async () => {
  reiniciarLimites();
  const t = await entrar('rancho');
  const e = await api(t, 'GET', '/api/negocio/rancho/sv');
  const d = e.body.datos || {}; d.resto = d.resto || { mesas: [] };
  d.resto.tickets = [{ num: 1001, codigo: '123456', mesa: 3, por: 'Sofía', ts: Date.now(), lineas: [{ n: 'Asado Especial', q: 2, p: 25000 }], total: 50000, pago: 'efectivo', recibe: 60000, estado: 'por aprobar' }];
  assert.equal((await api(t, 'PUT', '/api/negocio/rancho/sv', { datos: d, version: e.body.version })).status, 200);
  assert.equal((await api(null, 'GET', '/api/sv/rancho/ticket/1001?c=999999')).status, 404);
  const ok = await api(null, 'GET', '/api/sv/rancho/ticket/1001?c=123456');
  assert.equal(ok.status, 200); assert.equal(ok.body.ticket.total, 50000);
});

test('El superadministrador inicial se crea con las variables de entorno (clave larga)', async () => {
  process.env.SUPERADMIN_USUARIO = 'jefa'; process.env.SUPERADMIN_CLAVE = 'corta'; process.env.SUPERADMIN_TELEFONO = '3209998877';
  assert.equal(await asegurarSuperadmin(), null, 'Con clave corta no se crea');
  process.env.SUPERADMIN_CLAVE = 'una-clave-larga-2026';
  const id = await asegurarSuperadmin(); assert.ok(id);
  const u = await uno('select roles from usuarios where id=$1', [id]); assert.ok(u.roles.includes('admin'));
  reiniciarLimites();
  assert.ok(await entrar('jefa', 'una-clave-larga-2026'));
  delete process.env.SUPERADMIN_USUARIO; delete process.env.SUPERADMIN_CLAVE; delete process.env.SUPERADMIN_TELEFONO;
});
