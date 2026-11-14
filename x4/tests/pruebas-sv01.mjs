// Mi Tienda · Servus 0.1 · pruebas de navegador de lo nuevo
// Inicio (Combos + Los mejor calificados), ingreso y recuperar la contraseña, tienda del negocio con cupones,
// pantallas de atención de los 14 tipos de negocio, roles con datos de ejemplo, domiciliario de ejemplo
// y lo que se comparte entre celulares con el servidor (mesera → cocina, taller → cliente, barbería ← cliente).
// Uso:  TEST_DATABASE_URL=postgres://usuario:clave@localhost/mitienda_test npm run test:sv
// ¡OJO! Borra y recrea el esquema de la base de PRUEBAS. Nunca la apuntes a la base real.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import pg from 'pg';
import { iniciar, iniciarApi } from '../servidor.mjs';
import { sembrar } from '../api/semilla.mjs';
import { cerrar } from '../api/db.mjs';
import { cerrarTodo } from '../api/tiempo-real.mjs';
import { reiniciarLimites } from '../api/auth.mjs';

const URL_DB = process.env.TEST_DATABASE_URL;
if (!URL_DB || !/test/.test(URL_DB)) { console.error('Define TEST_DATABASE_URL (debe contener "test").'); process.exit(1); }
const PUERTO = 8097, BASE = `http://localhost:${PUERTO}/index.html`;
const CAP = new URL('./capturas/', import.meta.url);
await mkdir(CAP, { recursive: true });
const resultados = [], ABIERTAS = [];
let nav, srv;

async function prueba(nombre, fn) {
  const t0 = Date.now(); reiniciarLimites();
  try { await fn(); resultados.push({ ok: true, nombre }); console.log(`  ✔ ${nombre}`); }
  catch (e) {
    resultados.push({ ok: false, nombre, error: e.message.split('\n')[0] }); console.log(`  ✘ ${nombre}\n      → ${e.message.split('\n')[0]}`);
    let i = 0; for (const p of ABIERTAS) { try { if (!p.isClosed()) await p.screenshot({ path: new URL(`fallo-sv-${resultados.length}-${i++}.png`, CAP).pathname }); } catch (x) {} }
  }
  void t0;
}
const afirmar = (c, m) => { if (!c) throw new Error(m); };
async function pagina(movil = false) {
  const ctx = await nav.newContext(movil ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1366, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('hm-pruebas', '1'); localStorage.setItem('hm-tut-visto', '1'); localStorage.setItem('mt-banner-x', String(Date.now())); } catch (e) {} });
  const page = await ctx.newPage(); ABIERTAS.push(page);
  page.errores = []; page.on('pageerror', e => page.errores.push(e.message));
  return { ctx, page };
}
const listo = page => page.waitForFunction(() => window.LM && LM.api && LM.api.disponible !== null && LM.sv && LM.sv.st);
const sinErrores = page => afirmar(!page.errores.length, 'Errores de JavaScript: ' + page.errores.join(' | '));
const hash = page => page.evaluate(() => location.hash.slice(1));
const texto = page => page.evaluate(() => document.body.innerText);
const sinDesborde = async (page, donde) => { const w = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); afirmar(w[0] <= w[1] + 1, 'La página se sale de lado en ' + donde + ': ' + w.join(' > ')); };
async function entrarComo(page, u, clave = '1234') {
  await page.goto(BASE + '#inicio'); await listo(page);
  await page.evaluate(() => LM.openLogin('cliente'));
  await page.click('[data-act="mt-lmodo"][data-m="usuario"]');
  await page.fill('#mtUu', u); await page.fill('#mtUp', clave);
  await page.click('form[data-form="mt-usuario"] button[type=submit]');
  await page.waitForFunction(() => LM.S.session, null, { timeout: 8000 });
  const sel = await page.waitForSelector('.mt-elige', { timeout: 1200 }).catch(() => null);
  if (sel) { await page.click('.mt-elige'); await page.waitForTimeout(400); }
}
const local = async (page, rol, t, u) => { await page.goto(BASE + '#inicio'); await listo(page); await page.evaluate(([rol, t, u]) => { LM.S.session = { rol, t, u }; LM.save(); }, [rol, t, u]); };

try {
  const c = new pg.Client({ connectionString: URL_DB }); await c.connect(); await c.query('drop schema public cascade; create schema public;'); await c.end();
  await iniciarApi({ url: URL_DB, vencimientoMs: 0 });
  await sembrar({ conOferta: false });
  srv = await iniciar(PUERTO);
  nav = await chromium.launch();
  console.log('\nMi Tienda · Servus 0.1 · pruebas de navegador\n');

  console.log('Inicio');
  await prueba('Orden del inicio (Servus 0.2): franja de pautas → estados → Súper ofertas → Top 5 → Combos → Negocios que debes conocer → Más para ti', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page); await page.waitForSelector('.sv2-top5');
    const orden = await page.evaluate(() => [...document.querySelectorAll('.sv-home h2')].map(h => h.textContent.trim()));
    const i = n => orden.findIndex(x => x.includes(n));
    afirmar(i('Súper ofertas') >= 0 && i('Súper ofertas') < i('Top 5') && i('Top 5') < i('Combos') && i('Combos') < i('Negocios que debes conocer') && i('Negocios que debes conocer') < i('Más para ti'), 'Orden: ' + orden.join(' / '));
    const fotos = await page.evaluate(async () => { const im = [...document.querySelectorAll('.sv-home img')].slice(0, 25); await Promise.all(im.map(x => x.decode().catch(() => {}))); return im.filter(x => !x.naturalWidth).map(x => x.src); });
    afirmar(!fotos.length, 'Fotos que no cargan: ' + fotos.join(', '));
    afirmar((await page.$$('.sv-home .sv-circ')).length === 0, 'Servus 3.0 quitó los círculos de categorías de la portada');
    afirmar((await page.$$('.sv2-est')).length >= 10, 'Faltan los estados de los negocios');
    sinErrores(page); await ctx.close();
  });
  await prueba('En celular: todo cabe a lo ancho y aparece "Abiertos cerca de ti"', async () => {
    const { ctx, page } = await pagina(true);
    await page.goto(BASE + '#inicio'); await listo(page); await page.waitForSelector('.sv2-top5');
    await sinDesborde(page, 'el inicio');
    afirmar(await page.isVisible('.sv-solo-m .sv-abiertos'), 'No se ve "Abiertos cerca de ti"');
    for (const r of ['t-rancho', 'demo', 'domi-demo', 'moto-taller-OT-218', 'registra-negocio', 'mis-partidas']) { await page.evaluate(h => { location.hash = h; }, r); await page.waitForTimeout(500); await sinDesborde(page, r); }
    sinErrores(page); await ctx.close();
  });
  await prueba('"Agregar combo" pone los dos productos (de dos negocios) en el carrito', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.click('[data-act="sv-combo"][data-id="cb1"]');
    const cart = await page.evaluate(() => LM.S.cart.map(i => i.id + ':' + i.q).sort().join(','));
    afirmar(cart === 'hamburguesa-rc:1,helado:1', 'Carrito: ' + cart);
    sinErrores(page); await ctx.close();
  });

  console.log('Ingreso y contraseña');
  await prueba('La ventana de ingreso muestra Google, Facebook y WhatsApp, "Registrarme con mis datos" y "¿Ya tienes cuenta con correo? Ingresar"', async () => {
    const { ctx, page } = await pagina(true);
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.evaluate(() => LM.openLogin('cliente')); await page.waitForSelector('.mt-provs');
    const t = await page.evaluate(() => document.querySelector('#modal').innerText);
    for (const x of ['Continuar con Google', 'Continuar con Facebook', 'Continuar con WhatsApp', 'Registrarme con mis datos', '¿Ya tienes cuenta con correo?']) afirmar(t.includes(x), 'Falta: ' + x);
    await page.click('[data-act="mt-prov-off"][data-p="Google"]');
    afirmar((await page.evaluate(() => document.querySelector('#modal').innerText)).includes('se activa cuando el administrador'), 'Google sin configurar no explica qué pasa');
    await sinDesborde(page, 'la ventana de ingreso');
    sinErrores(page); await ctx.close();
  });
  await prueba('Recuperar la contraseña por correo (modo de prueba): pide el código, cambia la clave y entra', async () => {
    const { ctx, page } = await pagina(true);
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.evaluate(() => LM.openLogin('cliente'));
    await page.click('[data-act="mt-lmodo"][data-m="usuario"]');
    await page.click('[data-act="mt-lmodo"][data-m="recuperar"]');
    await page.fill('#mtRd', 'maria@ejemplo.com');
    await page.click('form[data-form="mt-rec-pedir"] button[type=submit]');
    await page.waitForSelector('#mtRecPrueba');
    const codigo = (await page.textContent('#mtRecPrueba')).trim();
    afirmar(/^\d{6}$/.test(codigo), 'Código de prueba: ' + codigo);
    await page.fill('#mtRc', codigo); await page.fill('#mtRp', 'clave99');
    await page.click('form[data-form="mt-rec-cambiar"] button[type=submit]');
    await page.waitForFunction(() => LM.S.session && LM.S.session.rol === 'cliente', null, { timeout: 8000 });
    const { page: p2, ctx: c2 } = await pagina(true);
    await entrarComo(p2, 'maria', 'clave99');
    afirmar((await p2.evaluate(() => LM.S.session.u)) === 'maria', 'No entra con la clave nueva');
    sinErrores(page); sinErrores(p2); await ctx.close(); await c2.close();
  });
  await prueba('Recuperar por WhatsApp también se puede escoger', async () => {
    const { ctx, page } = await pagina(true);
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.evaluate(() => LM.openLogin('cliente'));
    await page.click('[data-act="mt-lmodo"][data-m="usuario"]'); await page.click('[data-act="mt-lmodo"][data-m="recuperar"]');
    await page.fill('#mtRd', '3001112233'); await page.check('input[name="c"][value="whatsapp"]');
    await page.click('form[data-form="mt-rec-pedir"] button[type=submit]');
    await page.waitForSelector('#mtRecPrueba');
    afirmar((await page.evaluate(() => document.querySelector('#modal').innerText)).includes('al WhatsApp registrado'), 'No dice que va al WhatsApp');
    sinErrores(page); await ctx.close();
  });

  console.log('Tienda del negocio y cupones');
  await prueba('"Ver mi negocio": portada, dueño, cupones, cómo entrega, lo más pedido y pestañas', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#t-rancho'); await listo(page); await page.waitForSelector('.sv-portada');
    const t = await texto(page);
    for (const x of ['Rancho Costeño', 'Don Efraín', 'Cupones del negocio', 'Así entregamos', 'Lo más pedido', 'Escribir al negocio']) afirmar(t.includes(x), 'Falta: ' + x);
    afirmar(/Seguir|Siguiendo/.test(t), 'Falta el botón Seguir');
    afirmar((await page.$$('.sv-cupon')).length >= 2, 'Faltan los cupones de ejemplo');
    await page.click('[data-act="sv-tab"][data-t="productos"]'); await page.waitForSelector('.sv-buscar input');
    await page.fill('.sv-buscar input', 'sancocho'); await page.waitForTimeout(500);
    afirmar((await page.$$('.sv-grid .sv-card')).length === 1, 'El buscador de la tienda no filtra');
    sinErrores(page); await ctx.close();
  });
  await prueba('Cupón de valor fijo: "Tomar" y al pagar descuenta $2.000 solo desde $15.000', async () => {
    const { ctx, page } = await pagina();
    await entrarComo(page, 'juan');
    await page.evaluate(() => { location.hash = 't-rancho'; }); await page.waitForSelector('[data-act="sv-tomar"][data-id="sv-c1"]');
    await page.click('[data-act="sv-tomar"][data-id="sv-c1"]');
    afirmar(await page.evaluate(() => LM.S.cupAct.includes('sv-c1')), 'No quedó tomado');
    await page.evaluate(() => { LM.S.cart = [{ id: 'gaseosa400', q: 1 }]; LM.save(); LM.A.checkout({ dataset: { id: 'rancho' } }); });
    await page.waitForSelector('[data-inp="co-cup"]'); await page.fill('[data-inp="co-cup"]', 'RANCHO2000'); await page.click('[data-act="co-cup"]');
    afirmar((await page.evaluate(() => document.querySelector('#modal').innerText)).includes('Te faltan'), 'Con poco pedido debe decir cuánto falta');
    await page.evaluate(() => { LM.closeModal(); LM.S.cart = [{ id: 'asado', q: 1 }]; LM.save(); LM.A.checkout({ dataset: { id: 'rancho' } }); });
    await page.waitForSelector('[data-inp="co-cup"]'); await page.fill('[data-inp="co-cup"]', 'RANCHO2000'); await page.click('[data-act="co-cup"]');
    const m = await page.evaluate(() => document.querySelector('#modal').innerText);
    afirmar(m.includes('$2.000 de descuento'), 'No aplicó el descuento fijo: ' + m.slice(0, 300));
    sinErrores(page); await ctx.close();
  });
  await prueba('El dueño crea un cupón de regalo en "Mi vitrina y cupones" y sale en su tienda', async () => {
    const { ctx, page } = await pagina();
    await local(page, 'dueno', 'rancho', 'rancho');
    await page.evaluate(() => { location.hash = 'panel-vitrina'; }); await page.waitForSelector('form[data-form="sv-vi-cupon"]');
    await page.selectOption('#svCuT', 'regalo');
    await page.fill('#svCuC', 'PATACON'); await page.fill('#svCuR', 'Patacón gratis'); await page.selectOption('#svCuP', 'sancocho'); await page.fill('#svCuQ', '2');
    await page.click('form[data-form="sv-vi-cupon"] button[type=submit]');
    await page.click('[data-act="sv-vi-port"][data-f="f-fogon"]');
    await page.evaluate(() => { location.hash = 't-rancho'; }); await page.waitForSelector('.sv-cupon');
    const t = await texto(page);
    afirmar(t.includes('Patacón gratis') && t.includes('Así ven tu negocio los clientes'), 'El cupón nuevo no sale en la tienda');
    afirmar(/f-fogon/.test(await page.evaluate(() => getComputedStyle(document.querySelector('.sv-portada')).backgroundImage)), 'La portada no cambió');
    sinErrores(page); await ctx.close();
  });

  console.log('Pantallas de atención (cada negocio con su forma de atender)');
  const ATENCION = { billar: 'Mesas de billar', barberia: 'Turnos y fila', tienda: 'Mostrador', drogueria: 'Mostrador y fórmulas', taller: 'Órdenes de taller', granero: 'Venta por mayor', ferreteria: 'Mostrador y cotizaciones',
    ropa: 'Tallas y separados', pescadores: 'Acopio y nevera', quesera: 'Producción y encargos', distribuidora: 'Rutas y preventa', agro: 'Mostrador y visitas', granja: 'Producción y encargos', rancho: 'Mis mesas' };
  const EJEMPLO = { billar: 'Mesa 3', barberia: 'Luis Pacheco', tienda: 'Diana Mercado', drogueria: 'Amoxicilina', taller: 'OT-218', granero: 'Pedido de Tienda Mi Pueblo', ferreteria: 'COT-031', ropa: 'Plan separe', pescadores: 'Ovidio Rangel', quesera: 'La Esperanza', distribuidora: 'Paradas de hoy', agro: 'Finca La Esperanza', granja: 'Galpón 1', rancho: 'Mesa 8 pidió por QR' };
  await prueba('Las 14 pantallas abren con datos de ejemplo y el menú común (caja, gastos, balance, inventario…) sigue igual', async () => {
    const { ctx, page } = await pagina();
    for (const t of Object.keys(ATENCION)) {
      await local(page, 'dueno', t, t);
      await page.evaluate(() => { location.hash = 'panel-atencion'; }); await page.waitForSelector('.sv-at');
      const x = await texto(page);
      afirmar(x.includes(ATENCION[t]), t + ': falta el título ' + ATENCION[t]);
      afirmar(x.includes(EJEMPLO[t]), t + ': no tiene los datos de ejemplo (' + EJEMPLO[t] + ')');
      const menu = await page.evaluate(() => [...document.querySelectorAll('.pn-nav button')].map(b => b.textContent));
      for (const m of ['Tablero', 'Caja', 'Gastos', 'Balance', 'Productos', 'Inventario', 'Empleados y roles', 'Configuración']) afirmar(menu.some(y => y.includes(m)), t + ': falta en el menú ' + m);
    }
    sinErrores(page); await ctx.close();
  });
  await prueba('Las pantallas de atención caben en el celular', async () => {
    const { ctx, page } = await pagina(true);
    for (const t of Object.keys(ATENCION)) { await local(page, 'dueno', t, t); await page.evaluate(() => { location.hash = 'panel-atencion'; }); await page.waitForSelector('.sv-at'); await sinDesborde(page, t); }
    sinErrores(page); await ctx.close();
  });
  await prueba('Billar: iniciar una mesa, agregar consumo, parar el reloj y cobrar deja la venta en la caja', async () => {
    const { ctx, page } = await pagina();
    await local(page, 'dueno', 'billar', 'billar');
    await page.evaluate(() => { location.hash = 'panel-atencion'; }); await page.waitForSelector('.sv-mesas-b');
    await page.click('[data-act="sv-bi-sel"][data-id="2"]');
    await page.click('form[data-form="sv-bi-iniciar"] button[type=submit]');
    await page.click('[data-act="sv-bi-cons"]'); await page.click('[data-act="sv-bi-cons1"][data-n="Cerveza nacional"]');
    await page.click('[data-act="sv-bi-cobrar"]'); await page.click('form[data-form="sv-bi-pagar"] button[type=submit]');
    const v = await page.evaluate(() => LM.NEG('billar').ventas.slice(-1)[0]);
    afirmar(v && /Mesa 2/.test(v.d) && v.v === 4000 + 1500, 'Venta: ' + JSON.stringify(v));
    sinErrores(page); await ctx.close();
  });
  await prueba('Tienda: vender fiado suma a la deuda del cuaderno', async () => {
    const { ctx, page } = await pagina();
    await local(page, 'dueno', 'tienda', 'tienda');
    await page.evaluate(() => { location.hash = 'panel-atencion'; }); await page.waitForSelector('.sv-tiles');
    const antes = await page.evaluate(() => LM.sv.st(LM.T('tienda')).cuaderno.find(c => c.n === 'Valentina Rangel').debe);
    await page.click('[data-act="sv-ti-pago"][data-m="fiado"]');
    await page.selectOption('select[data-chg="sv-ti-fiado"]', 'Valentina Rangel');
    await page.click('[data-act="sv-ti-cobrar"]');
    const despues = await page.evaluate(() => LM.sv.st(LM.T('tienda')).cuaderno.find(c => c.n === 'Valentina Rangel').debe);
    afirmar(despues === antes + 9000, 'Deuda ' + antes + ' → ' + despues);
    sinErrores(page); await ctx.close();
  });

  console.log('Roles con datos de ejemplo');
  await prueba('Cada cargo entra a lo suyo y lo encuentra lleno (cocina, mesera, cajera, barbero, mesera de billar)', async () => {
    const casos = [['rancho-cocina', 'panel-cocina', '.mt-cmd', 3], ['rancho-mesera', 'panel-atencion', '.sv-mr', 9], ['rancho-cajero', 'panel-turno', '.sv-pago', 1], ['barberia-atencion', 'panel-atencion', '.sv-ag-b', 4], ['billar-mesera', 'panel-atencion', '.sv-mb', 8]];
    for (const [u, h, sel, n] of casos) {
      const { ctx, page } = await pagina();
      await entrarComo(page, u); await page.waitForFunction(x => location.hash === '#' + x, h, { timeout: 6000 }).catch(() => {});
      afirmar((await hash(page)) === h, u + ' entró a ' + await hash(page));
      await page.waitForSelector(sel);
      afirmar((await page.$$(sel)).length >= n, u + ': pantalla con pocos datos de ejemplo');
      if (u === 'barberia-atencion') { const menu = await page.evaluate(() => [...document.querySelectorAll('.pn-nav button')].map(b => b.textContent).join('|')); afirmar(!/Balance|Gastos/.test(menu), 'El barbero ve el balance o los gastos'); afirmar((await texto(page)).includes('Barbero'), 'No se ve el cargo'); }
      sinErrores(page); await ctx.close();
    }
  });
  await prueba('La página #demo tiene un usuario por cargo en cada negocio y el domiciliario de ejemplo', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#demo'); await listo(page); await page.waitForSelector('.sv-demo-n');
    afirmar((await page.$$('.sv-demo-n')).length >= 16, 'Faltan negocios en #demo');
    afirmar((await page.$$('.sv-demo-u')).length >= 40, 'Faltan cargos en #demo');
    await page.click('[data-h="domi-demo"]'); await page.waitForSelector('.sv-dm');
    await page.click('[data-act="sv-dm-on"]'); await page.click('[data-act="sv-dm-tomar"]');
    for (let i = 0; i < 3; i++) await page.click('[data-act="sv-dm-paso"]');
    afirmar((await texto(page)).includes('$3.000'), 'Las ganancias del domiciliario no suben');
    sinErrores(page); await ctx.close();
  });

  console.log('Compartido entre celulares (con el servidor)');
  await prueba('La mesera manda un pedido a cocina y la tablet de cocina lo ve; cocina marca LISTO y la mesera recibe el aviso', async () => {
    const m = await pagina(), k = await pagina();
    await entrarComo(m.page, 'rancho-mesera'); await m.page.waitForSelector('.sv-mr');
    await entrarComo(k.page, 'rancho-cocina'); await k.page.waitForSelector('.mt-kds');
    await m.page.click('[data-act="sv-re-mesa"][data-id="9"]');
    // Servus 0.2: pedido paso a paso → resumen → enviar; el dueño lo aprueba y pasa a la cocina
    await m.page.click('[data-act="sv2-pasos-mesa"]');
    await m.page.click('.sv2-cats button:text-is("Almuerzos")');
    for (let n = 0; n < 3; n++) await m.page.click('.sv2-plato:has-text("Sancocho de gallina") button.mas');
    await m.page.click('.sv2-cats button:text-is("Resumen")');
    await m.page.click('[data-act="sv2-rsenviar"]'); await m.page.click('[data-act="cerrar-render"]');
    const d = await pagina(); await entrarComo(d.page, 'rancho'); await d.page.evaluate(() => { location.hash = 'panel-atencion'; });
    await d.page.waitForSelector('[data-act="sv2-aprobar"]', { timeout: 25000 }); await d.page.click('[data-act="sv2-aprobar"]'); await d.page.waitForTimeout(1200); await d.ctx.close();
    await k.page.waitForFunction(() => [...document.querySelectorAll('.mt-cmd header b')].some(b => b.textContent === 'Mesa 9'), null, { timeout: 25000 });
    await k.page.click('.mt-cmd:has(header b:text-is("Mesa 9")) [data-act="sv-kds-listo"]');
    await m.page.waitForFunction(() => document.body.innerText.includes('Mesa 9 · comida lista'), null, { timeout: 25000 });
    sinErrores(m.page); sinErrores(k.page); await m.ctx.close(); await k.ctx.close();
  });
  await prueba('Taller: el cliente ve su moto desde su celular, aprueba, y el taller la ve en reparación', async () => {
    const t = await pagina(), c = await pagina(true);
    await entrarComo(t.page, 'taller'); await t.page.evaluate(() => { location.hash = 'panel-atencion'; }); await t.page.waitForSelector('.sv-kanban');
    await t.page.waitForTimeout(1500); // sube el estado de ejemplo al servidor
    await entrarComo(c.page, 'maria', 'clave99'); // la clave cambió en la prueba de recuperar
    await c.page.evaluate(() => { location.hash = 'moto-taller-OT-218'; }); await c.page.waitForSelector('[data-act="sv-moto-ok"]');
    await c.page.click('[data-act="sv-moto-ok"]');
    await c.page.waitForFunction(() => document.body.innerText.includes('Ya aprobaste'), null, { timeout: 8000 });
    await t.page.waitForFunction(() => { const o = LM.sv.st(LM.T('taller')).ordenes.find(x => x.id === 'OT-218'); return o && o.estado === 'reparacion'; }, null, { timeout: 25000 });
    sinErrores(t.page); sinErrores(c.page); await t.ctx.close(); await c.ctx.close();
  });
  await prueba('Barbería: el cliente pide turno en la tienda y el barbero lo ve en su agenda', async () => {
    const b = await pagina(), c = await pagina(true);
    await entrarComo(b.page, 'barberia-atencion'); await b.page.waitForSelector('.sv-agenda'); await b.page.waitForTimeout(1500);
    await entrarComo(c.page, 'juan');
    await c.page.evaluate(() => { location.hash = 't-barberia'; }); await c.page.waitForSelector('.sv-horas');
    await c.page.click('[data-act="sv-cl-tu"][data-k="b"][data-v="kevin"]');
    await c.page.click('[data-act="sv-cl-tu"][data-k="h"][data-v="17:30"]');
    await c.page.click('[data-act="sv-cl-turno"]');
    await c.page.waitForFunction(() => document.querySelector('#toast') && /Turno pedido/.test(document.body.innerText), null, { timeout: 8000 });
    await b.page.waitForFunction(() => LM.sv.st(LM.T('barberia')).barberos.find(x => x.id === 'kevin').agenda.some(a => a.h === '17:30' && a.app), null, { timeout: 25000 });
    sinErrores(b.page); sinErrores(c.page); await b.ctx.close(); await c.ctx.close();
  });
} catch (e) { console.error('Error general:', e); resultados.push({ ok: false, nombre: 'general', error: e.message }); }
finally {
  try { await nav?.close(); } catch (e) {}
  cerrarTodo(); srv?.close(); await cerrar();
  const ok = resultados.filter(r => r.ok).length;
  console.log(`\n${ok} de ${resultados.length} pruebas pasaron.`);
  process.exit(ok === resultados.length ? 0 : 1);
}
