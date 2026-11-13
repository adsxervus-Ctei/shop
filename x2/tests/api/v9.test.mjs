// Mi Tienda v9 · pruebas de la API nueva: WhatsApp, Google, Facebook, equipo por roles, asistencia y PQR.
// Google, Facebook y Meta se simulan (no se llama a internet): se prueba que el servidor
// compruebe bien lo que ellos responden y que arme bien el mensaje de WhatsApp.
// Uso:  TEST_DATABASE_URL=postgres://usuario:clave@localhost/mitienda_test npm run test:api9
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { iniciar, iniciarApi } from '../../servidor.mjs';
import { cerrar } from '../../api/db.mjs';
import { sembrar } from '../../api/semilla.mjs';
import { usarConsultor } from '../../api/v9.mjs';
import { reiniciarLimites } from '../../api/auth.mjs';
import { cerrarTodo } from '../../api/tiempo-real.mjs';

const URL_DB = process.env.TEST_DATABASE_URL;
if (!URL_DB || !/test/.test(URL_DB)) { console.error('Define TEST_DATABASE_URL (debe contener "test").'); process.exit(1); }
const PUERTO = 8094, BASE = `http://localhost:${PUERTO}`;
const fetchReal = globalThis.fetch;
let srv;
async function api(token, metodo, ruta, cuerpo) {
  const r = await fetchReal(BASE + ruta, { method: metodo, headers: { 'Content-Type': 'application/json', 'X-Lainec': '1', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  return { status: r.status, body: await r.json() };
}
const entrar = async u => (await api(null, 'POST', '/api/auth/entrar', { usuario: u, clave: '1234' })).body.token;
const resp = (ok, datos) => ({ ok, status: ok ? 200 : 400, json: async () => datos, text: async () => JSON.stringify(datos) });

before(async () => {
  const c = new pg.Client({ connectionString: URL_DB }); await c.connect(); await c.query('drop schema public cascade; create schema public;'); await c.end();
  await iniciarApi({ url: URL_DB, vencimientoMs: 0 });
  await sembrar({ conOferta: false });
  srv = await iniciar(PUERTO);
});
after(async () => { globalThis.fetch = fetchReal; cerrarTodo(); srv.close(); await cerrar(); });

test('WhatsApp en producción sin configurar: no deja pedir código (no muestra códigos en pantalla)', async () => {
  reiniciarLimites(); process.env.NODE_ENV = 'production';
  const r = await api(null, 'POST', '/api/auth/whatsapp/codigo', { telefono: '3011112222' });
  assert.equal(r.status, 503);
  const p = await api(null, 'GET', '/api/auth/proveedores');
  assert.equal(p.body.whatsapp, false);
  delete process.env.NODE_ENV;
});

test('WhatsApp configurado: manda la plantilla de autenticación a Meta con el código, y el código abre sesión', async () => {
  reiniciarLimites();
  Object.assign(process.env, { WHATSAPP_TOKEN: 'tok', WHATSAPP_NUMERO_ID: '123', WHATSAPP_PLANTILLA_CODIGO: 'codigo_ingreso' });
  let enviado = null;
  globalThis.fetch = async (url, op) => { if (String(url).startsWith('https://graph.facebook.com/')) { enviado = { url, op }; return resp(true, { messages: [{ id: 'x' }] }); } return fetchReal(url, op); };
  const r = await api(null, 'POST', '/api/auth/whatsapp/codigo', { telefono: '300 777 1234' });
  assert.equal(r.status, 200); assert.equal(r.body.enviado, true); assert.equal(r.body.codigo, undefined, 'El código no debe volver a la app');
  assert.match(enviado.url, /\/123\/messages$/);
  const cuerpo = JSON.parse(enviado.op.body);
  assert.equal(cuerpo.to, '573007771234'); assert.equal(cuerpo.template.name, 'codigo_ingreso');
  const codigo = cuerpo.template.components[0].parameters[0].text;
  assert.match(codigo, /^\d{6}$/);
  assert.equal(enviado.op.headers.Authorization, 'Bearer tok');
  const malo = await api(null, 'POST', '/api/auth/whatsapp/verificar', { telefono: '3007771234', codigo: codigo === '111111' ? '222222' : '111111' });
  assert.equal(malo.status, 400);
  const nuevo = await api(null, 'POST', '/api/auth/whatsapp/verificar', { telefono: '3007771234', codigo });
  assert.equal(nuevo.body.nuevo, true);
  const sinHabeas = await api(null, 'POST', '/api/auth/whatsapp/verificar', { telefono: '3007771234', codigo, nombre: 'Sofía Pérez' });
  assert.equal(sinHabeas.status, 400);
  const ok = await api(null, 'POST', '/api/auth/whatsapp/verificar', { telefono: '3007771234', codigo, nombre: 'Sofía Pérez', acepta_datos: true });
  assert.equal(ok.status, 200); assert.equal(ok.body.usuario.nombre, 'Sofía Pérez');
  const otraVez = await api(null, 'POST', '/api/auth/whatsapp/verificar', { telefono: '3007771234', codigo });
  assert.equal(otraVez.status, 400, 'Un código ya usado no sirve otra vez');
  for (const k of ['WHATSAPP_TOKEN', 'WHATSAPP_NUMERO_ID', 'WHATSAPP_PLANTILLA_CODIGO']) delete process.env[k];
  globalThis.fetch = fetchReal;
});

test('Google: acepta solo tokens de esta app con correo verificado; la segunda vez entra a la misma cuenta', async () => {
  reiniciarLimites(); process.env.GOOGLE_CLIENT_ID = 'mi-app.apps.googleusercontent.com';
  usarConsultor(async url => {
    const t = new URL(url).searchParams.get('id_token');
    if (t === 'bueno') return resp(true, { aud: 'mi-app.apps.googleusercontent.com', iss: 'https://accounts.google.com', email_verified: 'true', sub: 'g-1', email: 'yesica@gmail.com', name: 'Yesica Cantillo' });
    if (t === 'otra-app') return resp(true, { aud: 'otra.apps.googleusercontent.com', iss: 'https://accounts.google.com', email_verified: 'true', sub: 'g-2', email: 'x@gmail.com' });
    return resp(false, { error: 'invalid_token' });
  });
  assert.equal((await api(null, 'POST', '/api/auth/google', { credential: 'malo' })).status, 401);
  assert.equal((await api(null, 'POST', '/api/auth/google', { credential: 'otra-app' })).status, 401);
  const a = await api(null, 'POST', '/api/auth/google', { credential: 'bueno' });
  const b = await api(null, 'POST', '/api/auth/google', { credential: 'bueno' });
  assert.equal(a.status, 200); assert.equal(a.body.usuario.id, b.body.usuario.id);
  assert.equal(a.body.usuario.telefono, null);
  const d = await api(a.body.token, 'POST', '/api/auth/datos', { telefono: '3015550000' });
  assert.equal(d.body.usuario.telefono, '3015550000');
  delete process.env.GOOGLE_CLIENT_ID;
});

test('Facebook: comprueba el token con Meta (app correcta y mismo usuario)', async () => {
  reiniciarLimites(); Object.assign(process.env, { FACEBOOK_APP_ID: '999', FACEBOOK_APP_SECRET: 's' });
  usarConsultor(async url => {
    const u = new URL(url);
    if (u.pathname === '/debug_token') { const t = u.searchParams.get('input_token'); return resp(true, { data: { is_valid: t !== 'vencido', app_id: t === 'otra' ? '111' : '999', user_id: '55' } }); }
    if (u.pathname === '/me') return resp(true, { id: '55', name: 'Luis Pacheco', email: 'luis@example.com' });
    return resp(false, {});
  });
  assert.equal((await api(null, 'POST', '/api/auth/facebook', { accessToken: 'vencido' })).status, 401);
  assert.equal((await api(null, 'POST', '/api/auth/facebook', { accessToken: 'otra' })).status, 401);
  const ok = await api(null, 'POST', '/api/auth/facebook', { accessToken: 'bueno' });
  assert.equal(ok.status, 200); assert.equal(ok.body.usuario.nombre, 'Luis Pacheco');
  delete process.env.FACEBOOK_APP_ID; delete process.env.FACEBOOK_APP_SECRET;
});

test('Equipo: solo el dueño invita; cada rol ve solo lo suyo; al quitarlo se le cierra la sesión', async () => {
  reiniciarLimites();
  const dueno = await entrar('rancho'), cajero = await entrar('rancho-cajero');
  assert.equal((await api(cajero, 'POST', '/api/negocio/rancho/equipo', { nombre: 'X Y Z', telefono: '3009990000', rol: 'mesero' })).status, 403);
  const r = await api(dueno, 'POST', '/api/negocio/rancho/equipo', { nombre: 'Rubén Díaz', telefono: '3009990000', rol: 'cocina' });
  assert.equal(r.status, 200); assert.match(r.body.clave_temporal, /^\d{6}$/);
  const cocina = (await api(null, 'POST', '/api/auth/entrar', { usuario: '3009990000', clave: r.body.clave_temporal })).body.token;
  assert.equal((await api(cocina, 'GET', '/api/negocio/rancho/pedidos')).status, 200);
  assert.equal((await api(cocina, 'GET', '/api/negocio/rancho/caja')).status, 403);
  assert.equal((await api(cocina, 'GET', '/api/negocio/rancho/pagos')).status, 403);
  assert.equal((await api(cocina, 'POST', '/api/negocio/rancho/productos', { nombre: 'x' })).status, 403);
  assert.equal((await api(cajero, 'GET', '/api/negocio/rancho/caja')).status, 200, 'El cajero sí ve la caja');
  const marca = await api(cocina, 'POST', '/api/negocio/rancho/asistencia', {});
  assert.equal(marca.body.registro.tipo, 'entrada');
  assert.equal((await api(cocina, 'POST', '/api/negocio/rancho/asistencia', {})).body.registro.tipo, 'salida');
  assert.equal((await api(dueno, 'GET', '/api/negocio/rancho/asistencia')).body.registros.length, 2);
  assert.equal((await api(dueno, 'POST', `/api/negocio/rancho/equipo/${r.body.usuario_id}/quitar`)).status, 200);
  assert.equal((await api(cocina, 'GET', '/api/negocio/rancho/pedidos')).status, 401, 'Al quitarlo debe quedar sin sesión');
});

test('PQR: el cliente la radica, solo el dueño la ve y la responde', async () => {
  reiniciarLimites();
  const maria = await entrar('maria'), dueno = await entrar('rancho'), cajero = await entrar('rancho-cajero');
  assert.equal((await api(maria, 'POST', '/api/negocio/rancho/pqr', { tipo: 'reclamo', texto: 'corto' })).status, 400);
  const r = await api(maria, 'POST', '/api/negocio/rancho/pqr', { tipo: 'reclamo', texto: 'El pedido llegó frío y sin la gaseosa.' });
  assert.match(r.body.radicado, /^PQR-\d{5}$/);
  assert.equal((await api(cajero, 'GET', '/api/negocio/rancho/pqr')).status, 403);
  const ls = await api(dueno, 'GET', '/api/negocio/rancho/pqr');
  assert.equal(ls.body.pqr[0].tipo, 'reclamo');
  assert.equal((await api(dueno, 'POST', `/api/negocio/rancho/pqr/${r.body.id}/responder`, { respuesta: 'Te reponemos el pedido.' })).status, 200);
  assert.equal((await api(maria, 'GET', '/api/pqr/mias')).body.pqr[0].estado, 'respondida');
});

test('Pagos nuevos: un pedido por Daviplata o Bre-B queda pendiente de confirmar por el negocio', async () => {
  reiniciarLimites();
  const maria = await entrar('maria'), dueno = await entrar('rancho');
  for (const pago of ['daviplata', 'breb']) {
    const p = await api(maria, 'POST', '/api/pedidos', { negocio_id: 'rancho', modo: 'recoger', zona_id: 'hatillo', pago, items: [{ id: 'asado', n: 'Asado', q: 1, p: 30000 }] });
    assert.equal(p.status, 200, JSON.stringify(p.body)); assert.equal(p.body.pedido.pago, pago);
  }
  const pend = await api(dueno, 'GET', '/api/negocio/rancho/pagos');
  assert.deepEqual(pend.body.pagos.map(x => x.metodo).sort(), ['breb', 'daviplata']);
});
