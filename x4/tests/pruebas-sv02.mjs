// Mi Tienda · Servus 0.2 · pruebas de navegador de lo nuevo
// Franja de pautas con color, estados, carruseles que se mueven, buscar con foto, subir al inicio, billar con partidas y
// pantalla de la mesa, pedido paso a paso del restaurante con aprobación, cliente que pide paso a paso, registro de
// negocio → superadministrador, "Mis estados" del dueño y que nada se salga de lado en el celular.
// Uso:  TEST_DATABASE_URL=postgres://usuario:clave@localhost/mitienda_test npm run test:sv2
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
const PUERTO = 8098, BASE = `http://localhost:${PUERTO}/index.html`;
const CAP = new URL('./capturas/', import.meta.url);
await mkdir(CAP, { recursive: true });
const resultados = [], ABIERTAS = [];
let nav, srv;
async function prueba(nombre, fn) {
  reiniciarLimites();
  try { await fn(); resultados.push({ ok: true, nombre }); console.log(`  ✔ ${nombre}`); }
  catch (e) {
    resultados.push({ ok: false, nombre, error: e.message.split('\n')[0] }); console.log(`  ✘ ${nombre}\n      → ${e.message.split('\n')[0]}`);
    let i = 0; for (const p of ABIERTAS) { try { if (!p.isClosed()) await p.screenshot({ path: new URL(`fallo-sv2-${resultados.length}-${i++}.png`, CAP).pathname }); } catch (x) {} }
  }
}
const afirmar = (c, m) => { if (!c) throw new Error(m); };
async function pagina(movil = false, real = false) {
  const ctx = await nav.newContext(movil ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1366, height: 900 } });
  if (!real) await ctx.addInitScript(() => { try { localStorage.setItem('hm-pruebas', '1'); localStorage.setItem('hm-tut-visto', '1'); localStorage.setItem('mt-banner-x', String(Date.now())); } catch (e) {} });
  const page = await ctx.newPage(); ABIERTAS.push(page);
  page.errores = []; page.on('pageerror', e => page.errores.push(e.message));
  return { ctx, page };
}
const listo = page => page.waitForFunction(() => window.LM && LM.api && LM.api.disponible !== null && LM.sv && LM.sv.st && LM.sv.bandaH);
const sinErrores = page => afirmar(!page.errores.length, 'Errores de JavaScript: ' + page.errores.join(' | '));
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

try {
  const c = new pg.Client({ connectionString: URL_DB }); await c.connect(); await c.query('drop schema public cascade; create schema public;'); await c.end();
  await iniciarApi({ url: URL_DB, vencimientoMs: 0 });
  await sembrar({ conOferta: false });
  srv = await iniciar(PUERTO);
  nav = await chromium.launch();
  console.log('\nMi Tienda · Servus 0.2 · pruebas de navegador\n');

  console.log('Inicio');
  await prueba('Franja de pautas: 3 pagadas con "Patrocinado"; al pasar a la siguiente cambia el color de toda la franja', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.waitForFunction(() => document.querySelectorAll('.sv2-s').length === 3 && getComputedStyle(document.querySelector('.sv2-banda')).getPropertyValue('--banda').trim() !== '#0D5C63', null, { timeout: 8000 });
    afirmar(await page.locator('.sv2-s .sv2-pat').count() === 3, 'Faltan las etiquetas "Patrocinado"');
    const c1 = await page.evaluate(() => getComputedStyle(document.querySelector('.sv2-banda')).getPropertyValue('--banda').trim());
    await page.click('[data-act="sv2-sl"][data-d="1"]');
    await page.waitForFunction(c => getComputedStyle(document.querySelector('.sv2-banda')).getPropertyValue('--banda').trim() !== c, c1, { timeout: 5000 });
    afirmar(await page.locator('.sv2-at').count() === 6, 'Faltan las tarjetas de atajos encima del color');
    await page.screenshot({ path: new URL('sv2-01-franja.png', CAP).pathname });
    sinErrores(page); await ctx.close();
  });
  await prueba('Estados: el círculo del negocio abre sus estados (mínimo 3), avanza y el botón lleva a la tienda', async () => {
    const { ctx, page } = await pagina(true);
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.click('.sv2-est[data-t="rancho"]');
    await page.waitForSelector('#sv2Visor .sv2-v-barras');
    afirmar(await page.locator('#sv2Visor .sv2-v-barras i').count() >= 3, 'El negocio tiene menos de 3 estados');
    await page.screenshot({ path: new URL('sv2-02-estado.png', CAP).pathname });
    await page.click('[data-act="sv2-est-sig"]'); await page.waitForTimeout(300);
    afirmar(await page.evaluate(() => document.querySelectorAll('.sv2-v-barras b')[0].style.width === '100%'), 'No avanzó al siguiente estado');
    await page.click('[data-act="sv2-est-ant"]'); await page.waitForTimeout(200);
    await page.click('[data-act="sv2-est-cta"]');
    await page.waitForFunction(() => location.hash === '#t-rancho');
    afirmar(await page.locator('#sv2Visor').count() === 0, 'El visor no se cerró');
    sinErrores(page); await ctx.close();
  });
  await prueba('Súper ofertas, Top 5, Combos y Negocios que debes conocer se mueven solos y se detienen con el mouse', async () => {
    const { ctx, page } = await pagina();
    await page.addInitScript(() => { window.sv2Mover = true; });
    await page.goto(BASE + '#inicio'); await listo(page);
    afirmar(await page.locator('[data-riel]').count() === 5, 'Deberían ser 5 carruseles (con los estados de Servus 3.0)');
    afirmar(await page.locator('.sv2-top5 .sv2-pista:not(.copia) .sv-top-i').count() === 5, 'El Top 5 no tiene 5 negocios');
    const x0 = await page.evaluate(() => [...document.querySelectorAll('[data-riel]')].map(r => r.scrollLeft));
    await page.waitForTimeout(1500);
    const x1 = await page.evaluate(() => [...document.querySelectorAll('[data-riel]')].map(r => r.scrollLeft));
    afirmar(x1.every((v, i) => v > x0[i]), 'No se movieron solos: ' + x0 + ' → ' + x1);
    await page.hover('[data-riel].ofertas'); await page.waitForTimeout(300);
    const a = await page.evaluate(() => document.querySelector('[data-riel].ofertas').scrollLeft); await page.waitForTimeout(800);
    const b = await page.evaluate(() => document.querySelector('[data-riel].ofertas').scrollLeft);
    afirmar(a === b, 'No se detuvo con el mouse encima');
    sinErrores(page); await ctx.close();
  });
  await prueba('El buscador tiene el micrófono y ya no tiene la cámara (Servus 3.0); el botón de subir al inicio funciona', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page);
    afirmar(await page.locator('form.search [data-act="sv2-voz"]').count() === 1, 'Falta el micrófono del buscador');
    afirmar(await page.locator('[data-act="sv2-foto"]').count() === 0, 'Todavía sale el botón de buscar con la cámara');
    await page.evaluate(() => scrollTo(0, 3000)); await page.waitForSelector('#sv2Arriba.on');
    await page.click('#sv2Arriba'); await page.waitForFunction(() => scrollY < 5, null, { timeout: 4000 });
    sinErrores(page); await ctx.close();
  });

  console.log('Billar');
  await prueba('La mesera anota jugadores y apuesta; "perdió" suma la cerveza; la pantalla de la mesa lo muestra y María se vincula con el QR', async () => {
    const m = await pagina(), tv = await pagina(), cl = await pagina(true);
    await entrarComo(m.page, 'billar-mesera'); await m.page.evaluate(() => { location.hash = 'panel-atencion'; }); await m.page.waitForSelector('.sv-mesas-b');
    await m.page.click('[data-act="sv-bi-sel"][data-id="1"]');
    await m.page.click('[data-act="sv2-bini"]');
    await m.page.click('[data-act="sv2-bz"][data-v="Bola 9"]'); await m.page.click('[data-act="sv2-bpaso"][data-d="1"]');
    await m.page.fill('#svJ0', 'El Mono'); await m.page.fill('#svJ1', 'Pedro');
    await m.page.click('[data-act="sv2-bpaso"][data-d="1"]'); await m.page.click('[data-act="sv2-bq"][data-d="1"]');
    await m.page.click('[data-act="sv2-bcrear"]');
    await m.page.click('[data-act="sv2-perdio"][data-v="j:Pedro"]');
    afirmar((await m.page.textContent('.sv-det')).includes('apuesta de Pedro'), 'La apuesta no quedó en la cuenta');
    await m.page.waitForTimeout(1500); // sube al servidor
    await tv.page.goto(BASE + '#marcador-billar-1'); await tv.page.waitForSelector('.sv2-tv-c', { timeout: 10000 });
    const t = await tv.page.textContent('.sv2-tv');
    afirmar(t.includes('El Mono') && t.includes('Pedro') && t.includes('Bola 9') && /Debe\s*2\s*Águila/.test(t), 'La pantalla no muestra el marcador: ' + t.slice(0, 200));
    afirmar(!/\$\s?\d/.test(t), 'La pantalla muestra plata');
    await tv.page.screenshot({ path: new URL('sv2-03-pantalla-mesa.png', CAP).pathname });
    const link = await m.page.evaluate(() => { const m = LM.sv.st(LM.T('billar')).mesas.find(x => x.id === 1); return '#billar-billar-1-' + m.partida.codigo; });
    await entrarComo(cl.page, 'maria');
    await cl.page.evaluate(h => { location.hash = h; }, link.slice(1)); await cl.page.waitForSelector('[data-act="sv2-unirme"]');
    await cl.page.click('[data-act="sv2-unirme"][data-ix="0"]'); await cl.page.waitForSelector('.sv2-ok');
    await m.page.waitForTimeout(500); await m.page.evaluate(() => LM.sv.at.traer('billar', true)); await m.page.waitForTimeout(1200);
    await m.page.click('[data-act="sv2-perdio"][data-v="j:El Mono"]'); await m.page.waitForTimeout(1500);
    await tv.page.waitForFunction(() => /perdió\s*El Mono/.test(document.body.innerText), null, { timeout: 10000 });
    await cl.page.evaluate(() => { location.hash = 'mis-partidas'; }); await cl.page.waitForSelector('.sv2-mp-n');
    await cl.page.waitForFunction(() => /Mesa abierta ahora/.test(document.body.innerText) && /Perdiste/.test(document.body.innerText), null, { timeout: 20000 });
    sinErrores(m.page); sinErrores(tv.page); sinErrores(cl.page); await m.ctx.close(); await tv.ctx.close(); await cl.ctx.close();
  });

  console.log('Restaurante');
  await prueba('La mesera toma el pedido paso a paso con vueltas; el dueño lo envía a cocina; el ticket abre con su QR', async () => {
    const m = await pagina(), d = await pagina(), cl = await pagina(true);
    await entrarComo(m.page, 'rancho-mesera'); await m.page.waitForSelector('.sv-mr');
    await m.page.click('[data-act="sv-re-mesa"][data-id="6"]'); await m.page.click('[data-act="sv2-pasos-mesa"]');
    await m.page.click('.sv2-cats button:text-is("Asados")'); await m.page.click('.sv2-plato:has-text("Asado Especial") button.mas'); await m.page.click('.sv2-plato:has-text("Asado Especial") button.mas');
    await m.page.click('.sv2-cats button:text-is("Bebidas")'); await m.page.click('.sv2-plato:has-text("Gaseosa 400 ml") button.mas');
    await m.page.click('.sv2-cats button:text-is("Resumen")');
    const resumen = await m.page.textContent('.sv2-tk');
    afirmar(resumen.includes('Mesa 6') && resumen.includes('Asado Especial') && resumen.includes('$53.000'), 'El resumen no cuadra: ' + resumen.slice(0, 160));
    await m.page.click('[data-act="sv2-paga"][data-v="100000"]');
    afirmar((await m.page.textContent('.sv2-out')).includes('$47.000'), 'No calculó las vueltas de $100.000');
    await m.page.click('[data-act="sv2-rsenviar"]'); await m.page.waitForSelector('.sv2-tk-qr');
    const tk = await m.page.evaluate(() => { const k = LM.sv.st(LM.T('rancho')); const t = k.tickets[k.tickets.length - 1]; return { num: t.num, cod: t.codigo, recibe: t.recibe }; });
    afirmar(tk.recibe === 100000, 'El ticket no guardó con cuánto pagó');
    await m.page.click('[data-act="cerrar-render"]');
    afirmar((await m.page.textContent('#app')).includes('por aprobar'), 'La mesera no ve que espera aprobación');
    afirmar(await m.page.locator('[data-act="sv2-aprobar"]').count() === 0, 'La mesera no debe poder aprobar');
    await m.page.waitForTimeout(1500);
    await entrarComo(d.page, 'rancho'); await d.page.evaluate(() => { location.hash = 'panel-atencion'; });
    await d.page.waitForSelector('[data-act="sv2-aprobar"][data-n="' + tk.num + '"]', { timeout: 20000 });
    await d.page.click('[data-act="sv2-aprobar"][data-n="' + tk.num + '"]');
    afirmar(await d.page.evaluate(() => LM.sv.st(LM.T('rancho')).mesas.find(x => x.id === 6).items.every(i => i.cocina === 'pend')), 'No pasó a la cocina');
    await d.page.waitForTimeout(1500);
    await cl.page.goto(BASE + '#tk-rancho-' + tk.num + '-' + tk.cod); await cl.page.waitForSelector('.sv2-tk', { timeout: 10000 });
    const tc = await cl.page.textContent('.sv2-tk');
    afirmar(tc.includes('$53.000') && tc.includes('en cocina') && tc.includes('$47.000'), 'El cliente no ve el ticket: ' + tc.slice(0, 200));
    sinErrores(m.page); sinErrores(d.page); sinErrores(cl.page); await m.ctx.close(); await d.ctx.close(); await cl.ctx.close();
  });
  await prueba('El cliente arma el pedido paso a paso en la tienda, escoge cómo paga y hace el pedido', async () => {
    const { ctx, page } = await pagina(true);
    await entrarComo(page, 'maria'); await page.evaluate(() => { location.hash = 't-rancho'; });
    await page.click('[data-act="sv2-pasos-cli"]');
    await page.click('.sv2-cats button:text-is("Almuerzos")'); await page.click('.sv2-plato:has-text("Sancocho de gallina") button.mas');
    await page.click('.sv2-cats button:text-is("Resumen")');
    await page.click('[data-act="sv2-rsent"][data-v="recoger"]');
    await page.click('[data-act="sv2-rspago"][data-v="transferencia"]');
    afirmar(await page.locator('.sv2-pago-qr').count() === 1, 'No muestra el QR de pago');
    const antes = await page.evaluate(() => LM.S.orders.length);
    await page.click('[data-act="sv2-rsenviar"]');
    await page.waitForFunction(n => LM.S.orders.length === n + 1, antes, { timeout: 8000 });
    const o = await page.evaluate(() => { const o = LM.S.orders[LM.S.orders.length - 1]; return o.modo + '/' + o.pago + '/' + o.items.map(i => i.id).join(); });
    afirmar(o === 'recoger/nequi/sancocho', 'El pedido no quedó como se escogió: ' + o);
    sinErrores(page); await ctx.close();
  });

  console.log('Negocios nuevos y superadministrador');
  await prueba('Un negocio llena "Registra tu negocio"; el superadministrador lo ve, lo aprueba y recibe la clave temporal', async () => {
    const n = await pagina(true), s = await pagina();
    await n.page.goto(BASE + '#inicio'); await listo(n.page);
    await n.page.click('#svReg [data-h="registra-negocio"], .sv-unete [data-h="registra-negocio"]').catch(async () => { await n.page.evaluate(() => { location.hash = 'registra-negocio'; }); });
    await n.page.waitForSelector('form[data-form="sv2-registro"]');
    await n.page.fill('#rgN', 'Panadería El Trigal'); await n.page.selectOption('#rgC', 'tienda'); await n.page.fill('#rgO', 'Marta Díaz'); await n.page.fill('#rgT', '3156667788');
    await n.page.check('input[name="acepta"]'); await n.page.click('form[data-form="sv2-registro"] [type=submit]');
    await n.page.waitForFunction(() => /Recibimos tu solicitud/.test(document.body.innerText));
    await s.page.goto(BASE + '#super'); await listo(s.page); await s.page.waitForSelector('#saU');
    await s.page.fill('#saU', 'superadmin'); await s.page.fill('#saP', '1234'); await s.page.click('form[data-form="sv2-sa-entrar"] [type=submit]');
    await s.page.waitForSelector('.sv2-kpis'); await s.page.screenshot({ path: new URL('sv2-04-superadmin.png', CAP).pathname });
    await s.page.click('[data-act="sv2-sa-tab"][data-t="solicitudes"]'); await s.page.waitForSelector('.sv2-sol:has-text("Panadería El Trigal")');
    await s.page.click('.sv2-sol:has-text("Panadería El Trigal") [data-act="sv2-sa-aprob"]');
    await s.page.click('form[data-form="sv2-sa-aprob"] [type=submit]');
    await s.page.waitForFunction(() => /clave temporal/.test(document.querySelector('#sheet').innerText), null, { timeout: 8000 });
    afirmar(await s.page.locator('#sheet a[href*="wa.me/573156667788"]').count() === 1, 'Falta el botón para mandar los datos por WhatsApp');
    sinErrores(n.page); sinErrores(s.page); await n.ctx.close(); await s.ctx.close();
  });
  await prueba('El superadministrador crea una 4.ª pauta y sale en el inicio; la 6.ª se rechaza por el máximo de 5', async () => {
    const { ctx, page } = await pagina();
    await entrarComo(page, 'superadmin'); await page.evaluate(() => { location.hash = 'super'; }); await page.waitForSelector('.sv2-kpis');
    const crear = async titulo => {
      await page.click('[data-act="sv2-sa-tab"][data-t="pautas"]'); await page.click('[data-act="sv2-sa-pnueva"]');
      await page.selectOption('#ptN', 'pescadores'); await page.fill('#ptT', titulo); await page.click('.sv2-gal label:nth-child(9)');
      await page.click('form[data-form="sv2-sa-pguardar"] [type=submit]'); await page.waitForTimeout(900);
    };
    await crear('Bocachico fresco del día'); await crear('Mojarra de la ciénaga');
    afirmar((await page.textContent('.sv2-cupos')).includes('5 de 5'), 'No quedaron 5 al aire');
    await crear('Una más de la cuenta');
    afirmar(/ya hay 5 pautas/.test(await page.textContent('#toast')), 'No avisó que se llenaron los cupos');
    await page.evaluate(() => { location.hash = 'inicio'; }); await page.waitForSelector('.sv2-s');
    await page.waitForFunction(() => document.querySelectorAll('.sv2-s').length === 5, null, { timeout: 70000 }).catch(async () => { await page.reload(); await page.waitForFunction(() => document.querySelectorAll('.sv2-s').length === 5, null, { timeout: 8000 }); });
    afirmar((await page.textContent('.sv2-sl')).includes('Bocachico fresco del día'), 'La pauta nueva no sale en el inicio');
    sinErrores(page); await ctx.close();
  });
  await prueba('"Mis estados": el dueño sube una foto con texto y botón, y sale en el inicio', async () => {
    const d = await pagina(), c = await pagina(true);
    await entrarComo(d.page, 'granja'); await d.page.evaluate(() => { location.hash = 'panel-estados'; }); await d.page.waitForSelector('form[data-form="sv2-est-subir"]');
    const jpg = await d.page.evaluate(() => { const c = document.createElement('canvas'); c.width = 600; c.height = 800; const k = c.getContext('2d'); k.fillStyle = '#C6F432'; k.fillRect(0, 0, 600, 800); return c.toDataURL('image/jpeg').split(',')[1]; });
    await d.page.setInputFiles('#sv2EstF', { name: 'estado.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(jpg, 'base64') });
    await d.page.waitForSelector('.sv2-drop img'); await d.page.fill('#sv2EstT', 'Huevos criollos recién recogidos');
    await d.page.click('form[data-form="sv2-est-subir"] [type=submit]');
    await d.page.waitForFunction(() => /Publicados \(1 de 10\)/.test(document.body.innerText), null, { timeout: 8000 });
    await c.page.goto(BASE + '#inicio'); await listo(c.page); await c.page.waitForTimeout(800);
    await c.page.evaluate(() => { LM.rerender(); }); await c.page.waitForTimeout(600);
    await c.page.click('.sv2-est[data-t="granja"]'); await c.page.waitForSelector('#sv2Visor .sv2-v-f');
    afirmar((await c.page.textContent('#sv2Visor')).includes('Huevos criollos recién recogidos'), 'El estado nuevo no sale');
    sinErrores(d.page); sinErrores(c.page); await d.ctx.close(); await c.ctx.close();
  });
  await prueba('En celular no se sale de lado: inicio, registro, superadministrador, pantalla de la mesa y Mis partidas', async () => {
    const { ctx, page } = await pagina(true);
    await entrarComo(page, 'superadmin');
    for (const r of ['inicio', 'registra-negocio', 'super', 'marcador-billar-1', 'mis-partidas', 't-rancho']) { await page.evaluate(h => { location.hash = h; }, r); await page.waitForTimeout(900); await sinDesborde(page, r); }
    sinErrores(page); await ctx.close();
  });
} catch (e) { console.error('Error general:', e); resultados.push({ ok: false, nombre: 'general', error: e.message }); }
finally {
  try { await nav?.close(); } catch (e) {}
  cerrarTodo(); srv?.close(); await cerrar();
  const ok = resultados.filter(r => r.ok).length;
  console.log(`\n${ok} de ${resultados.length} pruebas pasaron.`);
  process.exit(ok === resultados.length ? 0 : 1);
}
