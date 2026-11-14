// Mi Tienda · Servus 3.0 · pruebas de navegador de la portada con diagramación tipo marketplace
// Uso:  TEST_DATABASE_URL=postgres://usuario:clave@localhost/mitienda_test npm run test:sv3
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
const PUERTO = 8099, BASE = `http://localhost:${PUERTO}/index.html`;
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
  console.log('\nMi Tienda · Servus 3.0 · pruebas de navegador de la portada nueva\n');

  await prueba('Encabezado: franja de arriba, barra de utilidades, buscador con categoría y "Comprar por departamento" que abre el menú', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page);
    afirmar(await page.isVisible('.sv3-promo'), 'No se ve la franja de arriba');
    afirmar(await page.isVisible('.sv3-util'), 'No se ve la barra de utilidades');
    afirmar(await page.isVisible('#qCat'), 'No se ve el selector de categoría del buscador');
    afirmar(await page.locator('[data-act="sv2-foto"]').count() === 0, 'Todavía sale el botón de la cámara');
    afirmar(await page.locator('.sv-home .sv-circ, .sv3-vit').count() === 0, 'Todavía salen los círculos de categorías o las 3 vitrinas');
    afirmar(await page.locator('#qCat option').count() >= 10, 'El selector no tiene las categorías');
    afirmar(await page.isHidden('#svLinea'), 'La línea de atención no debe salir si no está configurada');
    await page.click('.sv3-dep-btn');
    afirmar(await page.isVisible('#deptMenu'), 'No abrió el menú de departamentos');
    await page.selectOption('#qCat', 'farmacia'); await page.fill('#q', 'suero'); await page.press('#q', 'Enter');
    await page.waitForFunction(() => location.hash === '#buscar');
    sinErrores(page); await ctx.close();
  });
  await prueba('Franja de pautas: al cambiar de pauta cambia el color de toda la franja y la foto difuminada de atrás', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.waitForFunction(() => document.querySelectorAll('.sv2-s').length >= 3 && getComputedStyle(document.querySelector('.sv3-banda')).getPropertyValue('--banda').trim() !== '#0D5C63', null, { timeout: 8000 });
    const fondo = () => page.evaluate(() => { const i = document.querySelector('.sv3-difu img.on'); return i && i.getAttribute('src'); });
    const activa = () => page.evaluate(() => document.querySelector('.sv2-s.on').dataset.img);
    afirmar(await fondo() === await activa(), 'La foto difuminada no es la de la pauta activa');
    const c1 = await page.evaluate(() => getComputedStyle(document.querySelector('.sv3-banda')).getPropertyValue('--banda').trim());
    await page.click('[data-act="sv2-sl"][data-d="1"]');
    await page.waitForFunction(c => getComputedStyle(document.querySelector('.sv3-banda')).getPropertyValue('--banda').trim() !== c, c1, { timeout: 5000 });
    await page.waitForFunction(() => { const i = document.querySelector('.sv3-difu img.on'); return i && i.getAttribute('src') === document.querySelector('.sv2-s.on').dataset.img; }, null, { timeout: 5000 });
    const op = await page.evaluate(() => getComputedStyle(document.querySelector('.sv3-difu img.on')).filter);
    afirmar(/blur/.test(op), 'La foto de atrás no está difuminada');
    afirmar(await page.locator('.sv-hero-b button').count() === 2, 'Faltan las 2 pautas de la derecha');
    await page.screenshot({ path: new URL('sv3-01-franja.png', CAP).pathname });
    sinErrores(page); await ctx.close();
  });
  await prueba('Caja de atajos: 6 atajos con su acción (Medios de pago abre la hoja)', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page);
    afirmar(await page.locator('.sv3-benef .sv2-at').count() === 6, 'No son 6 atajos');
    await page.click('.sv3-benef .sv2-at[data-act="medios"]');
    await page.waitForFunction(() => /Medios de pago/.test((document.getElementById('sheet') || {}).innerText || ''));
    sinErrores(page); await ctx.close();
  });
  await prueba('Súper ofertas en franja roja: reloj de horas, minutos y segundos que corre; "Ver más" lleva a las ofertas', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page);
    afirmar(await page.locator('.sv3-cd > span').count() === 3, 'El reloj no tiene 3 casillas');
    await page.waitForTimeout(1200);
    const s1 = await page.textContent('.sv3-cd > span:nth-child(3) b'); await page.waitForTimeout(1300);
    const s2 = await page.textContent('.sv3-cd > span:nth-child(3) b');
    afirmar(s1 !== s2, 'El reloj no corre: ' + s1 + ' = ' + s2);
    afirmar(await page.locator('[data-riel].ofertas .sv2-pista:not(.copia) .sv-card').count() > 3, 'El riel de ofertas está vacío');
    await page.click('.sv3-vermas'); await page.waitForFunction(() => location.hash === '#buscar');
    sinErrores(page); await ctx.close();
  });
  await prueba('Categorías con descuento: entre 2 y 4 franjas rojas con el mayor descuento real (de los productos con foto) de cada una', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page);
    const n = await page.locator('.sv3-catof-i').count();
    afirmar(n >= 2 && n <= 4, 'Hay ' + n + ' franjas de categoría');
    const ok = await page.evaluate(() => [...document.querySelectorAll('.sv3-catof-i')].map(b => {
      const cat = b.dataset.h.slice(2), d = parseInt(b.querySelector('.sv3-catof-d b').textContent, 10);
      const ds = LM.S.promos.filter(x => x.activo && x.hasta > Date.now() && LM.PR(x.prod) && LM.T(LM.PR(x.prod).t).cat === cat && (LM.PR(x.prod).fotoSrv || LM.PR(x.prod).fotoMini)).map(x => { const pr = LM.precio(LM.PR(x.prod)); return pr.old > pr.p ? Math.round((1 - pr.p / pr.old) * 100) : 0; });
      return ds.length && Math.max(...ds) === d ? '' : cat + ': sale ' + d + ', debería ' + Math.max(...ds, 0);
    }).filter(Boolean));
    afirmar(!ok.length, 'El porcentaje no es el mayor descuento de la categoría: ' + ok.join('; '));
    sinErrores(page); await ctx.close();
  });
  await prueba('Bloques por departamento: subcategorías, pauta vertical que cambia con los puntos y 6 productos', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page);
    const n = await page.locator('.sv3-dep').count();
    afirmar(n >= 3 && n <= 6, 'Hay ' + n + ' departamentos');
    const seis = await page.evaluate(() => [...document.querySelectorAll('.sv3-dep-g')].every(g => g.querySelectorAll('.sv-card').length === 6));
    afirmar(seis, 'Algún departamento no tiene 6 productos');
    const vp = page.locator('.sv3-dep').first().locator('[data-vp]');
    await vp.scrollIntoViewIfNeeded();
    await vp.locator('.sv3-vp-dots button').nth(1).click();
    afirmar(await vp.locator('.sv3-vp-s').nth(1).evaluate(e => e.classList.contains('on')), 'El punto no cambió la pauta');
    await vp.locator('.sv3-vp-s.on').click();
    await page.waitForFunction(() => /^#p-/.test(location.hash));
    await page.goto(BASE + '#inicio'); await listo(page);
    await page.locator('.sv3-dep-izq li button').first().click();
    await page.waitForFunction(() => location.hash === '#buscar');
    sinErrores(page); await ctx.close();
  });
  await prueba('Se mueven solos: estados, Súper ofertas, Top 5, Combos y Negocios que debes conocer', async () => {
    const { ctx, page } = await pagina();
    await page.addInitScript(() => { window.sv2Mover = true; });
    await page.goto(BASE + '#inicio'); await listo(page);
    afirmar(await page.locator('[data-riel]').count() === 5, 'Deberían ser 5 carruseles');
    afirmar(await page.locator('.sv3-est-band [data-riel].estados .sv2-est').count() >= 10, 'Los estados no están en el riel que se mueve');
    const x0 = await page.evaluate(() => [...document.querySelectorAll('[data-riel]')].map(r => r.scrollLeft));
    await page.waitForTimeout(1500);
    const x1 = await page.evaluate(() => [...document.querySelectorAll('[data-riel]')].map(r => r.scrollLeft));
    afirmar(x1.every((v, i) => v > x0[i]), 'No se movieron solos: ' + x0 + ' → ' + x1);
    sinErrores(page); await ctx.close();
  });
  await prueba('Vistos recientemente sale del historial y lleva al producto; "Cupones del pueblo" lleva a los cupones', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page);
    const h = await page.evaluate(() => (LM.S.hist || []).filter(id => LM.PR(id)).length);
    if (h) {
      afirmar(await page.locator('.sv3-vistos-l button').count() >= 1, 'No salen los vistos recientemente');
      await page.locator('.sv3-vistos-l button').first().click();
      await page.waitForFunction(() => /^#p-/.test(location.hash));
      await page.goto(BASE + '#inicio'); await listo(page);
    }
    await page.click('.sv3-cup .sv-btn'); await page.waitForFunction(() => location.hash === '#cupones');
    sinErrores(page); await ctx.close();
  });
  await prueba('Orden de la portada: franja → atajos → estados → Súper ofertas → Top 5 → Combos → Negocios → departamentos → Más para ti', async () => {
    const { ctx, page } = await pagina();
    await page.goto(BASE + '#inicio'); await listo(page);
    const o = await page.evaluate(() => { const y = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().top + scrollY : -1; }; return ['.sv3-banda', '.sv3-benef', '.sv3-est-band', '.sv3-ofertas', '.sv2-top5', '[data-riel].combos', '[data-riel].negocios', '.sv3-dep', '#svMas', '#negocios', '.sv3-cup'].map(y); });
    afirmar(o.every((v, i) => v >= 0 && (i === 0 || v > o[i - 1])), 'Orden: ' + o.join(' / '));
    sinErrores(page); await ctx.close();
  });
  await prueba('En celular: no se sale de lado, el buscador oculta la categoría y los departamentos quedan en una columna', async () => {
    const { ctx, page } = await pagina(true);
    await page.goto(BASE + '#inicio'); await listo(page);
    await sinDesborde(page, 'inicio');
    afirmar(await page.isHidden('#qCat'), 'En celular la categoría del buscador debe esconderse');
    afirmar(await page.isHidden('.sv3-util'), 'En celular la barra de utilidades debe esconderse');
    const col = await page.evaluate(() => getComputedStyle(document.querySelector('.sv3-dep-in')).gridTemplateColumns.split(' ').length);
    afirmar(col === 1, 'El departamento no quedó en una columna');
    await page.screenshot({ path: new URL('sv3-02-celular.png', CAP).pathname });
    for (const r of ['buscar', 't-rancho', 'cupones', 'historial']) { await page.evaluate(h => { location.hash = h; }, r); await page.waitForTimeout(700); await sinDesborde(page, r); }
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
