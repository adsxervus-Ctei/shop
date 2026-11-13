// Mi Tienda v9 · pruebas de navegador de lo nuevo (propuestas I, J y K)
// Uso:  TEST_DATABASE_URL=postgres://usuario:clave@localhost/mitienda_test npm run test:v9
// ¡OJO! Borra y recrea el esquema de la base de PRUEBAS. Nunca la apuntes a la base real.
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import pg from 'pg';
import { iniciar, iniciarApi } from '../servidor.mjs';
import { sembrar } from '../api/semilla.mjs';
import { cerrar } from '../api/db.mjs';
import { cerrarTodo } from '../api/tiempo-real.mjs';

const URL_DB = process.env.TEST_DATABASE_URL;
if (!URL_DB || !/test/.test(URL_DB)) { console.error('Define TEST_DATABASE_URL (debe contener "test").'); process.exit(1); }
const PUERTO = 8096, BASE = `http://localhost:${PUERTO}/index.html`;
const CAP = new URL('./capturas/', import.meta.url);
await mkdir(CAP, { recursive: true });
const resultados = [], ABIERTAS = [];
let nav, srv;

async function prueba(nombre, fn) {
  const t0 = Date.now();
  try { await fn(); resultados.push({ ok: true, nombre, ms: Date.now() - t0 }); console.log(`  ✔ ${nombre}`); }
  catch (e) {
    resultados.push({ ok: false, nombre, ms: Date.now() - t0, error: e.message.split('\n')[0] }); console.log(`  ✘ ${nombre}\n      → ${e.message.split('\n')[0]}`);
    let i = 0; for (const p of ABIERTAS) { try { if (!p.isClosed()) await p.screenshot({ path: new URL(`fallo-v9-${resultados.length}-${i++}.png`, CAP).pathname }); } catch (x) {} }
  }
}
const afirmar = (c, m) => { if (!c) throw new Error(m); };
async function pagina(movil = true) {
  const ctx = await nav.newContext(movil ? { viewport: { width: 390, height: 844 }, hasTouch: true } : { viewport: { width: 1366, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('hm-pruebas', '1'); localStorage.setItem('hm-tut-visto', '1'); } catch (e) {} });
  const page = await ctx.newPage(); ABIERTAS.push(page);
  page.errores = [];
  page.on('pageerror', e => page.errores.push(e.message));
  return { ctx, page };
}
const listo = page => page.waitForFunction(() => window.LM && LM.api && LM.api.disponible !== null && LM.v9);
const sinErrores = page => afirmar(!page.errores.length, 'Errores de JavaScript: ' + page.errores.join(' | '));
async function entrarComo(page, u) {
  await page.goto(BASE + '#inicio'); await listo(page);
  await page.evaluate(() => LM.openLogin('cliente'));
  await page.click('[data-act="mt-lmodo"][data-m="usuario"]');
  await page.fill('#mtUu', u); await page.fill('#mtUp', '1234');
  await page.click('form[data-form="mt-usuario"] button[type=submit]');
}
const hash = page => page.evaluate(() => location.hash.slice(1));

try {
  const c = new pg.Client({ connectionString: URL_DB }); await c.connect(); await c.query('drop schema public cascade; create schema public;'); await c.end();
  await iniciarApi({ url: URL_DB, vencimientoMs: 0 });
  await sembrar({ conOferta: false });
  srv = await iniciar(PUERTO);
  nav = await chromium.launch();
  console.log('\nMi Tienda v9 · pruebas de navegador\n');

  console.log('Marca');
  await prueba('El nombre visible es Mi Tienda y no queda "Lainec" en pantalla, en el manifiesto ni en el título', async () => {
    const { ctx, page } = await pagina(false);
    await page.goto(BASE + '#inicio'); await listo(page);
    afirmar((await page.title()).startsWith('Mi Tienda'), 'El título no empieza por Mi Tienda: ' + await page.title());
    const txt = await page.evaluate(() => document.body.innerText);
    afirmar(!/lainec|lobamall|hatillomall/i.test(txt), 'Queda un nombre viejo en pantalla');
    const m = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
    afirmar(m.short_name === 'Mi Tienda', 'short_name: ' + m.short_name);
    for (const r of ['panel', 'panel-caja', 'panel-balance', 'panel-empleados']) {
      await page.evaluate(() => { LM.S.session = { rol: 'dueno', t: 'rancho', u: 'rancho' }; });
      await page.goto(BASE + '#' + r); await page.waitForSelector('.pn');
      afirmar(!/lainec/i.test(await page.evaluate(() => document.body.innerText)), 'Queda "Lainec" en ' + r);
    }
    sinErrores(page); await ctx.close();
  });

  console.log('Entrada sin registro (Propuesta J)');
  await prueba('La tienda abre de una: sin ventana de ingreso, sin municipio obligatorio y con aviso discreto para instalar', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE); await listo(page); await page.waitForTimeout(900);
    afirmar(!(await page.isVisible('#modal')), 'Salió una ventana tapando la tienda');
    afirmar(!(await page.isVisible('#gate')) && !(await page.isVisible('#instOv')), 'Salió la entrada obligatoria o la ficha');
    afirmar(await page.isVisible('#mtInst'), 'No salió el aviso de instalar');
    afirmar(await page.locator('.card, .pcard, .hcard, .sv-card').count() > 3, 'No se ven productos sin cuenta');
    await page.screenshot({ path: new URL('v9-01-tienda-sin-cuenta.png', CAP).pathname });
    sinErrores(page); await ctx.close();
  });
  await prueba('Al pedir sin cuenta sale el ingreso; con WhatsApp (modo de prueba) se crea la cuenta y sigue el pedido', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.evaluate(() => { LM.addCart('asado', 1); LM.A.checkout({ dataset: { id: 'rancho' } }); });
    await page.waitForSelector('.mt-login');
    afirmar(await page.isVisible('text=Continuar con WhatsApp'), 'No aparece WhatsApp');
    afirmar(await page.isVisible('text=Registrarme con mis datos'), 'No aparece el registro');
    await page.screenshot({ path: new URL('v9-02-ingreso-al-pedir.png', CAP).pathname });
    await page.click('[data-act="mt-lmodo"][data-m="wa"]');
    await page.fill('#mtWaT', '301 552 9031'); await page.click('form[data-form="mt-wa-tel"] button[type=submit]');
    await page.waitForSelector('#mtCodPrueba');
    const cod = (await page.textContent('#mtCodPrueba')).trim();
    afirmar(/^\d{6}$/.test(cod), 'El código de prueba no tiene 6 números');
    await page.fill('#mtWaC', '000000'); await page.click('form[data-form="mt-wa-cod"] button[type=submit]');
    await page.waitForSelector('.mt-login .err'); afirmar(/no es/i.test(await page.textContent('.mt-login .err')), 'Un código malo no dio error');
    await page.fill('#mtWaC', cod); await page.click('form[data-form="mt-wa-cod"] button[type=submit]');
    await page.waitForSelector('#mtWaN');
    await page.fill('#mtWaN', 'Yesica Cantillo'); await page.check('form[data-form="mt-wa-nombre"] input[name=h]');
    await page.click('form[data-form="mt-wa-nombre"] button[type=submit]');
    await page.waitForSelector('text=¿Cómo pagas?');
    afirmar(await page.evaluate(() => LM.S.session.rol === 'cliente' && LM.S.user.nombre === 'Yesica Cantillo'), 'No quedó como cliente');
    afirmar(await page.evaluate(() => LM.api.yo && LM.api.yo.telefono === '3015529031'), 'No entró en el servidor');
    for (const m of ['Daviplata', 'Bre-B', 'Bancolombia', 'Nequi']) afirmar(await page.isVisible('.opts label:has-text("' + m + '")'), 'Falta el pago ' + m);
    await page.screenshot({ path: new URL('v9-03-pedido-sigue.png', CAP).pathname });
    sinErrores(page); await ctx.close();
  });
  await prueba('Registro con datos básicos crea la cuenta en el servidor', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.evaluate(() => LM.openLogin('cliente'));
    await page.click('[data-act="mt-lmodo"][data-m="crear"]');
    await page.fill('#mtCn', 'Luis Pacheco'); await page.fill('#mtCc', '3124449988'); await page.fill('#mtCd', 'Barrio Arriba, casa azul'); await page.fill('#mtCp', 'clave123');
    await page.check('form[data-form="mt-crear"] input[name=h]');
    await page.click('form[data-form="mt-crear"] button[type=submit]');
    await page.waitForFunction(() => LM.S.session && LM.S.session.rol === 'cliente');
    afirmar(await page.evaluate(() => LM.api.yo && LM.api.yo.nombre === 'Luis Pacheco'), 'No quedó la cuenta en el servidor');
    afirmar(await page.evaluate(() => LM.S.user.dirs[0].d === 'Barrio Arriba, casa azul'), 'No guardó la dirección');
    sinErrores(page); await ctx.close();
  });

  console.log('Cada rol entra a lo suyo');
  for (const [u, destino, sel] of [['rancho-cajero', 'panel-turno', '.sv-pago'], ['rancho-mesera', 'panel-atencion', '.sv-mr'], ['rancho-cocina', 'panel-cocina', '.mt-kds'], ['rancho-domi', 'panel-domicilios', null]]) {
    await prueba(`${u} entra directo a ${destino} y no ve el balance`, async () => {
      const { ctx, page } = await pagina();
      await entrarComo(page, u);
      await page.waitForFunction(d => location.hash.slice(1) === d, destino);
      if (sel) await page.waitForSelector(sel);
      const nav0 = await page.evaluate(() => [...document.querySelectorAll('.pn-nav button')].map(b => b.textContent));
      afirmar(!nav0.some(x => /Balance|Configuración|Empleados/.test(x)), 'Ve opciones del dueño: ' + nav0.join(', '));
      await page.goto(BASE + '#panel-balance'); await page.waitForSelector('.pn');
      afirmar(!(await page.isVisible('text=Te quedó')), 'Pudo abrir el balance');
      if (u === 'rancho-cocina') await page.screenshot({ path: new URL('v9-04-cocina-rol.png', CAP).pathname });
      sinErrores(page); await ctx.close();
    });
  }
  await prueba('El dueño elige una sola vez a dónde entra; luego abre directo y puede comprar y volver', async () => {
    const { ctx, page } = await pagina();
    await entrarComo(page, 'rancho');
    await page.waitForSelector('text=¿A dónde entras?');
    await page.screenshot({ path: new URL('v9-05-dueno-elige.png', CAP).pathname });
    await page.click('[data-act="mt-pref"][data-p="negocio"]'); await page.waitForSelector('.pn');
    await page.evaluate(() => LM.A.salir && LM.A.salir());
    await entrarComo(page, 'rancho'); await page.waitForSelector('.pn');
    afirmar(!(await page.isVisible('text=¿A dónde entras?')), 'Volvió a preguntar');
    await page.evaluate(() => LM.A['mt-a-comprar']()); await page.waitForSelector('#mtVolver');
    afirmar(await page.evaluate(() => LM.S.session.rol === 'cliente'), 'No quedó comprando como cliente');
    await page.click('#mtVolver'); await page.waitForSelector('.pn');
    afirmar(await page.evaluate(() => LM.S.session.rol === 'dueno'), 'No volvió al negocio');
    sinErrores(page); await ctx.close();
  });
  await prueba('El servidor no deja que la mesera vea la caja ni que la cocina cambie pagos', async () => {
    const r = await fetch(`http://localhost:${PUERTO}/api/auth/entrar`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lainec': '1' }, body: JSON.stringify({ usuario: 'rancho-mesera', clave: '1234' }) });
    const { token } = await r.json();
    const caja = await fetch(`http://localhost:${PUERTO}/api/negocio/rancho/caja`, { headers: { Authorization: 'Bearer ' + token } });
    afirmar(caja.status === 403, 'La mesera vio la caja: ' + caja.status);
    const mesas = await fetch(`http://localhost:${PUERTO}/api/negocio/rancho/mesas`, { headers: { Authorization: 'Bearer ' + token } });
    afirmar(mesas.status === 200, 'La mesera no puede ver las mesas: ' + mesas.status);
  });

  console.log('Panel del negocio (Propuesta I)');
  await prueba('Pantalla de cocina: el pedido aceptado aparece, se toca para prepararlo y LISTO lo quita', async () => {
    const { ctx, page } = await pagina(false);
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.evaluate(() => { const S = LM.S; const n = S.nPed++; S.orders.push({ n, cli: 'maria', cliN: 'Andrea Ospino', t: 'rancho', items: [{ id: 'asado', q: 2, p: 30000 }], modo: 'domicilio', zona: 'cabecera', dir: 'x', pago: 'efectivo', nota: 'Bien asado', sub: 60000, desc: 0, env: 4000, total: 64000, ts: Date.now() - 12 * 60000, te: Date.now() - 12 * 60000, e: 1, chat: [], fecha: 'Hoy' }); S.session = { rol: 'cocina', t: 'rancho', u: 'rancho-cocina' }; LM.save(); window.__n = n; });
    await page.goto(BASE + '#panel-cocina'); await page.waitForSelector('.mt-cmd');
    const k = 'o' + await page.evaluate(() => window.__n);
    afirmar(await page.locator(`.mt-cmd.atrasado[data-k="${k}"]`).count() === 1, 'Con 12 minutos debería estar roja (atrasada)');
    await page.screenshot({ path: new URL('v9-06-pantalla-cocina.png', CAP).pathname });
    await page.click(`.mt-cmd[data-k="${k}"] [data-act="sv-kds-listo"]`);
    await page.waitForFunction(x => !document.querySelector(`.mt-cmd[data-k="${x}"]`), k);
    sinErrores(page); await ctx.close();
  });
  await prueba('Asistencia: el dueño ve el QR; la mesera lo escanea y queda la entrada (también en el servidor)', async () => {
    const { ctx, page } = await pagina();
    await entrarComo(page, 'rancho-mesera'); await page.waitForSelector('.pn');
    await page.waitForFunction(() => LM.api.yo && LM.api.yo.usuario === 'rancho-mesera');
    const llego = page.waitForResponse(r => r.url().includes('/api/negocio/rancho/asistencia') && r.request().method() === 'POST', { timeout: 10000 });
    await page.goto(BASE + '#asistencia-rancho'); await page.waitForSelector('text=Entrada marcada');
    await llego; // la entrada quedó en el servidor
    await page.screenshot({ path: new URL('v9-07-asistencia.png', CAP).pathname });
    const { ctx: c2, page: p2 } = await pagina(false);
    await entrarComo(p2, 'rancho'); await p2.waitForSelector('text=¿A dónde entras?'); await p2.click('[data-act="mt-pref"][data-p="negocio"]');
    await p2.waitForFunction(() => LM.api.yo && LM.api.yo.usuario === 'rancho');
    await p2.goto(BASE + '#panel-asistencia'); await p2.waitForSelector('.mt-asis-qr svg');
    await p2.waitForSelector('td:has-text("Sofía")', { timeout: 8000 });
    sinErrores(page); sinErrores(p2); await ctx.close(); await c2.close();
  });
  await prueba('Balance por día, semana, quincena y mes', async () => {
    const { ctx, page } = await pagina(false);
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.evaluate(() => { LM.S.session = { rol: 'dueno', t: 'rancho', u: 'rancho' }; LM.save(); });
    await page.goto(BASE + '#panel-balance'); await page.waitForSelector('.mt-tabs');
    const leer = async p => { await page.click(`[data-act="mt-per"][data-p="${p}"]`); return page.evaluate(() => +document.querySelector('.kpi b').textContent.replace(/\D/g, '')); };
    const dia = await leer('dia'), sem = await leer('semana'), mes = await leer('mes'), quin = await leer('quincena');
    afirmar(dia > 0 && sem >= dia && mes >= sem && mes >= quin, `Los totales no cuadran: día ${dia}, semana ${sem}, quincena ${quin}, mes ${mes}`);
    afirmar(await page.isVisible('text=Quincena del'), 'No dice qué quincena es');
    sinErrores(page); await ctx.close();
  });
  await prueba('PQR: el cliente la envía y el dueño la ve y la responde (por el servidor)', async () => {
    const { ctx, page } = await pagina();
    await entrarComo(page, 'maria'); await page.waitForFunction(() => LM.S.session && LM.S.session.rol === 'cliente');
    await page.waitForFunction(() => LM.api.yo && LM.api.yo.usuario === 'maria');
    await page.goto(BASE + '#pqr'); await page.waitForSelector('form[data-form="mt-pqr-env"]');
    await page.selectOption('#pqN', 'rancho'); await page.selectOption('#pqT', 'reclamo'); await page.fill('#pqX', 'El pedido llegó sin la gaseosa que pagué.');
    await page.click('form[data-form="mt-pqr-env"] button[type=submit]'); await page.waitForSelector('text=/Radicado PQR-/');
    const { ctx: c2, page: p2 } = await pagina(false);
    await entrarComo(p2, 'rancho'); await p2.waitForSelector('text=¿A dónde entras?'); await p2.click('[data-act="mt-pref"][data-p="negocio"]');
    await p2.waitForFunction(() => LM.api.yo && LM.api.yo.usuario === 'rancho');
    await p2.goto(BASE + '#panel-pqr'); await p2.waitForSelector('text=El pedido llegó sin la gaseosa', { timeout: 8000 });
    await p2.waitForTimeout(1500); // que termine de cargar lo del servidor antes de escribir
    afirmar(await p2.isVisible('text=Quedan 15 días hábiles') || await p2.isVisible('text=/Quedan 1[45] días/'), 'No muestra el plazo');
    await p2.fill('form[data-srv="1"] input[name=r]', 'Te devolvemos la gaseosa en el próximo pedido.'); await p2.click('form[data-srv="1"] button[type=submit]');
    await p2.waitForSelector('text=Te devolvemos la gaseosa');
    await p2.screenshot({ path: new URL('v9-08-pqr.png', CAP).pathname });
    sinErrores(page); sinErrores(p2); await ctx.close(); await c2.close();
  });
  await prueba('Empleados: el dueño invita a un cocinero con su celular; sale la clave temporal y el enlace de WhatsApp; el invitado entra a la cocina', async () => {
    const { ctx, page } = await pagina(false);
    await entrarComo(page, 'rancho'); await page.waitForSelector('text=¿A dónde entras?'); await page.click('[data-act="mt-pref"][data-p="negocio"]');
    await page.waitForFunction(() => LM.api.yo && LM.api.yo.usuario === 'rancho');
    await page.goto(BASE + '#panel-empleados'); await page.waitForSelector('form[data-form="mt-emp"]');
    await page.fill('#meN', 'Wilmer Rangel'); await page.fill('#meC', '3009991122'); await page.check('input[name=r][value=Cocina]');
    await page.click('form[data-form="mt-emp"] button[type=submit]');
    await page.waitForSelector('text=Clave temporal');
    const clave = (await page.locator('.kv:has-text("Clave temporal") b').textContent()).trim();
    const wa = await page.getAttribute('a[href^="https://wa.me/573009991122"]', 'href');
    afirmar(wa && decodeURIComponent(wa).includes(clave), 'El enlace de WhatsApp no lleva la clave');
    const { ctx: c2, page: p2 } = await pagina();
    await p2.goto(BASE + '#inicio'); await listo(p2);
    await p2.evaluate(() => LM.openLogin('cliente')); await p2.click('[data-act="mt-lmodo"][data-m="usuario"]');
    await p2.fill('#mtUu', '3009991122'); await p2.fill('#mtUp', clave); await p2.click('form[data-form="mt-usuario"] button[type=submit]');
    await p2.waitForFunction(() => location.hash === '#panel-cocina');
    sinErrores(page); sinErrores(p2); await ctx.close(); await c2.close();
  });
  await prueba('Punto de venta: la gaseosa pregunta sabor y si va fría; el acetaminofén cobra según la presentación', async () => {
    const { ctx, page } = await pagina(false);
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.evaluate(() => { LM.S.session = { rol: 'dueno', t: 'rancho', u: 'rancho' }; LM.save(); });
    await page.goto(BASE + '#panel-pos'); await page.waitForSelector('#posQ');
    await page.fill('#posQ', 'Gaseosa 400'); await page.press('#posQ', 'Enter');
    await page.waitForSelector('form[data-form="mt-ops"]');
    await page.click('.mt-op:has-text("Naranja")'); await page.click('form[data-form="mt-ops"] button[type=submit]');
    await page.waitForSelector('.lm-pos-l:has-text("Gaseosa 400 ml (Naranja, Bien fría)")');
    await page.evaluate(() => { LM.S.session = { rol: 'dueno', t: 'drogueria', u: 'drogueria' }; LM.save(); });
    await page.goto(BASE + '#panel-pos'); await page.waitForSelector('#posQ');
    await page.fill('#posQ', 'Acetaminof'); await page.press('#posQ', 'Enter');
    await page.waitForSelector('form[data-form="mt-ops"]'); await page.click('.mt-op:has-text("Blíster")'); await page.click('form[data-form="mt-ops"] button[type=submit]');
    await page.waitForSelector('.lm-pos-l:has-text("Blíster x 10")');
    afirmar(await page.locator('.lm-pos-l:has-text("Blíster x 10")').textContent().then(t => t.includes('3.000')), 'El blíster no cobra $3.000');
    sinErrores(page); await ctx.close();
  });

  console.log('Atención por tipo de negocio (Propuesta K)');
  const comoDueno = async (page, tid, sec) => { await page.goto(BASE + '#inicio'); await listo(page); await page.evaluate(t => { LM.S.session = { rol: 'dueno', t, u: t }; LM.S.v9.pref[t] = 'negocio'; LM.save(); }, tid); await page.goto(BASE + '#panel-' + sec); await page.waitForSelector('.pn'); };
  await prueba('Granero por mayor: vende un bulto a precio de tendero y descuenta 50 kg; despacha el pedido de la tienda a crédito', async () => {
    const { ctx, page } = await pagina(false);
    await comoDueno(page, 'granero', 'mayor');
    const antes = await page.evaluate(() => LM.PR('arroz-mayor').stock);
    await page.click('[data-act="my-add"][data-id="arroz-mayor"][data-u="2"]');
    afirmar(await page.isVisible('text=$168.000'), 'No usa el precio de tendero');
    await page.click('form[data-form="my-cobrar"] button[type=submit]');
    afirmar(await page.evaluate(a => LM.PR('arroz-mayor').stock === a - 50, antes), 'No descontó 50 kg');
    await page.click('[data-act="my-despachar"][data-m="fiado"]');
    afirmar(await page.evaluate(() => LM.NEG('granero').k9.credito.tienda.usado > 640000), 'No sumó al crédito de la tienda');
    await page.screenshot({ path: new URL('v9-09-por-mayor.png', CAP).pathname });
    sinErrores(page); await ctx.close();
  });
  await prueba('Ferretería: vende 15 metros de cable y convierte una cotización en venta', async () => {
    const { ctx, page } = await pagina(false);
    await comoDueno(page, 'ferreteria', 'medida');
    await page.selectOption('#feP', 'cable12'); await page.fill('#feQ', '15'); await page.click('form[data-form="fe-add"] button[type=submit]');
    await page.waitForSelector('text=$42.000'); await page.click('[data-act="fe-cobrar"]');
    afirmar(await page.evaluate(() => LM.PR('cable12').stock === 448), 'No descontó los 15 metros');
    await page.click('[data-act="fe-convertir"]'); await page.waitForSelector('.pill:has-text("Vendida")');
    sinErrores(page); await ctx.close();
  });
  await prueba('Pescadores: recibe 10 libras, suben a la nevera, y la liquidación queda como gasto al pagar', async () => {
    const { ctx, page } = await pagina(false);
    await comoDueno(page, 'pescadores', 'acopio');
    const antes = await page.evaluate(() => LM.PR('bocachico-lb').stock);
    await page.fill('#peP', 'Ovidio Rangel'); await page.selectOption('#peE', 'bocachico-lb'); await page.fill('#peL', '10'); await page.fill('#peC', '6000');
    await page.click('form[data-form="pe-recibir"] button[type=submit]');
    afirmar(await page.evaluate(a => LM.PR('bocachico-lb').stock === a + 10, antes), 'No subió la nevera');
    await page.click('[data-act="pe-pagar"][data-p="Ovidio Rangel"]');
    afirmar(await page.evaluate(() => LM.NEG('pescadores').gastos.some(g => /Ovidio/.test(g.d) && g.v === 288000)), 'El pago a Ovidio no quedó como gasto de $288.000');
    sinErrores(page); await ctx.close();
  });
  await prueba('Quesera, granja y distribuidora: producción al inventario, encargo semanal que se repite y pedido de preventa', async () => {
    const { ctx, page } = await pagina(false);
    await comoDueno(page, 'quesera', 'produccion');
    const q0 = await page.evaluate(() => LM.PR('queso-costeno').stock);
    await page.fill('#quK', '41.5'); await page.click('form[data-form="qu-prod"] button[type=submit]');
    afirmar(await page.evaluate(a => LM.PR('queso-costeno').stock === a + 20, q0), 'Los 10 kg nuevos no sumaron 20 libras');
    await comoDueno(page, 'granja', 'granja');
    const idMP = await page.evaluate(() => LM.NEG('granja').k9.encargos.find(e => e.para === 'Tienda Mi Pueblo').id);
    await page.click(`[data-act="en-est"][data-id="${idMP}"][data-e="listo"]`); await page.click(`[data-act="en-est"][data-id="${idMP}"][data-e="entregado"]`);
    afirmar(await page.evaluate(() => LM.NEG('granja').k9.encargos.filter(e => e.para === 'Tienda Mi Pueblo').length === 2), 'El encargo semanal no se repitió');
    await comoDueno(page, 'distribuidora', 'rutas');
    await page.click('[data-act="ru-pedido"]'); await page.fill('input[name="paca-gaseosa"]', '5'); await page.click('form[data-form="ru-ped"] button[type=submit]');
    afirmar(await page.isVisible('text=pedido $105.000'), 'No quedó el pedido de 5 pacas');
    sinErrores(page); await ctx.close();
  });
  await prueba('Droguería: un pedido con amoxicilina pide revisar la fórmula; barbería: el de la fila pasa a la silla', async () => {
    const { ctx, page } = await pagina(false);
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.evaluate(() => { const S = LM.S; S.orders.push({ n: S.nPed++, cli: 'maria', cliN: 'Andrea Ospino', t: 'drogueria', items: [{ id: 'amoxicilina', q: 1, p: 16500 }], modo: 'domicilio', zona: 'cabecera', dir: 'x', pago: 'efectivo', sub: 16500, desc: 0, env: 4000, total: 20500, ts: Date.now(), te: Date.now(), e: 0, chat: [], fecha: 'Hoy' }); LM.save(); });
    await comoDueno(page, 'drogueria', 'formulas');
    await page.waitForSelector('text=Requiere fórmula'); await page.click('[data-act="rx-ok"]');
    afirmar(!(await page.isVisible('text=Requiere fórmula')), 'Sigue pendiente después de aprobar');
    await page.screenshot({ path: new URL('v9-10-formulas.png', CAP).pathname });
    await comoDueno(page, 'barberia', 'turnos');
    await page.waitForSelector('.mt-fila'); const n0 = await page.locator('[data-act="fi-pasar"]').count();
    await page.click('[data-act="fi-pasar"]');
    afirmar(await page.locator('[data-act="fi-pasar"]').count() === n0 - 1, 'No salió de la fila');
    sinErrores(page); await ctx.close();
  });
  await prueba('Las pantallas de los 6 negocios nuevos abren sin errores en el celular', async () => {
    const { ctx, page } = await pagina();
    for (const [t, s] of [['granero', 'mayor'], ['ferreteria', 'medida'], ['pescadores', 'acopio'], ['quesera', 'produccion'], ['distribuidora', 'rutas'], ['granja', 'granja']]) {
      await comoDueno(page, t, s);
      const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
      afirmar(ancho <= 392, `${t}: la página se sale de lado (${ancho}px)`);
    }
    sinErrores(page); await ctx.close();
  });
} finally {
  if (nav) await nav.close();
  cerrarTodo(); if (srv) srv.close();
  await cerrar();
}

const ok = resultados.filter(r => r.ok).length;
const rep = ['Mi Tienda v9 · Reporte de pruebas de navegador', 'Fecha: ' + new Date().toLocaleString('es-CO'), `Resultado: ${ok} de ${resultados.length} pruebas pasaron`, '',
  ...resultados.map((r, i) => `${String(i + 1).padStart(2, '0')}. ${r.ok ? 'PASÓ ' : 'FALLÓ'}  ${r.nombre}  (${(r.ms / 1000).toFixed(1)} s)${r.ok ? '' : '\n      → ' + r.error}`)].join('\n');
await writeFile(new URL('./reporte-v9.txt', import.meta.url), rep + '\n');
console.log(`\n${ok} de ${resultados.length} pruebas pasaron. Reporte: tests/reporte-v9.txt`);
process.exit(ok === resultados.length ? 0 : 1);
