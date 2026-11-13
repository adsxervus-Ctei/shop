// Mi Tienda · Servus 0.1 · pruebas de la API nueva: recuperar la contraseña (correo con Brevo y WhatsApp),
// entrar con el correo, el rol "atención" con su cargo, la pantalla de atención compartida y lo que hace el cliente.
// Brevo y Meta se simulan (no se llama a internet).
// Uso:  TEST_DATABASE_URL=postgres://usuario:clave@localhost/mitienda_test npm run test:api-sv
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { iniciar, iniciarApi } from '../../servidor.mjs';
import { cerrar } from '../../api/db.mjs';
import { sembrar } from '../../api/semilla.mjs';
import { reiniciarLimites } from '../../api/auth.mjs';
import { cerrarTodo } from '../../api/tiempo-real.mjs';

const URL_DB = process.env.TEST_DATABASE_URL;
if (!URL_DB || !/test/.test(URL_DB)) { console.error('Define TEST_DATABASE_URL (debe contener "test").'); process.exit(1); }
const PUERTO = 8095, BASE = `http://localhost:${PUERTO}`;
const fetchReal = globalThis.fetch;
let srv;
async function api(token, metodo, ruta, cuerpo) {
  const r = await fetchReal(BASE + ruta, { method: metodo, headers: { 'Content-Type': 'application/json', 'X-Lainec': '1', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  return { status: r.status, body: await r.json() };
}
const entrar = async (u, clave = '1234') => (await api(null, 'POST', '/api/auth/entrar', { usuario: u, clave })).body.token;
const resp = (ok, datos) => ({ ok, status: ok ? 201 : 400, json: async () => datos, text: async () => JSON.stringify(datos) });

before(async () => {
  const c = new pg.Client({ connectionString: URL_DB }); await c.connect(); await c.query('drop schema public cascade; create schema public;'); await c.end();
  await iniciarApi({ url: URL_DB, vencimientoMs: 0 });
  await sembrar({ conOferta: false });
  srv = await iniciar(PUERTO);
});
after(async () => { globalThis.fetch = fetchReal; cerrarTodo(); srv.close(); await cerrar(); });

test('Se entra con el correo registrado', async () => {
  reiniciarLimites();
  const t = await entrar('maria@ejemplo.com');
  assert.ok(t, 'Debe abrir sesión con el correo');
  const yo = await api(t, 'GET', '/api/auth/yo');
  assert.equal(yo.body.usuario.usuario, 'maria');
});

test('Registro con correo: guarda el correo y no deja repetirlo', async () => {
  reiniciarLimites();
  const r = await api(null, 'POST', '/api/auth/registro', { nombre: 'Camila Pérez', telefono: '3016660011', clave: 'abcd', correo: 'Camila@Ejemplo.com', acepta_datos: true });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.ok(await entrar('camila@ejemplo.com', 'abcd'));
  const otra = await api(null, 'POST', '/api/auth/registro', { nombre: 'Otra', telefono: '3016660012', clave: 'abcd', correo: 'camila@ejemplo.com', acepta_datos: true });
  assert.equal(otra.status, 409);
});

test('Recuperar por correo (Brevo): manda el código, el código cambia la clave y cierra las otras sesiones', async () => {
  reiniciarLimites();
  Object.assign(process.env, { BREVO_API_KEY: 'xkeysib-prueba', CORREO_REMITENTE: 'no-responder@mitienda.co' });
  const viejo = await entrar('maria');
  let enviado = null;
  globalThis.fetch = async (url, op) => { if (String(url).startsWith('https://api.brevo.com/')) { enviado = { url, op }; return resp(true, { messageId: 'x' }); } return fetchReal(url, op); };
  const r = await api(null, 'POST', '/api/auth/recuperar/pedir', { dato: 'maria@ejemplo.com', canal: 'correo' });
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.codigo, undefined, 'El código no vuelve a la app');
  assert.equal(enviado.op.headers['api-key'], 'xkeysib-prueba');
  const cuerpo = JSON.parse(enviado.op.body);
  assert.equal(cuerpo.to[0].email, 'maria@ejemplo.com'); assert.equal(cuerpo.sender.email, 'no-responder@mitienda.co');
  const codigo = /(\d{6})/.exec(cuerpo.subject)[1];
  const malo = await api(null, 'POST', '/api/auth/recuperar/cambiar', { dato: 'maria@ejemplo.com', codigo: codigo === '000000' ? '111111' : '000000', clave: 'nueva1' });
  assert.equal(malo.status, 400);
  const ok = await api(null, 'POST', '/api/auth/recuperar/cambiar', { dato: 'maria@ejemplo.com', codigo, clave: 'nueva1' });
  assert.equal(ok.status, 200, JSON.stringify(ok.body)); assert.ok(ok.body.token);
  assert.equal((await api(viejo, 'GET', '/api/auth/yo')).body.usuario, null, 'La sesión vieja se cierra');
  assert.equal(await entrar('maria', '1234'), undefined, 'La clave vieja ya no sirve');
  assert.ok(await entrar('maria', 'nueva1'));
  const otraVez = await api(null, 'POST', '/api/auth/recuperar/cambiar', { dato: 'maria@ejemplo.com', codigo, clave: 'otra' });
  assert.equal(otraVez.status, 400, 'El código no se puede usar dos veces');
  globalThis.fetch = fetchReal; delete process.env.BREVO_API_KEY; delete process.env.CORREO_REMITENTE;
});

test('Recuperar por WhatsApp: usa la plantilla de autenticación con el celular registrado', async () => {
  reiniciarLimites();
  Object.assign(process.env, { WHATSAPP_TOKEN: 'tok', WHATSAPP_NUMERO_ID: '123', WHATSAPP_PLANTILLA_CODIGO: 'codigo_ingreso' });
  let enviado = null;
  globalThis.fetch = async (url, op) => { if (String(url).startsWith('https://graph.facebook.com/')) { enviado = { url, op }; return resp(true, { messages: [{ id: 'x' }] }); } return fetchReal(url, op); };
  const r = await api(null, 'POST', '/api/auth/recuperar/pedir', { dato: '3016660011', canal: 'whatsapp' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const c = JSON.parse(enviado.op.body); assert.equal(c.to, '573016660011');
  const codigo = c.template.components[0].parameters[0].text;
  const ok = await api(null, 'POST', '/api/auth/recuperar/cambiar', { dato: '3016660011', codigo, clave: 'wa99' });
  assert.equal(ok.status, 200);
  globalThis.fetch = fetchReal; for (const k of ['WHATSAPP_TOKEN', 'WHATSAPP_NUMERO_ID', 'WHATSAPP_PLANTILLA_CODIGO']) delete process.env[k];
});

test('En producción sin correo configurado: lo dice claro y no muestra códigos; no revela si la cuenta existe', async () => {
  reiniciarLimites(); process.env.NODE_ENV = 'production';
  const r = await api(null, 'POST', '/api/auth/recuperar/pedir', { dato: 'nadie@ejemplo.com', canal: 'correo' });
  assert.equal(r.status, 503);
  Object.assign(process.env, { BREVO_API_KEY: 'k', CORREO_REMITENTE: 'a@b.co' });
  globalThis.fetch = async (url, op) => String(url).startsWith('https://api.brevo.com/') ? resp(true, {}) : fetchReal(url, op);
  const n = await api(null, 'POST', '/api/auth/recuperar/pedir', { dato: 'nadie@ejemplo.com', canal: 'correo' });
  assert.equal(n.status, 200); assert.deepEqual(n.body, { ok: true });
  globalThis.fetch = fetchReal; delete process.env.NODE_ENV; delete process.env.BREVO_API_KEY; delete process.env.CORREO_REMITENTE;
});

test('Rol "atención" con cargo: entra a su negocio y el perfil trae el cargo', async () => {
  reiniciarLimites();
  const t = await entrar('barberia-atencion');
  const yo = await api(t, 'GET', '/api/auth/yo');
  const n = yo.body.usuario.negocios.find(x => x.id === 'barberia');
  assert.equal(n.rol, 'atencion'); assert.equal(n.cargo, 'Barbero');
  const d = await entrar('barberia');
  const inv = await api(d, 'POST', '/api/negocio/barberia/equipo', { nombre: 'Yair', telefono: '3016660099', rol: 'atencion', cargo: 'Barbero de fin de semana' });
  assert.equal(inv.status, 200, JSON.stringify(inv.body)); assert.equal(inv.body.cargo, 'Barbero de fin de semana');
});

test('Pantalla de atención compartida: el equipo guarda y lee; si dos guardan a la vez, el segundo recibe 409', async () => {
  reiniciarLimites();
  const mesera = await entrar('billar-mesera'), dueno = await entrar('billar'), cliente = await entrar('danto');
  const datos = { billar: { tarifas: { Pool: 6000, Carambola: 7000 }, mesas: [{ id: 1, n: 'Mesa 1', tipo: 'Pool', ini: null, cons: [] }, { id: 2, n: 'Mesa 2', tipo: 'Pool', ini: Date.now(), cons: [{ n: 'Cerveza', q: 2, p: 4000 }] }] }, vitrina: { frase: 'Hola' }, cupones: [{ id: 'c1', code: 'POOL', activo: true }, { id: 'c2', code: 'OFF', activo: false }] };
  const p1 = await api(mesera, 'PUT', '/api/negocio/billar/sv', { datos, version: 0 });
  assert.equal(p1.status, 200, JSON.stringify(p1.body)); assert.equal(p1.body.version, 1);
  const g = await api(dueno, 'GET', '/api/negocio/billar/sv');
  assert.equal(g.body.version, 1); assert.equal(g.body.datos.billar.mesas.length, 2);
  const tarde = await api(dueno, 'PUT', '/api/negocio/billar/sv', { datos, version: 0 });
  assert.equal(tarde.status, 409); assert.equal(tarde.body.actual.version, 1);
  assert.equal((await api(cliente, 'GET', '/api/negocio/billar/sv')).status, 403, 'Un cliente no lee el estado interno');
  // lo público no lleva consumos ni dinero
  const pub = await api(null, 'GET', '/api/sv/billar/publico');
  assert.deepEqual(pub.body.mesas.map(m => m.estado), ['libre', 'ocupada']);
  assert.equal(JSON.stringify(pub.body).includes('Cerveza'), false);
  assert.deepEqual(pub.body.cupones.map(c => c.code), ['POOL']);
});

test('El cliente aparta una mesa libre (no una ocupada) y pide turno en la barbería', async () => {
  reiniciarLimites();
  const cli = await entrar('danto');
  const no = await api(cli, 'POST', '/api/sv/billar/cliente', { accion: 'apartar-mesa', mesa: 2 });
  assert.equal(no.status, 409);
  const si = await api(cli, 'POST', '/api/sv/billar/cliente', { accion: 'apartar-mesa', mesa: 1 });
  assert.equal(si.status, 200, JSON.stringify(si.body));
  assert.equal((await api(null, 'GET', '/api/sv/billar/publico')).body.mesas[0].estado, 'apartada');
  const otro = await api(cli, 'POST', '/api/sv/billar/cliente', { accion: 'apartar-mesa', mesa: 1 });
  assert.equal(otro.status, 409, 'No se aparta dos veces');
  // barbería
  const kevin = await entrar('barberia-atencion');
  await api(kevin, 'PUT', '/api/negocio/barberia/sv', { datos: { barberia: { servicios: [{ id: 'corte', n: 'Corte', min: 30, p: 12000 }], barberos: [{ id: 'jhon', n: 'Jhon', agenda: [] }, { id: 'kevin', n: 'Kevin', agenda: [] }], fila: [] } } });
  const t1 = await api(cli, 'POST', '/api/sv/barberia/cliente', { accion: 'turno', servicio: 'corte', barbero: 'jhon', hora: '16:00' });
  assert.equal(t1.status, 200, JSON.stringify(t1.body)); assert.equal(t1.body.barbero, 'Jhon');
  const t2 = await api(cli, 'POST', '/api/sv/barberia/cliente', { accion: 'turno', servicio: 'corte', barbero: 'jhon', hora: '16:00' });
  assert.equal(t2.status, 409, 'La misma hora con el mismo barbero ya está tomada');
  const t3 = await api(cli, 'POST', '/api/sv/barberia/cliente', { accion: 'turno', servicio: 'corte', barbero: '', hora: '16:00' });
  assert.equal(t3.body.barbero, 'Kevin', '"El que esté libre" toma al otro barbero');
  assert.equal((await api(null, 'POST', '/api/sv/barberia/cliente', { accion: 'turno', servicio: 'corte', hora: '17:00' })).status, 401, 'Sin sesión no se pide turno');
});

test('Taller: solo el dueño de la moto (por su celular) ve y aprueba la cotización', async () => {
  reiniciarLimites();
  const ramiro = await entrar('taller'), danto = await entrar('danto'), maria = await entrar('maria', 'nueva1');
  await api(ramiro, 'PUT', '/api/negocio/taller/sv', { datos: { taller: { ordenes: [{ id: 'OT-218', placa: 'ABC 12D', moto: 'Boxer', cli: 'Danto', tel: '3001112233', estado: 'aprobacion', items: [{ k: 'kit', n: 'Kit', v: 85000 }, { k: 'mo', n: 'Mano de obra', v: 30000, mo: true }] }] } } });
  assert.equal((await api(maria, 'GET', '/api/sv/taller/moto/OT-218')).status, 404);
  const ver = await api(danto, 'GET', '/api/sv/taller/moto/OT-218');
  assert.equal(ver.status, 200, JSON.stringify(ver.body)); assert.equal(ver.body.orden.placa, 'ABC 12D');
  assert.equal((await api(maria, 'POST', '/api/sv/taller/cliente', { accion: 'aprobar-ot', ot: 'OT-218' })).status, 403);
  const ok = await api(danto, 'POST', '/api/sv/taller/cliente', { accion: 'aprobar-ot', ot: 'OT-218' });
  assert.equal(ok.status, 200, JSON.stringify(ok.body)); assert.equal(ok.body.estado, 'reparacion');
  const g = await api(ramiro, 'GET', '/api/negocio/taller/sv');
  assert.equal(g.body.datos.taller.ordenes[0].estado, 'reparacion');
});
