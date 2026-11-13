/* Mi Tienda · Servus 0.1 · CÓMO ATIENDE CADA NEGOCIO
   Lo común es igual para todos (caja, pedidos, domicilios, gastos, balance, productos, inventario, promociones,
   clientes y fiado, reseñas y PQR, empleados, QR y asistencia, configuración). Lo que cambia es UNA pantalla:
   la de atención, en el mismo lugar del menú. Aquí están las 14, con datos de ejemplo para que no se vean en
   blanco, más la caja del turno (cajera), la cocina (comandas) y lo que el cliente hace desde la tienda.
   Con el servidor, el estado de cada pantalla se comparte entre los celulares del equipo (api/sv01.mjs). */
(function () {
  'use strict';
  const LM = window.LM, E = LM.EXT, A = LM.A, F = LM.F, SV = LM.sv;
  const { esc, pesos, toast, sheet, closeModal } = LM;
  const ic = SV.ic, I = LM.ic;
  const S = () => LM.S;
  const ses = () => LM.S.session;
  const API = () => LM.api || { disponible: false };
  const FOTO = SV.foto;
  const MIN = 60e3, H = 3600e3;
  const hora = ts => LM.hora(ts);
  const r100 = v => Math.round(v / 100) * 100;
  const tienda = () => LM.T(ses().t);
  const nombreYo = () => { const s = ses(), N = LM.NEG(s.t), e = N.emp.find(x => x.u === s.u); return (e && e.n) || s.nombre || s.u; };
  const vender = (t, desc, v, m, extra) => { const N = LM.NEG(t.id); N.ventas.push(Object.assign({ h: LM.hora(), d: desc, v, m: m || 'efectivo', o: 'mostrador', por: ses().u, ts: Date.now() }, extra || {})); LM.logN(t.id, 'Venta: ' + desc + ' ' + pesos(v)); };
  const gastar = (t, d, v) => { const N = LM.NEG(t.id); N.gastos.push({ h: LM.hora(), d, v, por: ses().u }); LM.logN(t.id, 'Gasto: ' + d + ' ' + pesos(v)); };
  const bajar = (id, q) => { const p = LM.PR(id); if (p && typeof p.stock === 'number') p.stock = Math.max(0, Math.round((p.stock - q) * 100) / 100); };
  const PAGOS = [['efectivo', 'Efectivo'], ['nequi', 'Nequi'], ['daviplata', 'Daviplata'], ['breb', 'Bre-B'], ['banco', 'Bancolombia'], ['fiado', 'Fiado']];
  const pagoBtns = (sel, act) => '<div class="sv-pagos">' + PAGOS.map(p => '<button type="button" class="' + (sel === p[0] ? 'on' : '') + '" data-act="' + act + '" data-m="' + p[0] + '">' + p[1] + '</button>').join('') + '</div>';
  const pagoSel = () => '<div class="campo"><label for="svPg">Forma de pago</label><select id="svPg" name="m">' + PAGOS.map(p => '<option value="' + p[0] + '">' + p[1] + '</option>').join('') + '</select></div>';
  const av = (n, foto, cls) => foto ? '<img class="sv-av ' + (cls || '') + '" src="' + esc(foto) + '" alt="">' : '<span class="sv-av ' + (cls || '') + '">' + esc(String(n || '?').split(' ').map(x => x[0]).slice(0, 2).join('')) + '</span>';
  const hoyISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const enDias = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const fechaC = iso => { const d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', ''); };
  const h12 = hm => { let [h, m] = hm.split(':').map(Number); const pm = h >= 12; h = h % 12 || 12; return h + ':' + String(m).padStart(2, '0') + (pm ? ' p. m.' : ' a. m.'); };
  const durTxt = ms => { const m = Math.max(0, Math.floor(ms / MIN)); return m >= 60 ? Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') : m + ' min'; };
  const reloj = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 3600) + ':' + String(Math.floor(s / 60) % 60).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const cab = (h, p, btn) => '<div class="sv-cab"><div><h1>' + h + '</h1><p>' + p + '</p></div><div class="sv-cab-b">' + (btn || '') + '</div></div>';
  const kpis = l => '<div class="sv-kpis">' + l.map(k => '<div class="sv-kpi"><small>' + ic(k[0]) + esc(k[1]) + '</small><b class="num ' + (k[4] || '') + '">' + k[2] + '</b><span>' + k[3] + '</span></div>').join('') + '</div>';
  const caja = (h, cuerpo, btn, cls) => '<section class="sv-caja ' + (cls || '') + '">' + (h ? '<div class="sv-caja-h"><h2>' + h + '</h2>' + (btn || '') + '</div>' : '') + cuerpo + '</section>';
  const btn = (txt, act, extra, cls) => '<button class="sv-btn ' + (cls || 'teal') + '" type="button" data-act="' + act + '"' + (extra || '') + '>' + txt + '</button>';
  const pill = (txt, c) => '<span class="sv-pill ' + (c || '') + '">' + txt + '</span>';
  const prodsDe = tid => S().prods.filter(p => p.t === tid);

  /* ======================= estado de cada pantalla + sincronización ======================= */
  const KEY = { billar: 'billar', belleza: 'barberia', tienda: 'tienda', papeleria: 'tienda', campo: 'tienda', farmacia: 'drogueria', taller: 'taller', mayorista: 'granero', deposito: 'ferreteria',
    ropa: 'moda', pesca: 'pesca', lacteos: 'quesera', distribuidora: 'ruta', agro: 'agro', granja: 'granja', comida: 'resto', rapida: 'resto' };
  const keyDe = t => KEY[t.cat] || 'tienda';
  const MENU = { billar: ['billar', 'Mesas de billar', 'Cada mesa cobra tiempo + consumo en una sola cuenta'], barberia: ['tijera', 'Turnos y fila', 'Agenda por barbero + la fila de los que llegan sin turno'],
    tienda: ['scan', 'Mostrador', 'Venta rápida por unidad, libra o paquete · fiado en el cuaderno'], drogueria: ['farmacia', 'Mostrador y fórmulas', 'Venta por tableta, blíster o caja · fórmulas médicas · vencimientos'],
    taller: ['llave', 'Órdenes de taller', 'Cada moto que entra tiene su orden: diagnóstico, cotización, aprobación y entrega'], granero: ['camion', 'Venta por mayor', 'Precios por cantidad, pedidos de tenderos, crédito y despacho'],
    ferreteria: ['regla', 'Venta por medida', 'Venta por metro, kilo, bulto o galón · cotizaciones para obra'], moda: ['camisa', 'Tallas y separados', 'Cada prenda por color y talla · plan separe con abonos · cambios'],
    pesca: ['pescado', 'Acopio y nevera', 'Se le compra al pescador, se vende por libra y se liquida cada semana'], quesera: ['gota', 'Producción y encargos', 'Leche que entra, queso que sale, venta por libra y encargos'],
    ruta: ['mapa', 'Rutas y preventa', 'Vendedores visitan tiendas, toman pedidos y cobran cartera'], agro: ['hoja', 'Mostrador y visitas', 'Venta de insumos por bulto · visitas a fincas · historial por finca'],
    granja: ['huevo', 'Producción y encargos', 'Huevos por galpón, pollos listos y encargos con fecha'], resto: ['mesa', 'Mesas', 'Mesas con QR, comandas a cocina y la cuenta de cada mesa'] };
  const SEED = {};
  function st(t) {
    const N = LM.NEG(t.id); N.sv = N.sv || {};
    const k = keyDe(t);
    if (!N.sv[k]) { N.sv[k] = SEED[k](t); LM.save(); }
    return N.sv[k];
  }
  SV.st = st;
  // Con servidor: el equipo comparte el estado. Se trae cada 12 s mientras la pantalla está abierta.
  const SY = { t: {}, ver: {}, cola: {}, trabajando: {} };
  const conectado = tid => API().disponible && API().yo && API().esDeNegocio && API().esDeNegocio(tid);
  async function traer(tid, forzar) {
    if (!conectado(tid) || SY.trabajando[tid]) return;
    if (!forzar && Date.now() - (SY.t[tid] || 0) < 12000) return;
    SY.t[tid] = Date.now(); SY.trabajando[tid] = true;
    try {
      const r = await API().get('/api/negocio/' + tid + '/sv');
      const N = LM.NEG(tid);
      if (r.version > 0 && r.datos) { N.sv = Object.assign({}, N.sv || {}, r.datos); SY.ver[tid] = r.version; LM.save(); if (enPanel()) repintar(); }
      else { SY.ver[tid] = 0; await subir(tid); }
    } catch (e) {}
    SY.trabajando[tid] = false;
  }
  async function subir(tid) {
    if (!conectado(tid)) return;
    const N = LM.NEG(tid);
    try { const r = await API().put('/api/negocio/' + tid + '/sv', { datos: N.sv || {}, version: SY.ver[tid] || 0 }); SY.ver[tid] = r.version; }
    catch (e) {
      if (e.status === 409 && e.datos && e.datos.actual) { N.sv = e.datos.actual.datos || {}; SY.ver[tid] = e.datos.actual.version; LM.save(); repintar(); toast('Otra persona del equipo cambió algo al mismo tiempo. Revisa y repite lo último.'); }
    }
  }
  function guardar(t) { LM.save(); clearTimeout(SY.cola[t.id]); SY.cola[t.id] = setTimeout(() => subir(t.id), 400); }
  SV.guardarSt = guardar;
  const enPanel = () => /^panel/.test((location.hash || '').slice(1));
  function repintar() { if (!enPanel() || document.querySelector('#modal:not([hidden])')) return; const y = scrollY; LM.render(); scrollTo(0, y); }
  setInterval(() => { const s = ses(); if (s && s.t && enPanel() && /^panel-(atencion|cocina|turno)|^panel$/.test((location.hash || '').slice(1))) traer(s.t); }, 4000);
  // relojes en vivo (billar, cocina) sin repintar toda la pantalla
  setInterval(() => document.querySelectorAll('[data-svt]').forEach(el => { const ini = +el.dataset.svt, ex = +(el.dataset.svx || 0); el.textContent = (el.dataset.svf === 'min' ? durTxt(Date.now() - ini - ex) : reloj(Date.now() - ini - ex)); }), 1000);

  /* ============================================================================================
     1. BILLAR · mesas con reloj y consumo
     ============================================================================================ */
  SEED.billar = () => {
    const ahora = Date.now();
    const m = (id, tipo, ini, extra) => Object.assign({ id, n: 'Mesa ' + id, tipo, ini: ini ? ahora - ini : null, pausa: null, pausado: 0, jug: 2, cons: [] }, extra || {});
    return { tarifas: { Pool: 6000, Carambola: 7000 }, frac: 15, sel: 3, horasHoy: 9.5 * 60, consHoy: 112000, mesas: [
      m(1, 'Pool', 42 * MIN, { jug: 2, cons: [{ n: 'Cerveza nacional', q: 2, p: 4000 }] }), m(2, 'Pool', 0), m(3, 'Carambola', 90 * MIN + 12000, { jug: 4, cons: [{ n: 'Cerveza nacional', q: 6, p: 4000 }, { n: 'Gaseosa 400 ml', q: 2, p: 2500 }, { n: 'Maní salado', q: 1, p: 2000 }] }),
      m(4, 'Carambola', 18 * MIN, { jug: 2 }), m(5, 'Pool', 55 * MIN, { pausa: ahora - 4 * MIN, jug: 3, cons: [{ n: 'Gaseosa 400 ml', q: 3, p: 2500 }] }), m(6, 'Pool', 0),
      m(7, 'Carambola', 135 * MIN, { jug: 4, cobrar: true, cons: [{ n: 'Cerveza nacional', q: 8, p: 4000 }] }), m(8, 'Pool', 0)] };
  };
  const minJuego = m => !m.ini ? 0 : Math.max(0, (m.pausa || Date.now()) - m.ini - (m.pausado || 0));
  const valorTiempo = (b, m) => { const min = minJuego(m) / MIN, fr = Math.max(1, Math.ceil(min / b.frac)); return m.ini ? r100(fr * b.frac / 60 * (b.tarifas[m.tipo] || 6000)) : 0; };
  const consumo = m => m.cons.reduce((a, c) => a + c.q * c.p, 0);
  const estadoMesa = m => m.cobrar ? ['Por cobrar', 'rojo'] : m.pausa ? ['Pausada', 'amar'] : m.ini ? ['En juego', 'teal'] : (m.apartada && m.apartada.hasta > Date.now()) ? ['Apartada', 'lila'] : ['Libre', 'verde'];
  const mesaSVG = (ocup, tipo) => '<svg viewBox="0 0 120 64" class="sv-paño" aria-hidden="true"><rect x="2" y="2" width="116" height="60" rx="8" fill="#6b3f1f"/><rect x="10" y="10" width="100" height="44" rx="4" fill="#0f6b45"/>' +
    [[10, 10], [60, 8], [110, 10], [10, 54], [60, 56], [110, 54]].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="3.6" fill="#111"/>').join('') +
    (ocup ? '<circle cx="42" cy="32" r="4" fill="#fff"/><circle cx="72" cy="27" r="4" fill="#f5c518"/>' + (tipo === 'Carambola' ? '<circle cx="80" cy="36" r="4" fill="#d93636"/>' : '<circle cx="80" cy="36" r="4" fill="#d93636"/>') : '') + '</svg>';
  function pBillar(t) {
    const b = st(t), sel = b.mesas.find(m => m.id === b.sel) || b.mesas[0];
    const juego = b.mesas.filter(m => m.ini), pausadas = b.mesas.filter(m => m.pausa).length, cobrar = b.mesas.filter(m => m.cobrar).length;
    const horas = b.horasHoy + juego.reduce((a, m) => a + minJuego(m) / MIN, 0);
    const consMesas = juego.reduce((a, m) => a + consumo(m), 0) + b.consHoy;
    const [est, ec] = estadoMesa(sel);
    let det;
    if (sel.ini) {
      const vt = valorTiempo(b, sel), tot = vt + consumo(sel), min = minJuego(sel) / MIN;
      det = '<div class="sv-reloj-b"><div><small>Empezó ' + hora(sel.ini) + '</small><small>' + sel.jug + ' jugadores' + (sel.pausa ? ' · en pausa' : '') + '</small></div><b class="num"' + (sel.pausa ? '' : ' data-svt="' + sel.ini + '" data-svx="' + (sel.pausado || 0) + '"') + '>' + reloj(minJuego(sel)) + '</b></div>' +
        '<div class="sv-lin"><span>Tiempo de juego · ' + durTxt(minJuego(sel)) + ' × ' + pesos(b.tarifas[sel.tipo]) + '</span><b class="num">' + pesos(vt) + '</b></div>' +
        sel.cons.map((c, i) => '<div class="sv-lin"><span>' + c.q + ' × ' + esc(c.n) + '</span><b class="num">' + pesos(c.q * c.p) + '</b><button class="sv-x" type="button" data-act="sv-bi-quitar" data-i="' + i + '" aria-label="Quitar">' + I('x') + '</button></div>').join('') +
        '<div class="sv-total"><span>Cuenta</span><b class="num">' + pesos(tot) + '</b></div>' +
        '<div class="sv-2b">' + btn(I('plus') + 'Agregar consumo', 'sv-bi-cons', '', 'gris') + btn(ic('pausa2') + (sel.pausa ? 'Seguir el tiempo' : 'Pausar tiempo'), 'sv-bi-pausa', '', 'gris') + btn('Pasar a otra mesa', 'sv-bi-mover', '', 'gris') + btn('Dividir cuenta', 'sv-bi-dividir', '', 'gris') + '</div>' +
        '<div class="sv-pie">' + btn('Parar el reloj y cobrar · ' + pesos(tot), 'sv-bi-cobrar', '', 'teal xl') + '</div>';
      void min;
    } else {
      const ap = sel.apartada && sel.apartada.hasta > Date.now() ? sel.apartada : null;
      det = (ap ? '<div class="sv-aviso lila">' + I('clock') + '<span><b>Apartada por ' + esc(ap.por) + '</b> hasta las ' + hora(ap.hasta) + '. Si no llega, queda libre sola.</span></div>' : '<p class="muted">Mesa libre. Toca <b>Iniciar mesa</b> cuando lleguen los jugadores: el reloj arranca solo.</p>') +
        '<form class="sv-form" data-form="sv-bi-iniciar"><div class="campo"><label for="svBiJ">Jugadores</label><select id="svBiJ" name="j">' + [1, 2, 3, 4, 5, 6].map(n => '<option' + (n === 2 ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></div><button class="sv-btn teal xl" type="submit">' + I('play') + 'Iniciar ' + esc(sel.n) + '</button></form>' +
        (ap ? btn('Liberar la mesa', 'sv-bi-liberar', '', 'gris') : '');
    }
    return cab('Mesas de billar', MENU.billar[2], (API().disponible ? btn(I('qr') + 'Mesas con QR para jugadores', 'go', ' data-h="panel-mesas"', 'gris') : '') + btn(I('plus') + 'Iniciar mesa', 'sv-bi-libre')) +
      kpis([['grid', 'Mesas en juego', juego.length + ' de ' + b.mesas.length, pausadas + ' pausada' + (pausadas === 1 ? '' : 's') + ' · ' + cobrar + ' por cobrar', 'teal'], ['clock', 'Horas vendidas hoy', Math.floor(horas / 60) + ' h ' + String(Math.round(horas % 60)).padStart(2, '0'), pesos(r100(horas / 60 * 6500)) + ' en tiempo'],
        ['cash', 'Consumo en mesas', pesos(consMesas), 'Cerveza, gaseosa, pasabocas'], ['tag', 'Tarifa por hora', pesos(b.tarifas.Pool) + ' · ' + pesos(b.tarifas.Carambola), 'Pool · Carambola', 'oro']]) +
      '<div class="sv-split"><div><div class="sv-mesas-b">' + b.mesas.map(m => { const [e, c] = estadoMesa(m); return '<button type="button" class="sv-mb' + (m.id === sel.id ? ' sel' : '') + '" data-act="sv-bi-sel" data-id="' + m.id + '">' + mesaSVG(!!m.ini, m.tipo) + '<span class="sv-mb-n"><b>' + esc(m.n) + '</b><small>' + esc(m.tipo) + '</small></span><span class="sv-mb-e">' + pill(e, c) + (m.ini ? '<b class="num"' + (m.pausa ? '' : ' data-svt="' + m.ini + '" data-svx="' + (m.pausado || 0) + '" data-svf="min"') + '>' + durTxt(minJuego(m)) + '</b>' : '') + '</span></button>'; }).join('') + '</div>' +
      '<p class="sv-nota">El reloj de cada mesa arranca al tocar <b>Iniciar</b>. Se cobra por fracciones de ' + b.frac + ' minutos. Pausar sirve cuando los jugadores salen un momento.</p>' +
      (ses().rol === 'dueno' ? '<form class="sv-form inline" data-form="sv-bi-tarifas"><label>Pool <input name="p" type="number" step="500" value="' + b.tarifas.Pool + '"></label><label>Carambola <input name="c" type="number" step="500" value="' + b.tarifas.Carambola + '"></label><label>Fracción (min) <input name="f" type="number" min="5" max="60" value="' + b.frac + '"></label><button class="sv-btn gris" type="submit">Guardar tarifas</button></form>' : '') + '</div>' +
      '<aside class="sv-det"><div class="sv-det-h"><h2>' + esc(sel.n) + ' · ' + esc(sel.tipo) + '</h2>' + pill(est, ec) + '</div>' + det + '</aside></div>';
  }
  const bi = () => st(tienda());
  const selMesa = () => { const b = bi(); return b.mesas.find(m => m.id === b.sel); };
  A['sv-bi-sel'] = el => { bi().sel = +el.dataset.id; guardar(tienda()); LM.rerender(); };
  A['sv-bi-libre'] = () => { const b = bi(), m = b.mesas.find(x => !x.ini); if (!m) { toast('No hay mesas libres.'); return; } b.sel = m.id; guardar(tienda()); LM.rerender(); setTimeout(() => { const s = document.getElementById('svBiJ'); if (s) s.focus(); }, 50); };
  F['sv-bi-iniciar'] = (f, d) => { const m = selMesa(); m.ini = Date.now(); m.pausa = null; m.pausado = 0; m.jug = +d.get('j') || 2; m.cons = []; m.cobrar = false; m.apartada = null; LM.logN(tienda().id, 'Inició ' + m.n); guardar(tienda()); LM.rerender(); toast(m.n + ': el reloj arrancó.'); };
  A['sv-bi-liberar'] = () => { const m = selMesa(); m.apartada = null; guardar(tienda()); LM.rerender(); };
  A['sv-bi-pausa'] = () => { const m = selMesa(); if (m.pausa) { m.pausado = (m.pausado || 0) + (Date.now() - m.pausa); m.pausa = null; toast('El tiempo sigue corriendo.'); } else { m.pausa = Date.now(); toast('Tiempo en pausa.'); } guardar(tienda()); LM.rerender(); };
  A['sv-bi-quitar'] = el => { const m = selMesa(); m.cons.splice(+el.dataset.i, 1); guardar(tienda()); LM.rerender(); };
  A['sv-bi-cons'] = () => {
    const t = tienda(), extras = [['Cerveza nacional', 4000], ['Gaseosa 400 ml', 2500], ['Maní salado', 2000], ['Agua', 2000]].concat(prodsDe(t.id).filter(p => p.sub !== 'Mesas').map(p => [p.n, LM.precio(p).p]));
    const vistos = {}; const l = extras.filter(x => !vistos[x[0]] && (vistos[x[0]] = 1));
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(selMesa().n) + '</small><h3>Agregar consumo</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><div class="sh-b sv-lista-sel">' +
      l.map(x => '<button type="button" data-act="sv-bi-cons1" data-n="' + esc(x[0]) + '" data-p="' + x[1] + '"><span>' + esc(x[0]) + '</span><b class="num">' + pesos(x[1]) + '</b>' + I('plus') + '</button>').join('') + '</div>');
  };
  A['sv-bi-cons1'] = el => { const m = selMesa(), n = el.dataset.n, p = +el.dataset.p, c = m.cons.find(x => x.n === n); if (c) c.q++; else m.cons.push({ n, q: 1, p }); closeModal(); guardar(tienda()); toast('1 × ' + n + ' en la cuenta de ' + m.n); LM.rerender(); };
  A['sv-bi-mover'] = () => {
    const libres = bi().mesas.filter(m => !m.ini);
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(selMesa().n) + '</small><h3>Pasar a otra mesa</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><div class="sh-b sv-lista-sel">' +
      (libres.length ? libres.map(m => '<button type="button" data-act="sv-bi-mover1" data-id="' + m.id + '"><span>' + esc(m.n) + ' · ' + esc(m.tipo) + '</span>' + I('chevr') + '</button>').join('') : '<p class="muted">No hay mesas libres.</p>') + '</div>');
  };
  A['sv-bi-mover1'] = el => { const b = bi(), a = selMesa(), d = b.mesas.find(m => m.id === +el.dataset.id); ['ini', 'pausa', 'pausado', 'jug', 'cons'].forEach(k => { d[k] = a[k]; }); a.ini = null; a.pausa = null; a.pausado = 0; a.cons = []; a.cobrar = false; b.sel = d.id; closeModal(); guardar(tienda()); LM.rerender(); toast('La cuenta pasó a ' + d.n + '.'); };
  A['sv-bi-dividir'] = () => {
    const b = bi(), m = selMesa(), tot = valorTiempo(b, m) + consumo(m);
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(m.n) + '</small><h3>Dividir la cuenta</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><div class="sh-b">' +
      [2, 3, 4, 5, 6].map(n => '<div class="sv-lin"><span>Entre ' + n + ' jugadores</span><b class="num">' + pesos(Math.ceil(tot / n / 100) * 100) + ' c/u</b></div>').join('') + '<p class="muted">Cada uno paga su parte y la cuenta se cierra completa con "Parar el reloj y cobrar".</p></div>');
  };
  A['sv-bi-cobrar'] = () => {
    const b = bi(), m = selMesa(), tot = valorTiempo(b, m) + consumo(m);
    if (!m.pausa) m.pausa = Date.now(); m.cobrar = true; guardar(tienda());
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(m.n) + ' · ' + durTxt(minJuego(m)) + '</small><h3>Cobrar ' + pesos(tot) + '</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-bi-pagar">' + pagoSel() + '<button class="sv-btn teal xl" type="submit">' + I('check') + 'Cobrado · liberar la mesa</button></form>');
  };
  F['sv-bi-pagar'] = (f, d) => {
    const t = tienda(), b = bi(), m = selMesa(), vt = valorTiempo(b, m), cs = consumo(m);
    vender(t, m.n + ' · ' + durTxt(minJuego(m)) + ' + consumo', vt + cs, d.get('m'));
    b.horasHoy += minJuego(m) / MIN; b.consHoy += cs;
    Object.assign(m, { ini: null, pausa: null, pausado: 0, cons: [], cobrar: false, jug: 2 });
    closeModal(); guardar(t); LM.rerender(); toast('Cobrado ' + pesos(vt + cs) + '. ' + m.n + ' quedó libre.');
  };
  F['sv-bi-tarifas'] = (f, d) => { const b = bi(); b.tarifas = { Pool: +d.get('p') || 6000, Carambola: +d.get('c') || 7000 }; b.frac = Math.max(5, +d.get('f') || 15); guardar(tienda()); LM.rerender(); toast('Tarifas guardadas'); };

  /* ============================================================================================
     2. BARBERÍA · agenda por barbero y fila
     ============================================================================================ */
  SEED.barberia = () => {
    const hoy = hoyISO(), man = enDias(1);
    const a = (h, cli, servicio, extra) => Object.assign({ dia: hoy, h, cli, servicio, app: false, estado: 'turno' }, extra || {});
    return { dia: 'hoy', servicios: [{ id: 'corte', n: 'Corte', min: 30, p: 12000 }, { id: 'barba', n: 'Barba', min: 15, p: 6000 }, { id: 'corte-barba', n: 'Corte + barba', min: 40, p: 16000 }, { id: 'nino', n: 'Corte niño', min: 25, p: 10000 }, { id: 'cejas', n: 'Cejas y línea', min: 10, p: 4000 }],
      barberos: [{ id: 'jhon', n: 'Jhon', foto: 'r-jhon', agenda: [a('14:00', 'Luis Pacheco', 'corte-barba', { app: true, estado: 'listo' }), a('14:30', 'Andrés', 'corte', { estado: 'silla' }), a('15:30', 'Camilo R.', 'corte', { app: true }), a('16:00', 'Wilmer', 'corte-barba'), a('10:00', 'Óscar', 'corte', { dia: man })] },
        { id: 'kevin', n: 'Kevin', foto: '', agenda: [a('14:00', 'Jhoan', 'barba', { estado: 'listo' }), a('15:00', 'Sebastián', 'nino', { app: true }), a('16:30', 'Duván', 'corte')] }],
      fila: [{ n: 'Brayan M.', servicio: 'corte', llego: Date.now() - 22 * MIN }, { n: 'Yeferson', servicio: 'corte-barba', llego: Date.now() - 13 * MIN }, { n: 'Luis A.', servicio: 'barba', llego: Date.now() - 8 * MIN }],
      atendidos: 12, vendido: 152000 };
  };
  const SLOTS = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
  const minDe = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
  function pBarberia(t) {
    const b = st(t), dia = b.dia === 'man' ? enDias(1) : hoyISO(), sv = id => b.servicios.find(s => s.id === id) || b.servicios[0];
    const turnosApp = b.barberos.reduce((a, x) => a + x.agenda.filter(e => e.dia === hoyISO() && e.app).length, 0);
    const espera = (i) => (i + 1) * 12 + 10;
    const col = x => {
      const ag = x.agenda.filter(e => e.dia === dia);
      const ocupado = ag.some(e => e.estado === 'silla');
      const bloques = ag.map(e => { const s = sv(e.servicio), top = (minDe(e.h) - 840) / 30 * 54, alto = Math.max(1, s.min / 30) * 54 - 4; if (minDe(e.h) < 840) return ''; return '<button type="button" class="sv-ag-b ' + e.estado + (e.app ? ' app' : '') + '" style="top:' + top + 'px;height:' + alto + 'px" data-act="sv-ba-turno" data-b="' + x.id + '" data-h="' + e.h + '"><b>' + esc(e.cli) + (e.estado === 'silla' ? ' (en silla)' : '') + '</b><small>' + esc(s.n) + (e.app ? ' · por Mi Tienda' : e.estado === 'silla' ? ' · llegó al local' : '') + '</small></button>'; }).join('');
      const libres = SLOTS.filter(h => !ag.some(e => minDe(h) >= minDe(e.h) && minDe(h) < minDe(e.h) + sv(e.servicio).min)).map(h => '<button type="button" class="sv-ag-l" style="top:' + ((minDe(h) - 840) / 30 * 54) + 'px" data-act="sv-ba-nuevo" data-b="' + x.id + '" data-h="' + h + '">Libre</button>').join('');
      return '<div class="sv-ag-c"><header>' + av(x.n, x.foto ? FOTO(x.foto) : '') + '<b>' + esc(x.n) + '</b>' + (ocupado ? pill('Ocupado', 'teal') : pill('Libre', 'verde')) + '</header><div class="sv-ag-cuerpo">' + libres + bloques + '</div></div>';
    };
    return cab('Turnos y fila', MENU.barberia[2], btn(I('plus') + 'Nuevo turno', 'sv-ba-nuevo')) +
      kpis([['tijera', 'Atendidos hoy', b.atendidos, 'en el local y por Mi Tienda', 'teal'], ['users', 'En fila ahora', b.fila.length, b.fila.length ? 'Espera más larga ~' + espera(b.fila.length - 1) + ' min' : 'Nadie esperando', 'oro'], ['cal', 'Turnos por Mi Tienda', turnosApp, 'Resto de la tarde', 'lila'], ['cash', 'Vendido hoy', pesos(b.vendido), 'Servicios + productos']]) +
      '<div class="sv-split"><section class="sv-caja"><div class="sv-caja-h"><h2>Agenda ' + (b.dia === 'man' ? 'de mañana' : 'de hoy') + ' por barbero</h2><div class="sv-seg"><button type="button" class="' + (b.dia !== 'man' ? 'on' : '') + '" data-act="sv-ba-dia" data-d="hoy">Hoy</button><button type="button" class="' + (b.dia === 'man' ? 'on' : '') + '" data-act="sv-ba-dia" data-d="man">Mañana</button></div></div>' +
      '<div class="sv-agenda"><div class="sv-ag-horas">' + SLOTS.map(h => '<span>' + h12(h).replace(' p. m.', '').replace(' a. m.', '') + '</span>').join('') + '</div>' + b.barberos.map(col).join('') + '</div>' +
      '<p class="sv-nota">' + pill('Por Mi Tienda', 'lila') + ' turnos pedidos desde la app · ' + pill('En silla', 'teal') + ' atendiendo ahora · toca un turno para atenderlo o cobrarlo.</p></section>' +
      '<aside class="sv-col"><section class="sv-caja"><div class="sv-caja-h"><h2>Fila del local</h2>' + btn(I('plus') + 'Anotar en la fila', 'sv-ba-fila') + '</div>' +
      (b.fila.length ? b.fila.map((f, i) => '<div class="sv-fila"><b class="num">' + (i + 1) + '</b><div><b>' + esc(f.n) + '</b> · ' + esc(sv(f.servicio).n) + '<small>llegó ' + hora(f.llego) + '</small></div><span class="num">~' + espera(i) + ' min</span><button class="sv-btn gris chico" type="button" data-act="sv-ba-pasar" data-i="' + i + '">Atender</button></div>').join('') : '<p class="muted">Nadie en la fila.</p>') +
      '<p class="sv-nota">Cuando un barbero queda libre, le avisa al siguiente por WhatsApp si dejó su número.</p></section>' +
      '<section class="sv-caja"><div class="sv-caja-h"><h2>Servicios</h2></div>' + b.servicios.map(s => '<div class="sv-lin"><span><b>' + esc(s.n) + '</b> · ' + s.min + ' min</span><b class="num">' + pesos(s.p) + '</b></div>').join('') + '</section></aside></div>';
  }
  const ba = () => st(tienda());
  A['sv-ba-dia'] = el => { ba().dia = el.dataset.d; guardar(tienda()); LM.rerender(); };
  A['sv-ba-nuevo'] = el => {
    const b = ba();
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(tienda().n) + '</small><h3>Nuevo turno</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-ba-nuevo">' +
      '<div class="campo"><label for="svBaC">Cliente</label><input id="svBaC" name="c" required placeholder="Nombre"></div>' +
      '<div class="campo"><label for="svBaS">Servicio</label><select id="svBaS" name="s">' + b.servicios.map(s => '<option value="' + s.id + '">' + esc(s.n) + ' · ' + pesos(s.p) + '</option>').join('') + '</select></div>' +
      '<div class="row2"><div class="campo"><label for="svBaB">Barbero</label><select id="svBaB" name="b">' + b.barberos.map(x => '<option value="' + x.id + '"' + (el && el.dataset.b === x.id ? ' selected' : '') + '>' + esc(x.n) + '</option>').join('') + '</select></div>' +
      '<div class="campo"><label for="svBaH">Hora</label><select id="svBaH" name="h">' + SLOTS.map(h => '<option value="' + h + '"' + (el && el.dataset.h === h ? ' selected' : '') + '>' + h12(h) + '</option>').join('') + '</select></div></div>' +
      '<button class="sv-btn teal xl" type="submit">Guardar turno</button></form>');
  };
  F['sv-ba-nuevo'] = (f, d) => {
    const b = ba(), x = b.barberos.find(y => y.id === d.get('b')), dia = b.dia === 'man' ? enDias(1) : hoyISO(), h = d.get('h');
    if (x.agenda.some(e => e.dia === dia && e.h === h)) { toast('Esa hora ya está tomada con ' + x.n + '.'); return; }
    x.agenda.push({ dia, h, cli: String(d.get('c')).trim(), servicio: d.get('s'), app: false, estado: 'turno' });
    closeModal(); guardar(tienda()); LM.rerender(); toast('Turno guardado: ' + h12(h) + ' con ' + x.n);
  };
  A['sv-ba-turno'] = el => {
    const b = ba(), x = b.barberos.find(y => y.id === el.dataset.b), e = x.agenda.find(z => z.h === el.dataset.h && z.dia === (b.dia === 'man' ? enDias(1) : hoyISO())), s = b.servicios.find(z => z.id === e.servicio);
    sheet('<div class="sh-h"><div class="tt"><small>' + h12(e.h) + ' · ' + esc(x.n) + '</small><h3>' + esc(e.cli) + ' · ' + esc(s.n) + '</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><div class="sh-b stack">' +
      (e.app ? '<p class="muted">Pidió el turno por Mi Tienda' + (e.tel ? ' · celular ' + esc(e.tel) : '') + '.</p>' : '') +
      (e.estado === 'turno' ? btn(I('user') + 'Ya llegó: pasa a la silla', 'sv-ba-estado', ' data-b="' + x.id + '" data-h="' + e.h + '" data-e="silla"', 'teal xl') : '') +
      (e.estado !== 'listo' ? '<form class="stack" data-form="sv-ba-cobrar"><input type="hidden" name="b" value="' + x.id + '"><input type="hidden" name="h" value="' + e.h + '">' + pagoSel() + '<button class="sv-btn teal xl" type="submit">' + I('check') + 'Terminado · cobrar ' + pesos(s.p) + '</button></form>' : '<p class="muted">Ya se atendió y se cobró.</p>') +
      (e.estado !== 'listo' ? btn('Cancelar el turno', 'sv-ba-estado', ' data-b="' + x.id + '" data-h="' + e.h + '" data-e="cancelar"', 'gris') : '') + '</div>');
  };
  A['sv-ba-estado'] = el => {
    const b = ba(), x = b.barberos.find(y => y.id === el.dataset.b), dia = b.dia === 'man' ? enDias(1) : hoyISO(), i = x.agenda.findIndex(z => z.h === el.dataset.h && z.dia === dia);
    if (el.dataset.e === 'cancelar') x.agenda.splice(i, 1); else x.agenda[i].estado = el.dataset.e;
    closeModal(); guardar(tienda()); LM.rerender();
  };
  F['sv-ba-cobrar'] = (f, d) => {
    const t = tienda(), b = ba(), x = b.barberos.find(y => y.id === d.get('b')), dia = b.dia === 'man' ? enDias(1) : hoyISO(), e = x.agenda.find(z => z.h === d.get('h') && z.dia === dia), s = b.servicios.find(z => z.id === e.servicio);
    e.estado = 'listo'; b.atendidos++; b.vendido += s.p; vender(t, s.n + ' · ' + e.cli + ' (' + x.n + ')', s.p, d.get('m'));
    closeModal(); guardar(t); LM.rerender(); toast('Cobrado ' + pesos(s.p) + '.');
  };
  A['sv-ba-fila'] = () => {
    const b = ba();
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(tienda().n) + '</small><h3>Anotar en la fila</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-ba-fila">' +
      '<div class="campo"><label for="svFn">Nombre</label><input id="svFn" name="n" required></div><div class="campo"><label for="svFs">Servicio</label><select id="svFs" name="s">' + b.servicios.map(s => '<option value="' + s.id + '">' + esc(s.n) + '</option>').join('') + '</select></div>' +
      '<div class="campo"><label for="svFt">Celular (opcional, para avisarle)</label><input id="svFt" name="t" inputmode="tel"></div><button class="sv-btn teal xl" type="submit">Anotar</button></form>');
  };
  F['sv-ba-fila'] = (f, d) => { ba().fila.push({ n: String(d.get('n')).trim(), servicio: d.get('s'), tel: String(d.get('t') || ''), llego: Date.now() }); closeModal(); guardar(tienda()); LM.rerender(); toast('Anotado en la fila'); };
  A['sv-ba-pasar'] = el => {
    const b = ba(), f = b.fila[+el.dataset.i], ahora = new Date(), h = String(ahora.getHours()).padStart(2, '0') + ':' + (ahora.getMinutes() < 30 ? '00' : '30');
    const x = b.barberos.find(y => !y.agenda.some(e => e.dia === hoyISO() && e.estado === 'silla')) || b.barberos[0];
    x.agenda = x.agenda.filter(e => !(e.dia === hoyISO() && e.h === h && e.estado === 'turno' && !e.app));
    x.agenda.push({ dia: hoyISO(), h, cli: f.n, servicio: f.servicio, app: false, estado: 'silla' });
    b.fila.splice(+el.dataset.i, 1); guardar(tienda()); LM.rerender(); toast(f.n + ' pasa a la silla de ' + x.n);
  };

  /* ============================================================================================
     3. TIENDA DE BARRIO · mostrador
     ============================================================================================ */
  SEED.tienda = t => ({ ticket: [{ id: 'arroz', q: 2, n: 'Arroz', u: '2 libras', p: 2200 }, { id: 'huevo', q: 6, n: 'Huevo', u: '6 unidades', p: 600 }, { id: 'limon', q: 5, n: 'Limón', u: '5 unidades', p: 200 }], pago: 'efectivo', fiadoA: '', ventaN: 31,
    cuaderno: [{ n: 'Valentina Rangel', debe: 38000, foto: 'u-valentina' }, { n: 'Diana Mercado', debe: 12500, foto: 'u-diana' }, { n: 'Luis Pacheco', debe: 0, foto: 'u-luis' }],
    armar: t.id === 'tienda' ? [{ n: 1046, cli: 'Diana Mercado', foto: 'u-diana', items: ['Arroz 5 lb', 'Aceite 1 L', '30 huevos', 'Café 500 g', 'Panela'], hecho: [0, 1, 2] }, { n: 1048, cli: 'Valentina Rangel', foto: 'u-valentina', items: ['Leche', 'Pan', 'Mantequilla'], hecho: [] }] : [] });
  function pTienda(t) {
    const k = st(t), ps = prodsDe(t.id), top = ps.slice().sort((a, b) => (b.fotoMini ? 1 : 0) - (a.fotoMini ? 1 : 0) || (b.v || 0) - (a.v || 0)).slice(0, 8);
    const tot = k.ticket.reduce((a, i) => a + i.q * i.p, 0), fi = k.cuaderno.find(c => c.n === k.fiadoA);
    return cab('Mostrador', MENU.tienda[2]) +
      '<div class="sv-split ancho"><div><form class="sv-scan" data-form="sv-ti-buscar"><span>' + ic('scan') + '</span><input name="q" list="svTiL" placeholder="Escanea el código de barras o escribe el producto" autocomplete="off" aria-label="Producto o código"><datalist id="svTiL">' + ps.map(p => '<option value="' + esc(p.n) + '">').join('') + '</datalist></form>' +
      btn('Venta por peso', 'sv-ti-peso', '', 'borde') +
      '<h3 class="sv-sub">Lo que más se vende · un toque y queda en la cuenta</h3><div class="sv-tiles">' + top.map(p => '<button type="button" class="sv-tile" data-act="sv-ti-add" data-id="' + esc(p.id) + '"><span class="sv-ph">' + (p.fotoMini ? '<img src="' + esc(p.fotoMini) + '" alt="">' : I(p.i)) + '</span><b>' + esc(p.n) + '</b><small class="num">' + pesos(LM.precio(p).p) + '</small></button>').join('') + '</div>' +
      (k.armar.length ? caja('Pedidos de Mi Tienda para armar', k.armar.map((o, i) => '<button type="button" class="sv-armar" data-act="sv-ti-armar" data-i="' + i + '">' + av(o.cli, o.foto ? FOTO(o.foto) : '') + '<span><b>' + esc(o.cli) + ' · #' + o.n + '</b><small>' + esc(o.items.join(', ')) + '</small></span><span class="sv-barra"><i style="width:' + Math.round(o.hecho.length / o.items.length * 100) + '%"></i></span><b>' + (o.hecho.length ? o.hecho.length + ' de ' + o.items.length : 'Por armar') + '</b></button>').join('') + '<p class="sv-nota">Se va marcando lo que entra a la bolsa; si algo no hay, se le pregunta al cliente por el chat.</p>', pill(k.armar.length + ' nuevos', 'rojo')) : '') + '</div>' +
      '<aside class="sv-det"><div class="sv-det-h"><h2>Venta en mostrador</h2>' + pill('Venta ' + (k.ventaN + 1) + ' de hoy', 'gris') + '</div>' +
      (k.ticket.length ? k.ticket.map((i, n) => '<div class="sv-lin"><span><b>' + esc(i.n) + '</b><small>' + esc(i.u || i.q + ' unidad' + (i.q > 1 ? 'es' : '')) + '</small></span><b class="num">' + pesos(i.q * i.p) + '</b><button class="sv-x" type="button" data-act="sv-ti-quitar" data-i="' + n + '" aria-label="Quitar">' + I('x') + '</button></div>').join('') : '<p class="muted">Escanea o toca un producto para empezar.</p>') +
      '<div class="sv-total"><span>Total</span><b class="num">' + pesos(tot) + '</b></div>' + pagoBtns(k.pago, 'sv-ti-pago') +
      (k.pago === 'fiado' ? '<div class="sv-fiado">' + (fi ? av(fi.n, fi.foto ? FOTO(fi.foto) : '') + '<span><b>Fiado a ' + esc(fi.n) + '</b>Ya debe ' + pesos(fi.debe) + ' · con esta queda en ' + pesos(fi.debe + tot) + '</span>' : '<span>¿A quién se le fía?</span>') +
        '<select data-chg="sv-ti-fiado" aria-label="Cliente del cuaderno"><option value="">Escoge del cuaderno…</option>' + k.cuaderno.map(c => '<option' + (c.n === k.fiadoA ? ' selected' : '') + '>' + esc(c.n) + '</option>').join('') + '</select></div>' : '') +
      '<div class="sv-pie">' + btn((k.pago === 'fiado' ? 'Anotar en el cuaderno · ' : 'Cobrar · ') + pesos(tot), 'sv-ti-cobrar', tot ? '' : ' disabled', 'teal xl') + '</div></aside></div>';
  }
  const ti = () => st(tienda());
  const addTicket = (p, q, u) => { const k = ti(), pr = LM.precio(p).p, it = k.ticket.find(x => x.id === p.id && !x.peso); if (it && !u) { it.q += q; it.u = ''; } else k.ticket.push({ id: p.id, q, n: p.n, p: pr, u: u || '', peso: !!u }); guardar(tienda()); LM.rerender(); };
  A['sv-ti-add'] = el => addTicket(LM.PR(el.dataset.id), 1);
  F['sv-ti-buscar'] = (f, d) => { const q = String(d.get('q') || '').trim().toLowerCase(); if (!q) return; const ps = prodsDe(tienda().id); const p = ps.find(x => (x.cod || '').toLowerCase() === q) || ps.find(x => x.n.toLowerCase() === q) || ps.find(x => x.n.toLowerCase().includes(q)); if (!p) { toast('No encontré "' + q + '" en este negocio.'); return; } addTicket(p, 1); setTimeout(() => { const i = document.querySelector('.sv-scan input'); if (i) i.focus(); }, 30); };
  A['sv-ti-quitar'] = el => { ti().ticket.splice(+el.dataset.i, 1); guardar(tienda()); LM.rerender(); };
  A['sv-ti-pago'] = el => { ti().pago = el.dataset.m; guardar(tienda()); LM.rerender(); };
  LM.A['sv-ti-fiado'] = el => { ti().fiadoA = el.value; guardar(tienda()); LM.rerender(); };
  A['sv-ti-peso'] = () => {
    const ps = prodsDe(tienda().id);
    sheet('<div class="sh-h"><div class="tt"><small>Con la balanza</small><h3>Venta por peso</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-ti-peso">' +
      '<div class="campo"><label for="svPp">Producto</label><select id="svPp" name="p">' + ps.map(p => '<option value="' + esc(p.id) + '">' + esc(p.n) + ' · ' + pesos(LM.precio(p).p) + '</option>').join('') + '</select></div>' +
      '<div class="campo"><label for="svPl">Libras</label><input id="svPl" name="l" type="number" min="0.25" step="0.25" value="1" required></div><p class="muted">El precio de la lista se toma por libra.</p><button class="sv-btn teal xl" type="submit">Agregar a la venta</button></form>');
  };
  F['sv-ti-peso'] = (f, d) => { const p = LM.PR(d.get('p')), l = +d.get('l') || 1; closeModal(); const k = ti(); k.ticket.push({ id: p.id, q: l, n: p.n, p: LM.precio(p).p, u: String(l).replace('.', ',') + ' libras', peso: true }); guardar(tienda()); LM.rerender(); };
  A['sv-ti-cobrar'] = () => {
    const t = tienda(), k = ti(), tot = k.ticket.reduce((a, i) => a + i.q * i.p, 0);
    if (!tot) return;
    if (k.pago === 'fiado') { const c = k.cuaderno.find(x => x.n === k.fiadoA); if (!c) { toast('Escoge a quién se le fía.'); return; } c.debe += tot; const N = LM.NEG(t.id); N.clientes = N.clientes || []; }
    vender(t, k.ticket.map(i => i.n).join(', '), tot, k.pago, k.pago === 'fiado' ? { fiadoA: k.fiadoA } : null);
    k.ticket.forEach(i => bajar(i.id, i.q)); k.ventaN++; k.ticket = []; const fueFiado = k.pago === 'fiado'; k.pago = 'efectivo'; k.fiadoA = '';
    guardar(t); LM.rerender(); toast(fueFiado ? 'Anotado en el cuaderno: ' + pesos(tot) : 'Venta de ' + pesos(tot) + ' guardada en la caja.');
  };
  A['sv-ti-armar'] = el => {
    const o = ti().armar[+el.dataset.i];
    sheet('<div class="sh-h"><div class="tt"><small>Pedido #' + o.n + '</small><h3>Armar el pedido de ' + esc(o.cli) + '</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><div class="sh-b sv-lista-sel">' +
      o.items.map((x, i) => '<button type="button" class="' + (o.hecho.includes(i) ? 'ok' : '') + '" data-act="sv-ti-armar1" data-o="' + el.dataset.i + '" data-i="' + i + '"><span>' + (o.hecho.includes(i) ? I('check') : '') + esc(x) + '</span></button>').join('') +
      (o.hecho.length === o.items.length ? btn(I('moto') + 'Listo para el domiciliario', 'sv-ti-armado', ' data-o="' + el.dataset.i + '"', 'teal xl') : '') + '</div>');
  };
  A['sv-ti-armar1'] = el => { const o = ti().armar[+el.dataset.o], i = +el.dataset.i, j = o.hecho.indexOf(i); if (j >= 0) o.hecho.splice(j, 1); else o.hecho.push(i); guardar(tienda()); A['sv-ti-armar']({ dataset: { i: el.dataset.o } }); LM.rerender(); };
  A['sv-ti-armado'] = el => { const k = ti(), o = k.armar.splice(+el.dataset.o, 1)[0]; closeModal(); guardar(tienda()); LM.rerender(); toast('Pedido #' + o.n + ' listo. Se le avisa al domiciliario.'); };

  /* ============================================================================================
     4. DROGUERÍA · mostrador, fórmulas y vencimientos
     ============================================================================================ */
  SEED.drogueria = () => ({ prod: 'acetaminofen', pres: 1, q: 1, venta: [], rx: [{ n: 1047, cli: 'Andrea Ospino', foto: 'u-andrea', prod: 'amoxicilina', modo: 'domicilio', estado: 'revision' }],
    lotes: [{ n: 'Loratadina 10 mg', lote: 'L2291', vence: enDias(40), u: 18 }, { n: 'Suero oral 500 ml', lote: 'S1180', vence: enDias(75), u: 12 }, { n: 'Ibuprofeno 400 mg', lote: 'I0932', vence: enDias(130), u: 60 }, { n: 'Acetaminofén 500 mg', lote: 'A4410', vence: enDias(640), u: 340 }] });
  const presDe = p => (p.ops && p.ops[0] && p.ops[0].v && typeof p.ops[0].v[0] === 'object') ? p.ops[0].v.map(v => ({ n: v.n, p: v.p })) : [{ n: 'Unidad', p: LM.precio(p).p }];
  function pDrogueria(t) {
    const k = st(t), p = LM.PR(k.prod) || prodsDe(t.id)[0], pres = presDe(p), sel = pres[Math.min(k.pres, pres.length - 1)];
    const dias = iso => Math.ceil((new Date(iso + 'T23:59:59') - Date.now()) / 864e5);
    const tv = k.venta.reduce((a, i) => a + i.q * i.p, 0);
    const rx = k.rx.filter(r => r.estado === 'revision' || r.estado === 'otra');
    return cab('Mostrador y fórmulas', MENU.drogueria[2]) +
      '<div class="sv-split ancho"><div><form class="sv-scan" data-form="sv-dr-buscar"><span>' + I('search') + '</span><input name="q" list="svDrL" value="' + esc(p.n.split(' x')[0].toLowerCase()) + '" aria-label="Buscar medicamento"><datalist id="svDrL">' + prodsDe(t.id).map(x => '<option value="' + esc(x.n) + '">').join('') + '</datalist></form>' +
      caja('', '<div class="sv-dr-p"><span class="sv-dr-ic">' + ic('pastilla') + '</span><div><b>' + esc(p.n) + '</b><small>' + (p.rx ? '<em class="rojo">Requiere fórmula médica</em>' : 'Venta libre') + ' · quedan ' + (p.stock != null ? p.stock : '—') + ' en inventario</small></div></div>' +
        '<small class="sv-sub">¿Cómo lo lleva?</small><div class="sv-pres">' + pres.map((x, i) => '<button type="button" class="' + (x === sel ? 'on' : '') + '" data-act="sv-dr-pres" data-i="' + i + '"><b>' + esc(x.n) + '</b><span class="num">' + pesos(x.p) + '</span></button>').join('') + '</div>' +
        '<div class="sv-cant"><button type="button" data-act="sv-dr-q" data-d="-1">' + I('minus') + '</button><b class="num">' + k.q + '</b><button type="button" data-act="sv-dr-q" data-d="1">' + I('plus') + '</button>' + btn('Agregar a la venta · ' + pesos(sel.p * k.q), 'sv-dr-add', p.rx ? ' disabled title="Solo con fórmula aprobada"' : '', 'teal') + '</div>' +
        (k.venta.length ? '<div class="sv-venta-mini">' + k.venta.map((i, n) => '<div class="sv-lin"><span>' + i.q + ' × ' + esc(i.n) + '</span><b class="num">' + pesos(i.q * i.p) + '</b><button class="sv-x" type="button" data-act="sv-dr-quitar" data-i="' + n + '">' + I('x') + '</button></div>').join('') +
          '<form class="sv-form inline" data-form="sv-dr-cobrar">' + pagoSel() + '<button class="sv-btn teal" type="submit">Cobrar ' + pesos(tv) + '</button></form></div>' : '')) +
      rx.map(r => { const rp = LM.PR(r.prod); return caja('', '<div class="sv-dr-rx"><span class="sv-dr-ic rojo">' + ic('sobre') + '</span><div><b>Pedido #' + r.n + ' · ' + esc(rp.n) + '</b><small>' + esc(r.cli) + ' · ' + esc(r.modo) + ' · <em class="rojo">requiere fórmula médica</em></small></div>' + av(r.cli, r.foto ? FOTO(r.foto) : '') + '</div>' +
        '<div class="sv-formula"><div class="sv-papel"><i></i><i></i><i></i><i></i><i></i><em>Dr. R.</em></div><p>' + (r.estado === 'otra' ? 'Se le pidió otra foto al cliente. Esperando…' : 'El cliente subió la foto de su fórmula. <b>' + esc(SV.perfil(t.id).dueno) + ' (regente)</b> la revisa: medicamento, dosis, fecha y firma del médico.') + '</p></div>' +
        '<div class="sv-3b">' + btn('Pedir otra foto', 'sv-dr-rx', ' data-n="' + r.n + '" data-e="otra"', 'gris') + btn('Rechazar', 'sv-dr-rx', ' data-n="' + r.n + '" data-e="rechazada"', 'borde rojo') + btn(I('check') + 'Fórmula válida · despachar', 'sv-dr-rx', ' data-n="' + r.n + '" data-e="ok"', 'teal') + '</div>'); }).join('') + '</div>' +
      '<aside class="sv-col">' + caja('Próximos a vencer', '<table class="sv-tabla"><thead><tr><th>Producto</th><th>Lote</th><th>Vence</th><th class="r">Und.</th></tr></thead><tbody>' +
        k.lotes.slice().sort((a, b) => a.vence < b.vence ? -1 : 1).map(l => { const dd = dias(l.vence); return '<tr><td><i class="sv-dot ' + (dd <= 60 ? 'rojo' : dd <= 180 ? 'oro' : 'verde') + '"></i>' + esc(l.n) + '</td><td>' + esc(l.lote) + '</td><td>' + esc(l.vence.slice(5, 7) + '/' + l.vence.slice(0, 4)) + '</td><td class="r num">' + l.u + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<form class="sv-form inline" data-form="sv-dr-lote"><input name="n" required placeholder="Producto" aria-label="Producto"><input name="l" required placeholder="Lote" aria-label="Lote"><input name="f" type="date" required aria-label="Vence"><input name="u" type="number" min="1" required placeholder="Und." aria-label="Unidades"><button class="sv-btn gris" type="submit">Anotar lote</button></form>' +
        '<p class="sv-nota">Al recibir mercancía se anota el lote y la fecha de vencimiento. Primero se vende lo que vence antes.</p>', pill(k.lotes.filter(l => dias(l.vence) <= 90).length + ' alertas', 'rojo')) +
      caja('Reglas de esta droguería', '<ul class="sv-reglas"><li>' + I('lock') + 'Los antibióticos y medicamentos de control solo salen con fórmula.</li><li>' + ic('pastilla') + 'Se vende por tableta, blíster o caja; el inventario descuenta tabletas.</li><li>' + I('user') + 'Solo la regente aprueba fórmulas.</li></ul>') + '</aside></div>';
  }
  const dr = () => st(tienda());
  F['sv-dr-buscar'] = (f, d) => { const q = String(d.get('q') || '').toLowerCase().trim(), p = prodsDe(tienda().id).find(x => x.n.toLowerCase().includes(q)); if (!p) { toast('No encontré ese producto.'); return; } const k = dr(); k.prod = p.id; k.pres = 0; k.q = 1; guardar(tienda()); LM.rerender(); };
  A['sv-dr-pres'] = el => { dr().pres = +el.dataset.i; guardar(tienda()); LM.rerender(); };
  A['sv-dr-q'] = el => { const k = dr(); k.q = Math.max(1, k.q + +el.dataset.d); LM.rerender(); };
  A['sv-dr-add'] = () => { const k = dr(), p = LM.PR(k.prod), x = presDe(p)[k.pres]; k.venta.push({ id: p.id, n: p.n.split(' x')[0] + ' · ' + x.n, q: k.q, p: x.p }); k.q = 1; guardar(tienda()); LM.rerender(); };
  A['sv-dr-quitar'] = el => { dr().venta.splice(+el.dataset.i, 1); guardar(tienda()); LM.rerender(); };
  F['sv-dr-cobrar'] = (f, d) => { const t = tienda(), k = dr(), tot = k.venta.reduce((a, i) => a + i.q * i.p, 0); vender(t, k.venta.map(i => i.q + ' × ' + i.n).join(', '), tot, d.get('m')); k.venta = []; guardar(t); LM.rerender(); toast('Venta de ' + pesos(tot) + ' guardada.'); };
  A['sv-dr-rx'] = el => {
    const t = tienda(), k = dr(), r = k.rx.find(x => x.n === +el.dataset.n); r.estado = el.dataset.e;
    LM.logN(t.id, 'Fórmula del pedido #' + r.n + ': ' + (r.estado === 'ok' ? 'aprobada' : r.estado === 'otra' ? 'pidió otra foto' : 'rechazada'));
    guardar(t); LM.rerender(); toast(r.estado === 'ok' ? 'Fórmula aprobada. El pedido #' + r.n + ' sale con el domiciliario: debe ver la fórmula original al entregar.' : r.estado === 'otra' ? 'Se le pidió otra foto al cliente.' : 'Fórmula rechazada. Se le avisa al cliente.');
  };
  F['sv-dr-lote'] = (f, d) => { dr().lotes.push({ n: String(d.get('n')), lote: String(d.get('l')), vence: String(d.get('f')), u: +d.get('u') }); guardar(tienda()); LM.rerender(); toast('Lote anotado'); };

  /* ============================================================================================
     5. TALLER · órdenes por moto
     ============================================================================================ */
  const COLS = [['recibida', 'Recibida', 'gris'], ['diagnostico', 'Diagnóstico', 'oro'], ['aprobacion', 'Espera aprobación', 'lila'], ['reparacion', 'En reparación', 'teal'], ['lista', 'Lista', 'verde']];
  SEED.taller = () => {
    const o = (id, placa, moto, falla, cli, estado, extra) => Object.assign({ id, placa, moto, falla, cli, tel: '', estado, diag: '', km: '', entra: Date.now() - 3 * H, items: [], log: [] }, extra || {});
    return { sel: 'OT-218', n: 222, ordenes: [o('OT-221', 'HJK 45E', 'Boxer 100', 'No prende', 'Yeison', 'recibida', { foto: 'd-yeison' }), o('OT-220', 'MNB 88C', 'AKT 125', 'Ruido en el motor', 'Kelly', 'diagnostico', { foto: 'd-kelly' }),
      o('OT-218', 'ABC 12D', 'Boxer CT 100', 'La cadena suena y frena mal', 'María de Chimí', 'aprobacion', { foto: 'u-maria', tel: '3105550102', diag: 'Kit de arrastre gastado; pastillas delanteras al 10 %.', km: '38.420', entra: Date.now() - 50 * MIN,
        items: [{ k: 'kit', n: 'Kit de arrastre (cadena, piñón y corona)', v: 85000 }, { k: 'pastillas', n: 'Pastillas de freno delanteras', v: 18000 }, { k: 'mo', n: 'Mano de obra', v: 30000, mo: true }], enviada: Date.now() - 30 * MIN }),
      o('OT-216', 'QWE 31F', 'Pulsar 180', 'Cambio de aceite y filtro', 'Carlos M.', 'reparacion', { items: [{ k: 'aceite', n: 'Aceite 20W-50 y filtro', v: 35000 }] }), o('OT-215', 'ZXC 07A', 'NKD 125', 'Luz delantera', 'Rafael', 'reparacion', { items: [{ k: 'bombillo', n: 'Bombillo H4', v: 12000 }, { k: 'mo', n: 'Mano de obra', v: 8000, mo: true }] }),
      o('OT-213', 'RTY 52B', 'Boxer 150', 'Clutch', 'Elkin', 'lista', { items: [{ k: 'clutch', n: 'Discos de clutch', v: 65000 }, { k: 'mo', n: 'Mano de obra', v: 25000, mo: true }] })] };
  };
  const totOT = o => o.items.reduce((a, i) => a + i.v, 0);
  const urlMoto = (t, o) => location.origin + location.pathname.replace(/index\.html$/, '') + '#moto-' + t.id + '-' + o.id;
  function pTaller(t) {
    const k = st(t), o = k.ordenes.find(x => x.id === k.sel) || k.ordenes[0];
    const sig = { recibida: ['Pasar a diagnóstico', 'diagnostico'], diagnostico: ['Enviar cotización al cliente', 'aprobacion'], aprobacion: ['El cliente aprobó por teléfono', 'reparacion'], reparacion: ['Moto lista para entregar', 'lista'], lista: ['Entregar y cobrar', 'cobrar'] }[o.estado];
    return cab('Órdenes de taller', MENU.taller[2], btn(I('plus') + 'Recibir moto', 'sv-ta-recibir')) +
      '<div class="sv-kanban">' + COLS.map(c => { const l = k.ordenes.filter(x => x.estado === c[0]); return '<div class="sv-kb-c"><header><i class="sv-dot ' + c[2] + '"></i>' + c[1] + '<b>' + l.length + '</b></header>' + l.map(x => '<button type="button" class="sv-ot' + (x.id === o.id ? ' sel' : '') + '" data-act="sv-ta-sel" data-id="' + x.id + '"><span><b>' + x.id + '</b><em class="sv-placa">' + esc(x.placa) + '</em></span><b>' + esc(x.moto) + '</b><small>' + esc(x.falla) + '</small><span class="sv-ot-c">' + av(x.cli, x.foto ? FOTO(x.foto) : '') + esc(x.cli.split(' ')[0]) + '</span></button>').join('') + '</div>'; }).join('') + '</div>' +
      '<div class="sv-split"><section class="sv-caja"><div class="sv-caja-h"><h2>' + o.id + ' · ' + esc(o.moto) + ' · ' + esc(o.placa) + '</h2>' + pill(COLS.find(c => c[0] === o.estado)[1], COLS.find(c => c[0] === o.estado)[2]) + '</div>' +
      '<div class="sv-ot-d"><img src="' + esc(FOTO('f-rueda')) + '" alt=""><div><p><b>Lo que dijo el cliente:</b> "' + esc(o.falla) + '".</p>' + (o.diag ? '<p><b>Diagnóstico de ' + esc(SV.perfil(t.id).dueno) + ':</b> ' + esc(o.diag) + '</p>' : '<form class="sv-form" data-form="sv-ta-diag"><div class="campo"><label for="svTd">Diagnóstico</label><input id="svTd" name="d" placeholder="Qué tiene la moto"></div><div class="campo"><label for="svTk">Kilometraje</label><input id="svTk" name="k" inputmode="numeric"></div><button class="sv-btn gris" type="submit">Guardar diagnóstico</button></form>') +
      (o.km ? '<p><b>Kilometraje:</b> ' + esc(o.km) + ' km · <b>Entra:</b> ' + hora(o.entra) + '</p>' : '') + '</div></div>' +
      (o.estado === 'aprobacion' ? '<div class="sv-aviso lila">' + av(o.cli, o.foto ? FOTO(o.foto) : '') + '<span><b>' + esc(o.cli) + '</b> recibió la cotización en Mi Tienda' + (o.enviada ? ' a las ' + hora(o.enviada) : '') + '.<br>El taller no empieza el trabajo hasta que la apruebe.</span></div>' : '') +
      (o.log && o.log.length ? '<ul class="sv-log">' + o.log.slice(-3).map(l => '<li>' + hora(l.h) + ' · ' + esc(l.t) + '</li>').join('') + '</ul>' : '') +
      (sig ? '<div class="sv-pie">' + btn(sig[0], 'sv-ta-sig', ' data-e="' + sig[1] + '"', 'teal xl') + '</div>' : '') + '</section>' +
      '<aside class="sv-det"><div class="sv-det-h"><h2>Cotización' + (o.estado === 'aprobacion' ? ' enviada' : '') + '</h2></div>' +
      (o.items.length ? o.items.map((i, n) => '<div class="sv-lin"><span>' + esc(i.n) + '</span><b class="num">' + pesos(i.v) + '</b>' + (['recibida', 'diagnostico'].includes(o.estado) ? '<button class="sv-x" type="button" data-act="sv-ta-quitar" data-i="' + n + '">' + I('x') + '</button>' : '') + '</div>').join('') : '<p class="muted">Agrega los repuestos y la mano de obra.</p>') +
      '<div class="sv-total"><span>Total</span><b class="num">' + pesos(totOT(o)) + '</b></div>' +
      '<form class="sv-form inline" data-form="sv-ta-item"><input name="n" required placeholder="Repuesto o trabajo" aria-label="Repuesto o trabajo"><input name="v" type="number" step="1000" required placeholder="Valor" aria-label="Valor"><button class="sv-btn gris" type="submit">' + I('edit') + 'Agregar</button></form>' +
      '<div class="sv-2b"><a class="sv-btn gris" href="https://wa.me/57' + esc(String(o.tel || '').replace(/\D/g, '')) + '?text=' + encodeURIComponent('Hola, ' + o.cli.split(' ')[0] + '. La cotización de tu ' + o.moto + ' (' + o.placa + ') es de ' + pesos(totOT(o)) + '. Mírala y apruébala aquí: ' + urlMoto(t, o)) + '" target="_blank" rel="noopener">' + ic('wa') + 'Recordar por WhatsApp</a>' + btn(I('eye') + 'Lo que ve el cliente', 'go', ' data-h="moto-' + t.id + '-' + o.id + '"', 'gris') + '</div>' +
      '<p class="sv-nota">Los repuestos se descuentan del inventario solo cuando se usan en la moto.</p></aside></div>';
  }
  const ta = () => st(tienda());
  const otSel = () => { const k = ta(); return k.ordenes.find(x => x.id === k.sel); };
  A['sv-ta-sel'] = el => { ta().sel = el.dataset.id; guardar(tienda()); LM.rerender(); };
  F['sv-ta-diag'] = (f, d) => { const o = otSel(); o.diag = String(d.get('d') || '').trim(); o.km = String(d.get('k') || '').trim(); guardar(tienda()); LM.rerender(); };
  F['sv-ta-item'] = (f, d) => { const o = otSel(); o.items.push({ k: 'i' + Date.now(), n: String(d.get('n')).trim(), v: +d.get('v') || 0, mo: /mano de obra/i.test(d.get('n')) }); guardar(tienda()); LM.rerender(); };
  A['sv-ta-quitar'] = el => { otSel().items.splice(+el.dataset.i, 1); guardar(tienda()); LM.rerender(); };
  A['sv-ta-sig'] = el => {
    const t = tienda(), o = otSel(), e = el.dataset.e;
    if (e === 'aprobacion' && !o.items.length) { toast('Agrega la cotización antes de enviarla.'); return; }
    if (e === 'cobrar') {
      sheet('<div class="sh-h"><div class="tt"><small>' + o.id + ' · ' + esc(o.placa) + '</small><h3>Entregar y cobrar ' + pesos(totOT(o)) + '</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-ta-cobrar">' + pagoSel() + '<button class="sv-btn teal xl" type="submit">Cobrado · moto entregada</button></form>');
      return;
    }
    o.estado = e; if (e === 'aprobacion') o.enviada = Date.now();
    o.log = (o.log || []).concat([{ h: Date.now(), t: { diagnostico: 'Pasó a diagnóstico', aprobacion: 'Cotización enviada al cliente', reparacion: 'Aprobada: empieza la reparación', lista: 'Moto lista para entregar' }[e] }]);
    guardar(t); LM.rerender(); toast({ aprobacion: 'Cotización enviada. Mándale el enlace por WhatsApp.', reparacion: 'Aprobada. A trabajar.', lista: 'Lista. Avísale al cliente que pase.' }[e] || 'Listo');
  };
  F['sv-ta-cobrar'] = (f, d) => { const t = tienda(), k = ta(), o = otSel(); vender(t, o.id + ' · ' + o.moto + ' ' + o.placa, totOT(o), d.get('m')); o.estado = 'entregada'; k.ordenes = k.ordenes.filter(x => x.estado !== 'entregada' || x === o); k.sel = (k.ordenes.find(x => x.estado !== 'entregada') || {}).id; k.ordenes = k.ordenes.filter(x => x.estado !== 'entregada'); closeModal(); guardar(t); LM.rerender(); toast('Cobrado y entregado.'); };
  A['sv-ta-recibir'] = () => {
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(tienda().n) + '</small><h3>Recibir moto</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-ta-recibir">' +
      '<div class="row2"><div class="campo"><label for="svRp">Placa</label><input id="svRp" name="p" required style="text-transform:uppercase"></div><div class="campo"><label for="svRm">Moto</label><input id="svRm" name="m" required placeholder="Marca y modelo"></div></div>' +
      '<div class="row2"><div class="campo"><label for="svRc">Cliente</label><input id="svRc" name="c" required></div><div class="campo"><label for="svRt">Celular</label><input id="svRt" name="t" inputmode="tel" placeholder="Para mandarle la cotización"></div></div>' +
      '<div class="campo"><label for="svRf">¿Qué dice el cliente?</label><input id="svRf" name="f" required></div><button class="sv-btn teal xl" type="submit">Crear la orden</button></form>');
  };
  F['sv-ta-recibir'] = (f, d) => { const k = ta(), id = 'OT-' + (k.n++); k.ordenes.unshift({ id, placa: String(d.get('p')).toUpperCase(), moto: String(d.get('m')), falla: String(d.get('f')), cli: String(d.get('c')), tel: String(d.get('t') || '').replace(/\D/g, ''), estado: 'recibida', diag: '', km: '', entra: Date.now(), items: [], log: [{ h: Date.now(), t: 'Moto recibida' }] }); k.sel = id; closeModal(); guardar(tienda()); LM.rerender(); toast('Orden ' + id + ' creada.'); };

  /* ============================================================================================
     6. GRANERO · venta por mayor
     ============================================================================================ */
  SEED.granero = () => ({ modo: 'tendero', unidad: { 'arroz-mayor': 2, 'azucar-mayor': 1, 'frijol-mayor': 0, 'aceite-mayor': 1 }, pedidoSel: 0,
    pedidos: [{ tid: 'tienda', n: 'Tienda Mi Pueblo', quien: 'Doña Rosa', h: '7:40 a. m.', items: [{ id: 'arroz-mayor', u: 2, q: 3 }, { id: 'azucar-mayor', u: 1, q: 4 }, { id: 'aceite-mayor', u: 1, q: 1 }], estado: 'nuevo' }, { tid: 'panaderia', n: 'Panadería El Trigal', quien: 'Rosa', h: '8:05 a. m.', items: [{ id: 'azucar-mayor', u: 2, q: 1 }], estado: 'nuevo' }],
    mostrador: [], credito: { tienda: { cupo: 1500000, usado: 640000, plazo: 15 }, panaderia: { cupo: 800000, usado: 210000, plazo: 15 } }, vendido: 3975000, bultos: 41, porCobrar: 1255000 });
  const uDe = p => p.unidades || [['Unidad', 1, p.p, p.p]];
  const precioU = (k, p, u) => { const x = uDe(p)[u] || uDe(p)[0]; return k.modo === 'tendero' ? (x[3] || x[2]) : x[2]; };
  const kgPed = items => items.reduce((a, i) => { const p = LM.PR(i.id), x = uDe(p)[i.u] || uDe(p)[0]; return a + (p.porUnidad ? 0 : x[1] * i.q); }, 0);
  function pGranero(t) {
    const k = st(t), ps = prodsDe(t.id).filter(p => p.unidades), ped = k.pedidos[k.pedidoSel] || null;
    const lista = ped ? ped.items : k.mostrador, tot = lista.reduce((a, i) => a + precioU(k, LM.PR(i.id), i.u) * i.q, 0), cr = ped && k.credito[ped.tid];
    return cab('Venta por mayor', MENU.granero[2], btn(I('plus') + 'Nueva venta', 'sv-gr-nueva')) +
      kpis([['cash', 'Vendido hoy', pesos(k.vendido), '62 % a tiendas'], ['receipt', 'Pedidos de tenderos', k.pedidos.length, k.pedidos.filter(x => x.estado === 'nuevo').length + ' por despachar', 'teal'], ['sobre', 'Por cobrar a tiendas', pesos(k.porCobrar), '3 vencidos', 'rojo'], ['camion', 'Bultos despachados', k.bultos, 'En 3 viajes de carguero', 'oro']]) +
      '<div class="sv-split ancho"><section class="sv-caja"><div class="sv-caja-h"><h2>Vender por libra, arroba o bulto</h2><div class="sv-seg"><button type="button" class="' + (k.modo === 'tendero' ? 'on' : '') + '" data-act="sv-gr-modo" data-m="tendero">Precio tendero</button><button type="button" class="' + (k.modo !== 'tendero' ? 'on' : '') + '" data-act="sv-gr-modo" data-m="publico">Precio público</button></div></div>' +
      ps.map(p => '<div class="sv-may"><div><b>' + esc(p.n) + '</b><small>Hay ' + Math.floor(p.porUnidad ? p.stock / 12 : p.stock / 50) + (p.porUnidad ? ' cajas' : ' bultos') + '</small></div><div class="sv-may-u">' + uDe(p).map((x, i) => '<button type="button" class="' + ((k.unidad[p.id] || 0) === i ? 'on' : '') + '" data-act="sv-gr-u" data-id="' + p.id + '" data-u="' + i + '"><small>' + esc(x[0]) + '</small><b class="num">' + pesos(k.modo === 'tendero' ? (x[3] || x[2]) : x[2]) + '</b></button>').join('') + '</div>' + btn('Agregar', 'sv-gr-add', ' data-id="' + p.id + '"', 'gris') + '</div>').join('') +
      '<p class="sv-nota">El inventario se lleva en kilos: vender un bulto descuenta 50 kg y una arroba 12,5 kg. Los tenderos registrados ven el precio tendero en Mi Tienda.</p></section>' +
      '<aside class="sv-det">' + (k.pedidos.length > 1 ? '<div class="sv-seg ancho">' + k.pedidos.map((x, i) => '<button type="button" class="' + (i === k.pedidoSel ? 'on' : '') + '" data-act="sv-gr-ped" data-i="' + i + '">' + esc(x.n.split(' ').slice(-2).join(' ')) + '</button>').join('') + '<button type="button" class="' + (k.pedidoSel < 0 ? 'on' : '') + '" data-act="sv-gr-ped" data-i="-1">Mostrador</button></div>' : '') +
      (ped ? '<div class="sv-det-h"><img class="sv-av" src="' + esc(SV.lg(LM.T(ped.tid))) + '" alt=""><div><h2>Pedido de ' + esc(ped.n) + '</h2><small>' + esc(ped.quien) + ' · por Mi Tienda · ' + esc(ped.h) + '</small></div></div>' : '<div class="sv-det-h"><h2>Venta de mostrador</h2></div>') +
      (lista.length ? lista.map((i, n) => { const p = LM.PR(i.id), x = uDe(p)[i.u]; return '<div class="sv-lin"><span>' + i.q + ' × ' + esc(p.n) + ' · ' + esc(x[0].toLowerCase()) + '</span><b class="num">' + pesos(precioU(k, p, i.u) * i.q) + '</b><button class="sv-x" type="button" data-act="sv-gr-quitar" data-i="' + n + '">' + I('x') + '</button></div>'; }).join('') : '<p class="muted">Agrega productos de la lista.</p>') +
      '<div class="sv-total"><span>Total</span><b class="num">' + pesos(tot) + '</b></div>' +
      (cr ? '<div class="sv-credito"><b>Crédito de la tienda</b><span>Cupo ' + pesos(cr.cupo) + ' · usado ' + pesos(cr.usado) + ' · paga a ' + cr.plazo + ' días</span><i><em style="width:' + Math.min(100, Math.round((cr.usado + tot) / cr.cupo * 100)) + '%"></em></i><small>Con este pedido queda en ' + pesos(cr.usado + tot) + (cr.usado + tot > cr.cupo ? ' · <b class="rojo">pasa el cupo</b>' : '') + '</small></div>' : '') +
      '<div class="sv-aviso gris">' + ic('camion') + '<span><b>Despacho:</b> carguero de la tarde, 2 p. m.<br>Peso total ' + Math.round(kgPed(lista)) + ' kg</span></div>' +
      '<div class="sv-pie sv-2b">' + btn('Contado', 'sv-gr-cerrar', ' data-c="0"', 'gris') + (cr ? btn(I('check') + 'Despachar a crédito', 'sv-gr-cerrar', ' data-c="1"', 'teal') : '') + '</div></aside></div>';
  }
  const gr = () => st(tienda());
  A['sv-gr-modo'] = el => { gr().modo = el.dataset.m; guardar(tienda()); LM.rerender(); };
  A['sv-gr-u'] = el => { gr().unidad[el.dataset.id] = +el.dataset.u; guardar(tienda()); LM.rerender(); };
  A['sv-gr-ped'] = el => { gr().pedidoSel = +el.dataset.i; guardar(tienda()); LM.rerender(); };
  A['sv-gr-nueva'] = () => { const k = gr(); k.pedidoSel = -1; k.mostrador = []; guardar(tienda()); LM.rerender(); };
  A['sv-gr-add'] = el => { const k = gr(), l = k.pedidos[k.pedidoSel] ? k.pedidos[k.pedidoSel].items : k.mostrador, u = k.unidad[el.dataset.id] || 0, it = l.find(i => i.id === el.dataset.id && i.u === u); if (it) it.q++; else l.push({ id: el.dataset.id, u, q: 1 }); guardar(tienda()); LM.rerender(); };
  A['sv-gr-quitar'] = el => { const k = gr(), l = k.pedidos[k.pedidoSel] ? k.pedidos[k.pedidoSel].items : k.mostrador; l.splice(+el.dataset.i, 1); guardar(tienda()); LM.rerender(); };
  A['sv-gr-cerrar'] = el => {
    const t = tienda(), k = gr(), ped = k.pedidos[k.pedidoSel], l = ped ? ped.items : k.mostrador, tot = l.reduce((a, i) => a + precioU(k, LM.PR(i.id), i.u) * i.q, 0);
    if (!tot) { toast('No hay nada en la venta.'); return; }
    const cred = el.dataset.c === '1';
    l.forEach(i => { const p = LM.PR(i.id), x = uDe(p)[i.u]; bajar(p.id, p.porUnidad ? x[1] * i.q : x[1] * i.q); if (/bulto/i.test(x[0])) k.bultos += i.q; });
    vender(t, (ped ? 'Pedido ' + ped.n : 'Mostrador') + ' · por mayor', tot, cred ? 'fiado' : 'efectivo', cred ? { credito: ped.tid } : null);
    if (cred) { k.credito[ped.tid].usado += tot; k.porCobrar += tot; }
    k.vendido += tot;
    if (ped) k.pedidos.splice(k.pedidoSel, 1); else k.mostrador = [];
    k.pedidoSel = k.pedidos.length ? 0 : -1; guardar(t); LM.rerender(); toast((cred ? 'Despachado a crédito: ' : 'Venta de contado: ') + pesos(tot));
  };

  /* ============================================================================================
     7. FERRETERÍA · venta por medida y cotizaciones
     ============================================================================================ */
  SEED.ferreteria = () => ({ prod: 'cable12', cant: 15, filtro: '', cotSel: 0, n: 32, cot: [{ id: 'COT-031', cli: 'Yesica Cantillo', foto: 'u-yesica', tel: '3004127788', obra: 'arreglo del baño', via: 'La pidió por Mi Tienda con una foto de la lista', f: Date.now(), items: [{ id: 'cable12', q: 15 }, { id: 'puntilla2', q: 2 }, { id: 'cemento-et', q: 10 }, { id: 'tubo-et', q: 4 }, { id: 'pintura-et', q: 2 }] }] });
  const UNI = { m: ['metro', 'metros'], kg: ['kilo', 'kilos'], bulto: ['bulto', 'bultos'], 'galón': ['galón', 'galones'], unidad: ['unidad', 'unidades'] };
  const uTxt = (p, q) => { const u = UNI[p.medida || 'unidad'] || UNI.unidad; return String(q).replace('.', ',') + ' ' + (q === 1 ? u[0] : u[1]); };
  function pFerreteria(t) {
    const k = st(t), ps = prodsDe(t.id), p = LM.PR(k.prod) || ps[0], pr = LM.precio(p).p, cot = k.cot[k.cotSel];
    const cotTot = cot ? cot.items.reduce((a, i) => a + LM.precio(LM.PR(i.id)).p * i.q, 0) : 0;
    const chips = ['½"', '¾"', '#12', '#14', '2"'];
    const vis = ps.filter(x => !k.filtro || x.n.includes(k.filtro));
    const pasos = p.medida === 'm' ? [5, 10, 15, 20] : p.medida === 'kg' ? [0.5, 1, 2, 5] : p.medida === 'galón' ? [0.25, 0.5, 1, 2] : [1, 2, 5, 10];
    return cab('Mostrador y cotizaciones', MENU.ferreteria[2], btn(I('plus') + 'Nueva cotización', 'sv-fe-nueva')) +
      '<div class="sv-split ancho"><div><div class="sv-buscar-f"><form class="sv-scan" data-form="sv-fe-buscar"><span>' + I('search') + '</span><input name="q" list="svFeL" placeholder="Busca por nombre, referencia o medida" aria-label="Buscar"><datalist id="svFeL">' + ps.map(x => '<option value="' + esc(x.n) + '">').join('') + '</datalist></form><div class="sv-chips">' + chips.map(c => '<button type="button" class="' + (k.filtro === c ? 'on' : '') + '" data-act="sv-fe-chip" data-c="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div></div>' +
      (k.filtro ? '<div class="sv-chips izq">' + vis.map(x => '<button type="button" data-act="sv-fe-prod" data-id="' + x.id + '">' + esc(x.n) + '</button>').join('') + '</div>' : '') +
      caja('', '<div class="sv-dr-p"><span class="sv-dr-ic">' + ic('regla') + '</span><div><b>' + esc(p.n) + ' · por ' + esc((UNI[p.medida] || UNI.unidad)[0]) + '</b><small>' + (p.medida === 'm' ? 'Rollo de 100 m abierto · quedan ' + (p.stock % 100 || 100) + ' m en el rollo + ' + Math.floor(p.stock / 100) + ' rollos cerrados' : 'Quedan ' + p.stock + ' en inventario') + '</small></div><b class="num sv-gr">' + pesos(pr) + ' / ' + esc(p.medida || 'und') + '</b></div>' +
        '<div class="sv-cant-m"><span>¿Cuántos ' + esc((UNI[p.medida] || UNI.unidad)[1]) + '?</span>' + pasos.map(n => '<button type="button" class="' + (k.cant === n ? 'on' : '') + '" data-act="sv-fe-cant" data-n="' + n + '">' + String(n).replace('.', ',') + '</button>').join('') +
        '<input type="number" min="0.25" step="0.25" value="' + k.cant + '" data-chg="sv-fe-otro" aria-label="Otra cantidad"><b class="num">= ' + pesos(pr * k.cant) + '</b></div>' +
        '<div class="sv-2b">' + btn('Agregar a la cotización', 'sv-fe-add', '', 'teal') + btn('Vender ahora', 'sv-fe-vender', '', 'gris') + '</div>') +
      caja('Se vende por medida, no solo por unidad', '<table class="sv-tabla"><thead><tr><th>Producto</th><th>Unidad de venta</th><th>Cómo se descuenta del inventario</th></tr></thead><tbody>' +
        [['Cable, manguera, cadena', 'Metro', 'Del rollo abierto'], ['Puntillas, alambre, tornillos', 'Kilo o libra', 'Pesados en la balanza'], ['Cemento, arena, cal', 'Bulto o lata', 'Por bulto'], ['Pintura', 'Galón, ¼ o ⅛', 'Por presentación'], ['Tubería, varilla', 'Unidad o tramo cortado', 'Lo que sobra queda como retazo']].map(r => '<tr><td>' + r.join('</td><td>') + '</td></tr>').join('') + '</tbody></table>') + '</div>' +
      '<aside class="sv-det">' + (cot ? '<div class="sv-det-h"><h2>Cotización ' + cot.id + '</h2>' + pill('Vigente ' + Math.max(0, 8 - Math.floor((Date.now() - cot.f) / 864e5)) + ' días', 'oro') + '</div>' +
        '<div class="sv-cli">' + av(cot.cli, cot.foto ? FOTO(cot.foto) : '') + '<span><b>' + esc(cot.cli) + '</b> · ' + esc(cot.obra) + '<small>' + esc(cot.via || 'Cotización de mostrador') + '</small></span></div>' +
        cot.items.map((i, n) => { const x = LM.PR(i.id), v = LM.precio(x).p; return '<div class="sv-lin"><span><b>' + esc(x.n) + '</b><small>' + uTxt(x, i.q) + ' · ' + pesos(v) + ' por ' + esc((UNI[x.medida] || UNI.unidad)[0]) + '</small></span><b class="num">' + pesos(v * i.q) + '</b><button class="sv-x" type="button" data-act="sv-fe-quitar" data-i="' + n + '">' + I('x') + '</button></div>'; }).join('') +
        '<div class="sv-total"><span>Total</span><b class="num">' + pesos(cotTot) + '</b></div>' +
        '<div class="sv-2b"><a class="sv-btn gris" target="_blank" rel="noopener" href="https://wa.me/57' + esc(cot.tel || '') + '?text=' + encodeURIComponent('Cotización ' + cot.id + ' · ' + t.n + '\n' + cot.items.map(i => { const x = LM.PR(i.id); return '• ' + uTxt(x, i.q) + ' de ' + x.n + ': ' + pesos(LM.precio(x).p * i.q); }).join('\n') + '\nTotal: ' + pesos(cotTot) + '\nVigente 8 días.') + '">' + ic('wa') + 'Enviar por WhatsApp</a>' + btn(I('printer') + 'Imprimir', 'sv-imprimir', '', 'gris') + '</div>' +
        '<div class="sv-pie">' + btn(I('check') + 'Convertir en venta', 'sv-fe-convertir', '', 'teal xl') + '</div>' : '<p class="muted">No hay cotizaciones abiertas. Toca "Nueva cotización".</p>') + '</aside></div>';
  }
  const fe = () => st(tienda());
  A['sv-fe-chip'] = el => { const k = fe(); k.filtro = k.filtro === el.dataset.c ? '' : el.dataset.c; guardar(tienda()); LM.rerender(); };
  A['sv-fe-prod'] = el => { const k = fe(); k.prod = el.dataset.id; k.cant = 1; guardar(tienda()); LM.rerender(); };
  F['sv-fe-buscar'] = (f, d) => { const q = String(d.get('q') || '').toLowerCase().trim(), p = prodsDe(tienda().id).find(x => x.n.toLowerCase().includes(q)); if (!p) { toast('No encontré ese producto.'); return; } const k = fe(); k.prod = p.id; k.cant = 1; guardar(tienda()); LM.rerender(); };
  A['sv-fe-cant'] = el => { fe().cant = +el.dataset.n; LM.rerender(); };
  LM.A['sv-fe-otro'] = el => { fe().cant = Math.max(0.25, +el.value || 1); LM.rerender(); };
  A['sv-fe-add'] = () => { const k = fe(); if (!k.cot[k.cotSel]) { A['sv-fe-nueva'](); return; } const c = k.cot[k.cotSel], it = c.items.find(i => i.id === k.prod); if (it) it.q += k.cant; else c.items.push({ id: k.prod, q: k.cant }); guardar(tienda()); LM.rerender(); toast('Agregado a la cotización ' + c.id); };
  A['sv-fe-quitar'] = el => { const k = fe(); k.cot[k.cotSel].items.splice(+el.dataset.i, 1); guardar(tienda()); LM.rerender(); };
  A['sv-fe-vender'] = () => { const t = tienda(), k = fe(), p = LM.PR(k.prod), v = LM.precio(p).p * k.cant; vender(t, uTxt(p, k.cant) + ' de ' + p.n, v); bajar(p.id, k.cant); guardar(t); LM.rerender(); toast('Venta de ' + pesos(v) + ' guardada.'); };
  A['sv-fe-nueva'] = () => {
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(tienda().n) + '</small><h3>Nueva cotización</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-fe-nueva">' +
      '<div class="campo"><label for="svCn">Cliente</label><input id="svCn" name="c" required></div><div class="row2"><div class="campo"><label for="svCt">Celular</label><input id="svCt" name="t" inputmode="tel"></div><div class="campo"><label for="svCo">Obra</label><input id="svCo" name="o" placeholder="Ej: arreglo del techo"></div></div><button class="sv-btn teal xl" type="submit">Crear</button></form>');
  };
  F['sv-fe-nueva'] = (f, d) => { const k = fe(), id = 'COT-' + String(k.n++).padStart(3, '0'); k.cot.unshift({ id, cli: String(d.get('c')), tel: String(d.get('t') || '').replace(/\D/g, ''), obra: String(d.get('o') || 'obra'), f: Date.now(), items: [] }); k.cotSel = 0; closeModal(); guardar(tienda()); LM.rerender(); toast(id + ' creada'); };
  A['sv-fe-convertir'] = () => {
    const t = tienda(), k = fe(), c = k.cot[k.cotSel]; if (!c || !c.items.length) return;
    const tot = c.items.reduce((a, i) => a + LM.precio(LM.PR(i.id)).p * i.q, 0);
    vender(t, c.id + ' · ' + c.cli, tot); c.items.forEach(i => bajar(i.id, i.q)); k.cot.splice(k.cotSel, 1); k.cotSel = 0;
    guardar(t); LM.rerender(); toast('Cotización convertida en venta: ' + pesos(tot));
  };
  A['sv-imprimir'] = () => window.print();

  /* ============================================================================================
     8. MODA · color × talla, plan separe y cambios
     ============================================================================================ */
  SEED.moda = () => ({ sel: 'vestido', tallas: ['S', 'M', 'L', 'XL'], matriz: { vestido: { Blanco: [2, 4, 3, 0], Rosado: [1, 0, 2, 1], 'Azul cielo': [3, 2, 0, 1] }, camisa: { Blanco: [3, 5, 2, 1], Negro: [2, 2, 1, 0] }, 'chaqueta-jean': { Azul: [1, 3, 2, 1] }, buzo: { Gris: [2, 2, 1, 0], Crudo: [1, 1, 1, 1] } },
    separe: [{ cli: 'María José Pérez', foto: 'u-maria', prenda: 'Vestido de flores · M', total: 45000, abono: 20000, vence: enDias(8) }, { cli: 'Diana Mercado', foto: 'u-diana', prenda: 'Blusa campesina rosada · L', total: 45000, abono: 45000, vence: enDias(3) }, { cli: 'Yesica Cantillo', foto: 'u-yesica', prenda: 'Sandalias · 37 + blusa · S', total: 98000, abono: 30000, vence: enDias(20) }],
    cambios: [] });
  const COLOR = { Blanco: '#f3f1ea', Rosado: '#e8a1b6', 'Azul cielo': '#9cc9ea', Negro: '#222', Azul: '#3a5d8f', Gris: '#9a9a9a', Crudo: '#e6dcc4' };
  function pModa(t) {
    const k = st(t), p = LM.PR(k.sel) || prodsDe(t.id)[0], m = k.matriz[p.id] || {};
    const tot = Object.values(m).reduce((a, r) => a + r.reduce((x, y) => x + y, 0), 0);
    const masV = prodsDe(t.id).filter(x => x.fotoMini).sort((a, b) => (b.v || 0) - (a.v || 0)).slice(0, 4);
    return cab('Tallas y separados', MENU.moda[2], btn(I('plus') + 'Nueva venta', 'go', ' data-h="panel-pos"')) +
      '<div class="sv-split"><div>' + caja('', '<div class="sv-prenda">' + (p.fotoMini ? '<img src="' + esc(p.fotoMini) + '" alt="">' : '') + '<div><div class="sv-prenda-h"><div><h2>' + esc(p.n) + '</h2><small>Ref. ' + esc(p.id.toUpperCase().slice(0, 6)) + ' · ' + tot + ' unidades en total</small></div><b class="num">' + pesos(LM.precio(p).p) + '</b></div>' +
        '<small class="sv-sub">Existencias por color y talla (toca la casilla para vender)</small>' +
        (Object.keys(m).length ? '<table class="sv-matriz"><thead><tr><th></th>' + k.tallas.map(x => '<th>' + x + '</th>').join('') + '</tr></thead><tbody>' + Object.keys(m).map(c => '<tr><td><i style="background:' + (COLOR[c] || '#ccc') + '"></i>' + esc(c) + '</td>' + m[c].map((n, i) => '<td><button type="button" class="' + (n ? '' : 'cero') + '" data-act="sv-mo-vender" data-c="' + esc(c) + '" data-i="' + i + '"' + (n ? '' : ' disabled') + '>' + n + '</button></td>').join('') + '</tr>').join('') + '</tbody></table>' : '<p class="muted">Esta prenda todavía no tiene colores y tallas cargados.</p>') +
        '<div class="sv-chips izq">' + prodsDe(t.id).filter(x => k.matriz[x.id]).map(x => '<button type="button" class="' + (x.id === p.id ? 'on' : '') + '" data-act="sv-mo-sel" data-id="' + x.id + '">' + esc(x.n) + '</button>').join('') + '</div></div></div>') +
      caja('Más vendidos esta semana', '<div class="sv-masv">' + masV.map(x => '<button type="button" data-act="sv-mo-sel" data-id="' + x.id + '"><img src="' + esc(x.fotoMini) + '" alt=""><b>' + esc(x.n) + '</b><small class="num">' + pesos(LM.precio(x).p) + ' · ' + (x.v || 0) + ' vendidos</small></button>').join('') + '</div>') + '</div>' +
      '<aside class="sv-col">' + caja('Plan separe', k.separe.map((s, i) => { const lleno = s.abono >= s.total; return '<div class="sv-sep">' + av(s.cli, s.foto ? FOTO(s.foto) : '') + '<div><b>' + esc(s.cli) + '</b><small>' + esc(s.prenda) + '</small><i class="sv-barra' + (lleno ? ' verde' : '') + '"><em style="width:' + Math.round(s.abono / s.total * 100) + '%"></em></i><small>Abonó ' + pesos(s.abono) + ' de ' + pesos(s.total) + ' · ' + (lleno ? '<b class="verde">Lista para entregar</b>' : 'vence ' + fechaC(s.vence)) + '</small></div>' + btn(lleno ? 'Entregar' : 'Abonar', lleno ? 'sv-mo-entregar' : 'sv-mo-abonar', ' data-i="' + i + '"', 'gris chico') + '</div>'; }).join('') +
        '<p class="sv-nota">La prenda separada sale del inventario disponible pero no se cuenta como venta hasta que se paga completa.</p>', btn(I('plus') + 'Separar prenda', 'sv-mo-separar')) +
      caja('Cambios', '<p>Hasta 8 días con la factura de Mi Tienda. El cambio devuelve la prenda al inventario en su color y talla.</p>' + (k.cambios.length ? '<ul class="sv-log">' + k.cambios.slice(-3).map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>' : '') + btn('Hacer un cambio', 'sv-mo-cambio', '', 'gris')) + '</aside></div>';
  }
  const mo = () => st(tienda());
  A['sv-mo-sel'] = el => { mo().sel = el.dataset.id; guardar(tienda()); LM.rerender(); };
  A['sv-mo-vender'] = el => {
    const k = mo(), p = LM.PR(k.sel), talla = k.tallas[+el.dataset.i];
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(p.n) + '</small><h3>Vender ' + esc(el.dataset.c) + ' · talla ' + talla + '</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-mo-vender"><input type="hidden" name="c" value="' + esc(el.dataset.c) + '"><input type="hidden" name="i" value="' + el.dataset.i + '">' + pagoSel() + '<button class="sv-btn teal xl" type="submit">Cobrar ' + pesos(LM.precio(p).p) + '</button></form>');
  };
  F['sv-mo-vender'] = (f, d) => { const t = tienda(), k = mo(), p = LM.PR(k.sel), c = d.get('c'), i = +d.get('i'); k.matriz[p.id][c][i] = Math.max(0, k.matriz[p.id][c][i] - 1); bajar(p.id, 1); p.v = (p.v || 0) + 1; vender(t, p.n + ' ' + c + ' talla ' + k.tallas[i], LM.precio(p).p, d.get('m')); closeModal(); guardar(t); LM.rerender(); toast('Vendida. Quedan ' + k.matriz[p.id][c][i] + ' en esa talla.'); };
  A['sv-mo-abonar'] = el => {
    const s = mo().separe[+el.dataset.i];
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(s.cli) + '</small><h3>Abono a ' + esc(s.prenda) + '</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-mo-abonar"><input type="hidden" name="i" value="' + el.dataset.i + '"><p>Debe ' + pesos(s.total - s.abono) + '.</p><div class="campo"><label for="svAb">Valor del abono</label><input id="svAb" name="v" type="number" step="1000" min="1000" max="' + (s.total - s.abono) + '" value="' + Math.min(10000, s.total - s.abono) + '" required></div>' + pagoSel() + '<button class="sv-btn teal xl" type="submit">Recibir abono</button></form>');
  };
  F['sv-mo-abonar'] = (f, d) => { const t = tienda(), s = mo().separe[+d.get('i')], v = Math.min(+d.get('v') || 0, s.total - s.abono); s.abono += v; LM.NEG(t.id).ventas.push({ h: LM.hora(), d: 'Abono plan separe · ' + s.cli, v, m: d.get('m'), o: 'abono', por: ses().u, ts: Date.now() }); closeModal(); guardar(t); LM.rerender(); toast('Abono de ' + pesos(v) + ' recibido.'); };
  A['sv-mo-entregar'] = el => { const k = mo(), s = k.separe.splice(+el.dataset.i, 1)[0]; LM.logN(tienda().id, 'Entregó plan separe de ' + s.cli); guardar(tienda()); LM.rerender(); toast('Entregada a ' + s.cli + '.'); };
  A['sv-mo-separar'] = () => {
    const ps = prodsDe(tienda().id);
    sheet('<div class="sh-h"><div class="tt"><small>Plan separe</small><h3>Separar prenda</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-mo-separar">' +
      '<div class="campo"><label for="svSc">Cliente</label><input id="svSc" name="c" required></div><div class="campo"><label for="svSp">Prenda</label><select id="svSp" name="p">' + ps.map(p => '<option value="' + p.id + '">' + esc(p.n) + ' · ' + pesos(LM.precio(p).p) + '</option>').join('') + '</select></div>' +
      '<div class="row2"><div class="campo"><label for="svSt">Talla</label><input id="svSt" name="t" placeholder="S, M, 37…"></div><div class="campo"><label for="svSa">Primer abono</label><input id="svSa" name="a" type="number" step="1000" value="10000"></div></div><button class="sv-btn teal xl" type="submit">Separar</button></form>');
  };
  F['sv-mo-separar'] = (f, d) => { const p = LM.PR(d.get('p')); mo().separe.push({ cli: String(d.get('c')), prenda: p.n + (d.get('t') ? ' · ' + d.get('t') : ''), total: LM.precio(p).p, abono: Math.min(+d.get('a') || 0, LM.precio(p).p), vence: enDias(30) }); closeModal(); guardar(tienda()); LM.rerender(); toast('Prenda separada por 30 días.'); };
  A['sv-mo-cambio'] = () => {
    sheet('<div class="sh-h"><div class="tt"><small>Hasta 8 días</small><h3>Hacer un cambio</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-mo-cambio"><div class="campo"><label for="svCa">Prenda que devuelven</label><input id="svCa" name="a" required placeholder="Ej: vestido rosado L"></div><div class="campo"><label for="svCb">Prenda que se lleva</label><input id="svCb" name="b" required placeholder="Ej: vestido rosado M"></div><button class="sv-btn teal xl" type="submit">Registrar el cambio</button></form>');
  };
  F['sv-mo-cambio'] = (f, d) => { mo().cambios.push(LM.hora() + ' · ' + d.get('a') + ' → ' + d.get('b')); closeModal(); guardar(tienda()); LM.rerender(); toast('Cambio registrado.'); };

  /* ============================================================================================
     9. PESCA · acopio, nevera y liquidación
     ============================================================================================ */
  SEED.pesca = () => ({ hielo: 6, vendidoHoy: 512000, pagado: false, acopio: [{ p: 'Ovidio Rangel', e: 'bocachico-lb', lb: 38, pc: 6000 }, { p: 'Eliécer Pacheco', e: 'bagre', lb: 22, pc: 11000 }, { p: 'Toño Mercado', e: 'bocachico-lb', lb: 25, pc: 6000 }, { p: 'Rafael Ospino', e: 'mojarra-cienaga', lb: 14, pc: 7000 }, { p: 'Ovidio Rangel', e: 'bagre', lb: 8, pc: 11000 }],
    semana: { 'Ovidio Rangel': 96000, 'Eliécer Pacheco': 44000, 'Toño Mercado': 55000 } });
  function pPesca(t) {
    const k = st(t), ps = prodsDe(t.id), deuda = {};
    k.acopio.forEach(a => { deuda[a.p] = (deuda[a.p] || 0) + a.lb * a.pc; });
    Object.keys(k.semana).forEach(n => { deuda[n] = (deuda[n] || 0) + k.semana[n]; });
    const totDeuda = k.pagado ? 0 : Object.values(deuda).reduce((a, b) => a + b, 0), lbHoy = k.acopio.reduce((a, x) => a + x.lb, 0);
    return cab('Acopio y nevera', MENU.pesca[2]) +
      kpis([['pescado', 'Pescado recibido hoy', lbHoy + ' lb', 'De ' + new Set(k.acopio.map(a => a.p)).size + ' pescadores', 'teal'], ['sobre', 'Por pagar a pescadores', pesos(totDeuda), 'Se paga el sábado', 'oro'], ['cash', 'Vendido hoy', pesos(k.vendidoHoy), Math.round(ps.reduce((a, p) => a + (p.stock || 0), 0)) + ' lb quedan en la nevera'], ['gota', 'Hielo', k.hielo + ' bolsas', 'Comprado esta mañana']]) +
      '<div class="sv-split"><section class="sv-caja"><div class="sv-caja-h"><h2>Acopio de hoy · lo que trae cada pescador</h2>' + btn(I('plus') + 'Recibir pescado', 'sv-pe-recibir') + '</div>' +
      '<table class="sv-tabla"><thead><tr><th>Pescador</th><th>Especie</th><th>Libras</th><th>Precio de compra</th><th class="r">Le debemos</th></tr></thead><tbody>' + k.acopio.map(a => '<tr><td>' + av(a.p) + esc(a.p) + '</td><td>' + esc((LM.PR(a.e) || {}).n || a.e).replace(' fresco', '').replace(' de ciénaga', '') + '</td><td class="num"><b>' + a.lb + ' lb</b></td><td class="num">' + pesos(a.pc) + ' / lb</td><td class="r num"><b>' + pesos(a.lb * a.pc) + '</b></td></tr>').join('') + '</tbody></table>' +
      '<p class="sv-nota">Lo que entra por acopio suma al inventario de la nevera. Cada pescador ve en su celular lo que entregó y lo que se le debe.</p>' +
      '<form class="sv-form inline" data-form="sv-pe-vender"><select name="p" aria-label="Pescado">' + ps.map(p => '<option value="' + p.id + '">' + esc(p.n) + ' · ' + pesos(p.p) + '/lb</option>').join('') + '</select><input name="l" type="number" min="0.5" step="0.5" value="2" aria-label="Libras"><select name="m" aria-label="Pago">' + PAGOS.map(x => '<option value="' + x[0] + '">' + x[1] + '</option>').join('') + '</select><button class="sv-btn teal" type="submit">Vender por libra</button></form></section>' +
      '<aside class="sv-col">' + caja('Precio de venta hoy', ps.map(p => '<form class="sv-precio" data-form="sv-pe-precio"><input type="hidden" name="id" value="' + p.id + '">' + (p.fotoMini ? '<img src="' + esc(p.fotoMini) + '" alt="">' : '') + '<span><b>' + esc(p.n.replace(' fresco', '')) + '</b><small>Hay ' + p.stock + ' lb</small></span><label><span class="sr">Precio por libra</span><input name="v" type="number" step="500" value="' + p.p + '"></label><small>/ lb</small><button class="sv-x" type="submit" aria-label="Guardar precio">' + I('check') + '</button></form>').join('') +
        '<p class="sv-nota">' + esc(SV.perfil(t.id).dueno) + ' cambia el precio cada mañana según la subienda.</p>', pill('Publicado en Mi Tienda', 'verde')) +
      caja('Liquidación de la semana', (k.pagado ? '<p class="muted">Ya se pagó la semana. La próxima liquidación arranca de cero.</p>' : Object.keys(deuda).map(n => '<div class="sv-lin"><span>' + esc(n) + '</span><b class="num">' + pesos(deuda[n]) + '</b></div>').join('') + btn('Pagar el sábado · ' + pesos(totDeuda), 'sv-pe-pagar', '', 'gris'))) + '</aside></div>';
  }
  const pe = () => st(tienda());
  A['sv-pe-recibir'] = () => {
    const ps = prodsDe(tienda().id);
    sheet('<div class="sh-h"><div class="tt"><small>Acopio</small><h3>Recibir pescado</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-pe-recibir">' +
      '<div class="campo"><label for="svPn">Pescador</label><input id="svPn" name="p" required list="svPnL"><datalist id="svPnL">' + [...new Set(pe().acopio.map(a => a.p))].map(n => '<option value="' + esc(n) + '">').join('') + '</datalist></div>' +
      '<div class="campo"><label for="svPe">Especie</label><select id="svPe" name="e">' + ps.map(p => '<option value="' + p.id + '">' + esc(p.n) + '</option>').join('') + '</select></div>' +
      '<div class="row2"><div class="campo"><label for="svPl">Libras</label><input id="svPl" name="l" type="number" min="0.5" step="0.5" required></div><div class="campo"><label for="svPc">Precio de compra por libra</label><input id="svPc" name="c" type="number" step="500" value="6000" required></div></div><button class="sv-btn teal xl" type="submit">Recibir y sumar a la nevera</button></form>');
  };
  F['sv-pe-recibir'] = (f, d) => { const k = pe(), lb = +d.get('l'), p = LM.PR(d.get('e')); k.acopio.push({ p: String(d.get('p')).trim(), e: p.id, lb, pc: +d.get('c') }); k.pagado = false; p.stock = (p.stock || 0) + lb; closeModal(); guardar(tienda()); LM.rerender(); toast(lb + ' lb de ' + p.n + ' en la nevera.'); };
  F['sv-pe-precio'] = (f, d) => { const p = LM.PR(d.get('id')); p.p = +d.get('v') || p.p; LM.save(); LM.rerender(); toast('Precio de ' + p.n + ': ' + pesos(p.p) + ' / lb'); };
  F['sv-pe-vender'] = (f, d) => { const t = tienda(), k = pe(), p = LM.PR(d.get('p')), l = +d.get('l') || 1; if (l > (p.stock || 0)) { toast('Solo hay ' + p.stock + ' lb de ' + p.n + '.'); return; } const v = r100(p.p * l); vender(t, l + ' lb de ' + p.n, v, d.get('m')); bajar(p.id, l); k.vendidoHoy += v; guardar(t); LM.rerender(); toast('Venta de ' + pesos(v)); };
  A['sv-pe-pagar'] = () => { const t = tienda(), k = pe(), d = {}; k.acopio.forEach(a => { d[a.p] = (d[a.p] || 0) + a.lb * a.pc; }); Object.keys(k.semana).forEach(n => { d[n] = (d[n] || 0) + k.semana[n]; }); const tot = Object.values(d).reduce((a, b) => a + b, 0); gastar(t, 'Liquidación a pescadores', tot); k.pagado = true; k.semana = {}; k.acopio = []; guardar(t); LM.rerender(); toast('Liquidación pagada: ' + pesos(tot) + ' (queda en gastos).'); };

  /* ============================================================================================
     10. QUESERA · leche, producción y encargos
     ============================================================================================ */
  SEED.quesera = () => ({ queso: 42, suero: 36, porPagar: 1176000, leche: [{ finca: 'La Esperanza', quien: 'Don Ovidio', l: 140, pl: 2800, h: '5:40 a. m.' }, { finca: 'El Paraíso', quien: 'Wilfrido', l: 95, pl: 2800, h: '5:55 a. m.' }, { finca: 'Las Mercedes', quien: 'Nayibe', l: 80, pl: 2800, h: '5:58 a. m.' }, { finca: 'Villa Rosa', quien: 'Eder', l: 60, pl: 2800, h: '6:10 a. m.' }, { finca: 'San José', quien: 'Toño', l: 45, pl: 2800, h: '6:25 a. m.' }],
    encargos: [{ para: 'Rancho Costeño', que: '10 kg de queso costeño', fecha: enDias(2), estado: 'listo' }, { para: 'Tienda Mi Pueblo', que: '6 kg queso + 10 botellas de suero', fecha: enDias(2), estado: 'hacer' }, { para: 'Valentina Rangel', que: '2 kg queso duro (para un viaje)', fecha: enDias(4), estado: 'hacer' }] });
  function encargosH(l, act) {
    return l.map((e, i) => '<div class="sv-enc"><span class="sv-dr-ic">' + ic('cal') + '</span><div><b>' + esc(e.para) + '</b><span>' + esc(e.que) + '</span><small>Entrega ' + fechaC(e.fecha) + (e.cada ? ' · ' + esc(e.cada) : '') + '</small></div><button type="button" data-act="' + act + '" data-i="' + i + '">' + (e.estado === 'listo' ? pill('Listo', 'verde') : e.estado === 'entregado' ? pill('Entregado', 'gris') : pill(e.alistar ? 'Por alistar' : 'Por hacer', 'oro')) + '</button></div>').join('');
  }
  function pQuesera(t) {
    const k = st(t), ps = prodsDe(t.id), litros = k.leche.reduce((a, x) => a + x.l, 0);
    return cab('Producción y encargos', MENU.quesera[2]) +
      kpis([['gota', 'Leche recibida hoy', litros + ' L', 'De ' + k.leche.length + ' fincas', 'teal'], ['box', 'Queso producido', k.queso + ' kg', 'Unos 10 litros por kilo', 'oro'], ['gota', 'Suero costeño', k.suero + ' botellas', 'De 750 ml'], ['sobre', 'Por pagar a lecheros', pesos(k.porPagar + litros * 2800), 'Quincena del 15', 'rojo']]) +
      '<div class="sv-split"><div>' + caja('Leche recibida esta mañana', '<table class="sv-tabla"><thead><tr><th>Finca</th><th>Lechero</th><th>Litros</th><th>Precio por litro</th><th>Hora</th></tr></thead><tbody>' + k.leche.map(x => '<tr><td>' + esc(x.finca) + '</td><td>' + esc(x.quien) + '</td><td class="num"><b>' + x.l + ' L</b></td><td class="num">' + pesos(x.pl) + '</td><td>' + esc(x.h) + '</td></tr>').join('') + '</tbody></table>' +
        '<form class="sv-form inline" data-form="sv-qu-prod"><label>Queso hecho hoy (kg) <input name="q" type="number" step="0.5" value="' + k.queso + '"></label><label>Suero (botellas) <input name="s" type="number" value="' + k.suero + '"></label><button class="sv-btn gris" type="submit">Guardar producción</button></form>', btn(I('plus') + 'Recibir leche', 'sv-qu-leche')) +
      caja('Venta por peso', '<div class="sv-peso">' + ps.map(p => '<button type="button" data-act="sv-qu-peso" data-id="' + p.id + '"><b>' + esc(p.n.replace(' 750 ml', '')) + '</b><small>' + (p.medida === 'lb' ? 'por libra' : 'botella 750 ml') + '</small><span class="num">' + pesos(p.p) + '</span></button>').join('') + '</div><p class="sv-nota">Con la balanza: se pone el peso y Mi Tienda calcula el valor.</p>') + '</div>' +
      '<aside class="sv-col">' + caja('Encargos', encargosH(k.encargos, 'sv-qu-enc') + '<p class="sv-nota">Los encargos apartan el queso del inventario para que no se venda por fuera.</p>', btn(I('plus') + 'Nuevo encargo', 'sv-enc-nuevo')) + '</aside></div>';
  }
  const qu = () => st(tienda());
  A['sv-qu-leche'] = () => sheet('<div class="sh-h"><div class="tt"><small>Recibo de leche</small><h3>Recibir leche</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-qu-leche"><div class="row2"><div class="campo"><label for="svQf">Finca</label><input id="svQf" name="f" required></div><div class="campo"><label for="svQq">Lechero</label><input id="svQq" name="q" required></div></div><div class="row2"><div class="campo"><label for="svQl">Litros</label><input id="svQl" name="l" type="number" min="1" required></div><div class="campo"><label for="svQp">Precio por litro</label><input id="svQp" name="p" type="number" value="2800" required></div></div><button class="sv-btn teal xl" type="submit">Recibir</button></form>');
  F['sv-qu-leche'] = (f, d) => { qu().leche.push({ finca: String(d.get('f')), quien: String(d.get('q')), l: +d.get('l'), pl: +d.get('p'), h: LM.hora() }); closeModal(); guardar(tienda()); LM.rerender(); toast('Leche recibida'); };
  F['sv-qu-prod'] = (f, d) => { const k = qu(), q = +d.get('q') || 0, dq = q - k.queso; k.queso = q; k.suero = +d.get('s') || 0; const p = LM.PR('queso-costeno'); if (p && dq > 0) p.stock = (p.stock || 0) + dq * 2.2; guardar(tienda()); LM.rerender(); toast('Producción guardada' + (dq > 0 ? ': ' + Math.round(dq * 2.2) + ' lb más de queso en inventario' : '')); };
  A['sv-qu-peso'] = el => {
    const p = LM.PR(el.dataset.id);
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(p.n) + '</small><h3>Venta por peso</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-peso-v"><input type="hidden" name="id" value="' + p.id + '"><div class="campo"><label for="svPw">' + (p.medida === 'lb' ? 'Libras' : 'Cantidad') + '</label><input id="svPw" name="l" type="number" min="0.25" step="0.25" value="1" required></div>' + pagoSel() + '<button class="sv-btn teal xl" type="submit">Cobrar</button></form>');
  };
  F['sv-peso-v'] = (f, d) => { const t = tienda(), p = LM.PR(d.get('id')), l = +d.get('l') || 1, v = r100(p.p * l); vender(t, String(l).replace('.', ',') + (p.medida === 'lb' ? ' lb de ' : ' × ') + p.n, v, d.get('m')); bajar(p.id, l); closeModal(); guardar(t); LM.rerender(); toast('Venta de ' + pesos(v)); };
  A['sv-qu-enc'] = el => { const e = qu().encargos[+el.dataset.i]; e.estado = e.estado === 'hacer' ? 'listo' : e.estado === 'listo' ? 'entregado' : 'hacer'; guardar(tienda()); LM.rerender(); };
  A['sv-enc-nuevo'] = () => sheet('<div class="sh-h"><div class="tt"><small>' + esc(tienda().n) + '</small><h3>Nuevo encargo</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-enc-nuevo"><div class="campo"><label for="svEp">Para quién</label><input id="svEp" name="p" required></div><div class="campo"><label for="svEq">Qué</label><input id="svEq" name="q" required></div><div class="row2"><div class="campo"><label for="svEf">Entrega</label><input id="svEf" name="f" type="date" value="' + enDias(2) + '" required></div><div class="campo"><label for="svEc">Se repite</label><select id="svEc" name="c"><option value="">No</option><option>Cada semana</option><option>Cada martes</option></select></div></div><button class="sv-btn teal xl" type="submit">Guardar encargo</button></form>');
  F['sv-enc-nuevo'] = (f, d) => { const k = st(tienda()); k.encargos.push({ para: String(d.get('p')), que: String(d.get('q')), fecha: String(d.get('f')), estado: 'hacer', cada: String(d.get('c') || '') }); closeModal(); guardar(tienda()); LM.rerender(); toast('Encargo guardado'); };

  /* ============================================================================================
     11. DISTRIBUIDORA · rutas y preventa
     ============================================================================================ */
  SEED.ruta = () => ({ vendedor: 'Julio', ruta: 'Ruta Hatillo centro · martes y viernes', cobrado: 620000, paradas: [{ tid: 'tienda', h: '7:40 a. m.', estado: 'pedido', valor: 486000, x: 30, y: 24 }, { tid: 'chimi', h: '8:15 a. m.', estado: 'sin', valor: 0, x: 45, y: 17 }, { tid: 'rancho', h: '8:50 a. m.', estado: 'visitando', valor: 0, x: 52, y: 47 }, { tid: 'billar', h: '', estado: 'pendiente', valor: 0, debe: 210000, x: 72, y: 60 }, { tid: 'drogueria', h: '', estado: 'pendiente', valor: 0, x: 86, y: 72 }],
    pedidos: [{ tid: 'tienda', valor: 486000 }, { tid: 'panaderia', valor: 520000 }, { tid: 'granero', valor: 610000 }, { tid: 'jugos', valor: 324000 }], cartera: 845000, camion: false });
  const EST_R = { pedido: ['Visitada · pedido ', 'verde'], sin: ['Visitada · sin pedido', 'oro'], visitando: ['Visitando ahora', 'teal'], pendiente: ['Pendiente', 'lila'] };
  function pRuta(t) {
    const k = st(t), tot = k.pedidos.reduce((a, p) => a + p.valor, 0), vis = k.paradas.filter(p => p.estado === 'pedido' || p.estado === 'sin').length;
    const pts = k.paradas.map(p => p.x + ',' + p.y).join(' ');
    return cab('Rutas y preventa', MENU.ruta[2], btn(I('plus') + 'Nueva ruta', 'sv-ru-nueva')) +
      kpis([['mapa', 'Tiendas en la ruta de hoy', 12, vis + ' visitadas', 'teal'], ['receipt', 'Pedidos tomados', pesos(tot), k.pedidos.length + ' tiendas'], ['cash', 'Cobrado en la ruta', pesos(k.cobrado), 'Efectivo y Nequi', 'verde'], ['sobre', 'Cartera vencida', pesos(k.cartera), '3 tiendas', 'rojo']]) +
      '<div class="sv-split ancho"><section class="sv-mapa"><svg viewBox="0 0 100 90" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="90" fill="#e5ebe2"/><path d="M0 0h9v90H0z" fill="#a9d1ea"/>' + [15, 30, 45, 60, 75].map(y => '<path d="M9 ' + y + 'h91" stroke="#fff" stroke-width="1.6"/>').join('') + [22, 38, 54, 70, 86].map(x => '<path d="M' + x + ' 0v90" stroke="#fff" stroke-width="1.6"/>').join('') +
      '<path d="M9 40 100 22" stroke="#f6efd6" stroke-width="4"/><rect x="56" y="40" width="12" height="11" fill="#c9e4b9"/><polyline points="' + pts + '" fill="none" stroke="#111" stroke-width="1.6"/><polyline points="' + pts + '" fill="none" stroke="#c6f432" stroke-width="0.7" stroke-dasharray="2 1.5"/></svg>' +
      k.paradas.map(p => '<img class="sv-pin" style="left:' + p.x + '%;top:' + (p.y / 90 * 100) + '%" src="' + esc(SV.lg(LM.T(p.tid))) + '" alt="">').join('') +
      '<div class="sv-mapa-v">' + av(k.vendedor) + '<span><b>' + esc(k.vendedor) + ' · preventa</b><small>' + esc(k.ruta) + '</small></span></div></section>' +
      '<aside class="sv-det"><div class="sv-det-h"><h2>Paradas de hoy</h2></div>' + k.paradas.map((p, i) => { const n = LM.T(p.tid) || { n: p.tid }, e = EST_R[p.estado]; return '<button type="button" class="sv-parada" data-act="sv-ru-parada" data-i="' + i + '"><img src="' + esc(SV.lg(n)) + '" alt=""><span><b>' + esc(n.n) + '</b><small class="' + e[1] + '">' + e[0] + (p.estado === 'pedido' ? pesos(p.valor) : '') + (p.debe ? ' · debe ' + pesos(p.debe) : '') + '</small></span><em>' + esc(p.h) + '</em></button>'; }).join('') +
      '<p class="sv-nota">El vendedor toma el pedido en la tienda desde su celular; la bodega lo alista y sale en el camión del día siguiente.</p>' +
      '<div class="sv-pie">' + btn(ic('camion') + (k.camion ? 'Camión de mañana armado · ' : 'Armar camión de mañana · ') + k.pedidos.length + ' pedidos', 'sv-ru-camion', k.camion ? ' disabled' : '', 'teal xl') + '</div></aside></div>';
  }
  const ru = () => st(tienda());
  A['sv-ru-parada'] = el => {
    const k = ru(), p = k.paradas[+el.dataset.i], n = LM.T(p.tid) || { n: p.tid }, ps = prodsDe(tienda().id);
    sheet('<div class="sh-h"><div class="tt"><small>Parada</small><h3>' + esc(n.n) + '</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-ru-pedido"><input type="hidden" name="i" value="' + el.dataset.i + '">' +
      ps.map(x => '<div class="sv-lin"><span>' + esc(x.n) + ' · ' + pesos(x.p) + '</span><input name="q-' + x.id + '" type="number" min="0" value="0" style="max-width:80px" aria-label="Cantidad de ' + esc(x.n) + '"></div>').join('') +
      '<button class="sv-btn teal xl" type="submit">Tomar pedido</button>' + btn('Visitada sin pedido', 'sv-ru-sin', ' data-i="' + el.dataset.i + '"', 'gris') + (p.debe ? btn('Cobrar cartera · ' + pesos(p.debe), 'sv-ru-cobrar', ' data-i="' + el.dataset.i + '"', 'borde') : '') + '</form>');
  };
  F['sv-ru-pedido'] = (f, d) => { const k = ru(), p = k.paradas[+d.get('i')], ps = prodsDe(tienda().id), v = ps.reduce((a, x) => a + x.p * (+d.get('q-' + x.id) || 0), 0); if (!v) { toast('Pon al menos una cantidad.'); return; } p.estado = 'pedido'; p.valor = v; p.h = LM.hora(); k.pedidos.push({ tid: p.tid, valor: v }); k.camion = false; closeModal(); guardar(tienda()); LM.rerender(); toast('Pedido de ' + pesos(v) + ' tomado.'); };
  A['sv-ru-sin'] = el => { const p = ru().paradas[+el.dataset.i]; p.estado = 'sin'; p.h = LM.hora(); closeModal(); guardar(tienda()); LM.rerender(); };
  A['sv-ru-cobrar'] = el => { const t = tienda(), k = ru(), p = k.paradas[+el.dataset.i]; vender(t, 'Cartera · ' + (LM.T(p.tid) || {}).n, p.debe, 'efectivo', { o: 'cartera' }); k.cobrado += p.debe; k.cartera = Math.max(0, k.cartera - p.debe); p.debe = 0; closeModal(); guardar(t); LM.rerender(); toast('Cartera cobrada.'); };
  A['sv-ru-camion'] = () => { const k = ru(); k.camion = true; guardar(tienda()); LM.rerender(); toast('Camión armado con ' + k.pedidos.length + ' pedidos. La bodega ya tiene la lista.'); };
  A['sv-ru-nueva'] = () => { const k = ru(); k.paradas.forEach(p => { p.estado = 'pendiente'; p.valor = 0; p.h = ''; }); k.pedidos = []; k.camion = false; guardar(tienda()); LM.rerender(); toast('Ruta nueva: todas las paradas pendientes.'); };

  /* ============================================================================================
     12. AGRO · mostrador y visitas a fincas
     ============================================================================================ */
  SEED.agro = () => ({ finca: 'Finca La Esperanza', vendido: 1230000, fiado: 1860000,
    historial: { 'Finca La Esperanza': [{ f: '2 nov.', d: 'Purgante para 15 reses (con indicación del veterinario)', v: 135000 }, { f: '19 oct.', d: '4 bultos de sal mineralizada', v: 288000 }, { f: '5 oct.', d: 'Visita: revisión de potreros', v: 40000 }], 'Parcela El Limón': [{ f: '28 oct.', d: 'Semilla de maíz amarillo', v: 210000 }], 'Finca Villa Rosa': [{ f: '15 oct.', d: 'Vacuna aftosa para 20 reses', v: 160000 }] },
    visitas: [{ h: '9:00 a. m.', finca: 'Finca La Esperanza', quien: 'Don Ovidio', que: 'Vacas con diarrea · revisar 3 terneros', tipo: 'Veterinario' }, { h: '11:30 a. m.', finca: 'Parcela El Limón', quien: 'Rafael', que: 'Maíz amarillento · revisar suelo', tipo: 'Agrónoma' }, { h: '3:00 p. m.', finca: 'Finca Villa Rosa', quien: 'Eder', que: 'Vacunación de 20 reses (aftosa)', tipo: 'Veterinario' }] });
  function pAgro(t) {
    const k = st(t), ps = prodsDe(t.id).slice().sort((a, b) => (b.fotoMini ? 1 : 0) - (a.fotoMini ? 1 : 0)).slice(0, 4), h = k.historial[k.finca] || [];
    return cab('Mostrador y visitas', MENU.agro[2]) +
      kpis([['cash', 'Vendido hoy', pesos(k.vendido), 'Concentrados y semillas'], ['cal', 'Visitas a fincas', k.visitas.filter(v => !v.hecha).length, 'Hoy', 'teal'], ['sobre', 'Fiado a fincas', pesos(k.fiado), 'Se paga con la cosecha', 'oro'], ['alert', 'Por vencer', '2 productos', 'Vacunas en nevera', 'rojo']]) +
      '<div class="sv-split"><div>' + caja('Mostrador', '<div class="sv-tiles cuatro">' + ps.map(p => '<button type="button" class="sv-tile" data-act="sv-ag-vender" data-id="' + p.id + '"><span class="sv-ph">' + (p.fotoMini ? '<img src="' + esc(p.fotoMini) + '" alt="">' : ic('hoja')) + '</span><b>' + esc(p.n.split(' · ')[0]) + '</b><small>' + esc(p.n.split(' · ')[1] || p.sub) + '</small><span class="num">' + pesos(LM.precio(p).p) + '</span></button>').join('') + '</div>') +
      caja('Historial por finca · ' + esc(k.finca), '<div class="sv-chips izq">' + Object.keys(k.historial).map(f => '<button type="button" class="' + (f === k.finca ? 'on' : '') + '" data-act="sv-ag-finca" data-f="' + esc(f) + '">' + esc(f) + '</button>').join('') + '</div>' +
        '<table class="sv-tabla"><thead><tr><th>Fecha</th><th>Qué se hizo / se llevó</th><th class="r">Valor</th></tr></thead><tbody>' + h.map(x => '<tr><td>' + esc(x.f) + '</td><td>' + esc(x.d) + '</td><td class="r num">' + pesos(x.v) + '</td></tr>').join('') + '</tbody></table><p class="sv-nota">Así ' + esc(SV.perfil(t.id).dueno) + ' sabe qué se le ha vendido y recomendado a cada finca.</p>') + '</div>' +
      '<aside class="sv-col">' + caja('Visitas a fincas · hoy', k.visitas.map((v, i) => '<div class="sv-visita' + (v.hecha ? ' hecha' : '') + '"><b class="num">' + esc(v.h) + '</b><div><b>' + esc(v.finca) + '</b> · ' + esc(v.quien) + '<span>' + esc(v.que) + '</span>' + pill(v.tipo, 'verde') + '</div>' + (v.hecha ? pill('Hecha', 'gris') : btn('Hecha', 'sv-ag-hecha', ' data-i="' + i + '"', 'gris chico')) + '</div>').join('') +
        '<p class="sv-nota">El cliente pide la visita desde Mi Tienda y paga la consulta aparte de los productos.</p>', btn(I('plus') + 'Agendar visita', 'sv-ag-visita')) + '</aside></div>';
  }
  const ag = () => st(tienda());
  A['sv-ag-finca'] = el => { ag().finca = el.dataset.f; guardar(tienda()); LM.rerender(); };
  A['sv-ag-vender'] = el => {
    const p = LM.PR(el.dataset.id), fincas = Object.keys(ag().historial);
    sheet('<div class="sh-h"><div class="tt"><small>Mostrador</small><h3>' + esc(p.n) + '</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-ag-vender"><input type="hidden" name="id" value="' + p.id + '"><div class="row2"><div class="campo"><label for="svAq">Cantidad</label><input id="svAq" name="q" type="number" min="1" value="1"></div><div class="campo"><label for="svAf">Para la finca (opcional)</label><input id="svAf" name="f" list="svAfL"><datalist id="svAfL">' + fincas.map(f => '<option value="' + esc(f) + '">').join('') + '</datalist></div></div>' + pagoSel() + '<button class="sv-btn teal xl" type="submit">Cobrar</button></form>');
  };
  F['sv-ag-vender'] = (f, d) => { const t = tienda(), k = ag(), p = LM.PR(d.get('id')), q = +d.get('q') || 1, v = LM.precio(p).p * q, fi = String(d.get('f') || '').trim(); vender(t, q + ' × ' + p.n, v, d.get('m')); bajar(p.id, q); k.vendido += v; if (d.get('m') === 'fiado') k.fiado += v; if (fi) (k.historial[fi] = k.historial[fi] || []).unshift({ f: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }), d: q + ' × ' + p.n, v }); closeModal(); guardar(t); LM.rerender(); toast('Venta de ' + pesos(v)); };
  A['sv-ag-hecha'] = el => { const t = tienda(), k = ag(), v = k.visitas[+el.dataset.i]; v.hecha = true; vender(t, 'Visita · ' + v.finca, 40000, 'efectivo', { o: 'consulta' }); (k.historial[v.finca] = k.historial[v.finca] || []).unshift({ f: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }), d: 'Visita: ' + v.que, v: 40000 }); guardar(t); LM.rerender(); toast('Visita hecha. La consulta ($40.000) quedó en la caja.'); };
  A['sv-ag-visita'] = () => sheet('<div class="sh-h"><div class="tt"><small>' + esc(tienda().n) + '</small><h3>Agendar visita</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-ag-visita"><div class="row2"><div class="campo"><label for="svVf">Finca</label><input id="svVf" name="f" required></div><div class="campo"><label for="svVq">Quién</label><input id="svVq" name="q" required></div></div><div class="campo"><label for="svVd">Qué hay que revisar</label><input id="svVd" name="d" required></div><div class="row2"><div class="campo"><label for="svVh">Hora</label><input id="svVh" name="h" type="time" value="16:00"></div><div class="campo"><label for="svVt">Quién va</label><select id="svVt" name="t"><option>Veterinario</option><option>Agrónoma</option></select></div></div><button class="sv-btn teal xl" type="submit">Agendar</button></form>');
  F['sv-ag-visita'] = (f, d) => { ag().visitas.push({ h: h12(String(d.get('h') || '16:00')), finca: String(d.get('f')), quien: String(d.get('q')), que: String(d.get('d')), tipo: String(d.get('t')) }); closeModal(); guardar(tienda()); LM.rerender(); toast('Visita agendada'); };

  /* ============================================================================================
     13. GRANJA · recolección por galpón y encargos
     ============================================================================================ */
  SEED.granja = () => ({ galpones: [{ n: 'Galpón 1', gallinas: 260, huevos: 220, rotos: 3, foto: 'f-gallina' }, { n: 'Galpón 2', gallinas: 230, huevos: 192, rotos: 2, foto: 'f-gallinas' }], pollos: 18, concentrado: 6,
    encargos: [{ para: 'Rancho Costeño', que: '4 pollos criollos pelados', fecha: enDias(2), estado: 'listo' }, { para: 'Tienda Mi Pueblo', que: '10 panales de huevo', fecha: enDias(5), estado: 'hacer', alistar: true, cada: 'Cada martes' }, { para: 'Quesera El Playón', que: '2 panales', fecha: enDias(0), estado: 'hacer', alistar: true }] });
  function pGranja(t) {
    const k = st(t), huevos = k.galpones.reduce((a, g) => a + g.huevos, 0), ps = prodsDe(t.id);
    return cab('Producción y encargos', MENU.granja[2]) +
      kpis([['huevo', 'Huevos recogidos hoy', huevos, Math.floor(huevos / 30) + ' panales y ' + (huevos % 30) + ' sueltos', 'oro'], ['box', 'Pollos listos', k.pollos, 'De 3 meses o más', 'teal'], ['cal', 'Encargos de la semana', k.encargos.length, k.encargos.filter(e => e.estado !== 'entregado').length + ' pendientes', 'lila'], ['box', 'Concentrado', k.concentrado + ' bultos', 'Alcanza ' + Math.round(k.concentrado * 1.5) + ' días']]) +
      '<div class="sv-split"><div>' + caja('Recolección de hoy por galpón', '<div class="sv-galpones">' + k.galpones.map(g => '<div class="sv-galpon"><img src="' + esc(FOTO(g.foto)) + '" alt=""><div><b>' + esc(g.n) + '</b><small>' + g.gallinas + ' gallinas</small><span><b class="num">' + g.huevos + ' huevos</b> · ' + g.rotos + ' rotos</span></div></div>').join('') + '</div>', btn(I('plus') + 'Anotar recolección', 'sv-gj-anotar')) +
      caja('Lo que se publica hoy en Mi Tienda', ps.map(p => '<div class="sv-lin"><span>' + esc(p.n) + ' · ' + (p.stock > 0 ? 'quedan ' + p.stock : '<b class="rojo">agotado hoy</b>') + '</span><b class="num">' + pesos(LM.precio(p).p) + '</b></div>').join('') + '<p class="sv-nota">Cuando se acaba lo del día, sale "agotado hoy" y se puede encargar para otro día.</p>') + '</div>' +
      '<aside class="sv-col">' + caja('Encargos', encargosH(k.encargos, 'sv-gj-enc') + '<p class="sv-nota">Los encargos que se repiten (cada martes) se crean solos cada semana.</p>', btn(I('plus') + 'Nuevo encargo', 'sv-enc-nuevo')) + '</aside></div>';
  }
  const gj = () => st(tienda());
  A['sv-gj-anotar'] = () => sheet('<div class="sh-h"><div class="tt"><small>Recolección</small><h3>Anotar recolección</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-gj-anotar"><div class="campo"><label for="svGg">Galpón</label><select id="svGg" name="g">' + gj().galpones.map((g, i) => '<option value="' + i + '">' + esc(g.n) + '</option>').join('') + '</select></div><div class="row2"><div class="campo"><label for="svGb">Huevos buenos</label><input id="svGb" name="b" type="number" min="0" required></div><div class="campo"><label for="svGr">Rotos</label><input id="svGr" name="r" type="number" min="0" value="0"></div></div><p class="muted">Cada 30 huevos buenos suman un panal al producto "Huevos criollos x 30".</p><button class="sv-btn teal xl" type="submit">Anotar y sumar al inventario</button></form>');
  F['sv-gj-anotar'] = (f, d) => { const k = gj(), g = k.galpones[+d.get('g')], b = +d.get('b') || 0; g.huevos += b; g.rotos += +d.get('r') || 0; const p = LM.PR('huevos30'); if (p) p.stock = (p.stock || 0) + Math.floor(b / 30); closeModal(); guardar(tienda()); LM.rerender(); toast(b + ' huevos anotados en ' + g.n); };
  A['sv-gj-enc'] = el => { const e = gj().encargos[+el.dataset.i]; e.estado = e.estado === 'hacer' ? 'listo' : e.estado === 'listo' ? 'entregado' : 'hacer'; guardar(tienda()); LM.rerender(); };

  /* ============================================================================================
     14. RESTAURANTE · mis mesas (mesera) + cocina (comandas)
     ============================================================================================ */
  SEED.resto = t => {
    const ahora = Date.now(), it = (n, q, p, c) => ({ n, q, p, cocina: c || 'servido', ts: ahora - 10 * MIN });
    return { mesas: [{ id: 1, estado: 'libre', items: [] }, { id: 2, estado: 'ocupada', desde: ahora - 35 * MIN, items: [it('Asado especial', 2, 20000), it('Jugo natural 16 oz', 2, 3500)] }, { id: 3, estado: 'libre', items: [] },
      { id: 4, estado: 'lista', desde: ahora - 52 * MIN, cli: 'Luis Pacheco', items: [it('Pollo asado a la leña', 1, 32000, 'listo'), it('Hamburguesa con papas', 1, 18000, 'listo'), it('Gaseosa 400 ml', 2, 3000)] },
      { id: 5, estado: 'cuenta', desde: ahora - 70 * MIN, items: [it('Sancocho de gallina', 2, 18000), it('Jugo natural 16 oz', 1, 3500), it('Gaseosa 400 ml', 1, 2500)] },
      { id: 6, estado: 'libre', items: [] }, { id: 7, estado: 'cocina', desde: ahora - 25 * MIN, items: [Object.assign(it('Mojarra frita con patacón', 2, 28000, 'prep'), { ts: ahora - 12 * MIN }), Object.assign(it('Arroz con coco', 2, 4000, 'pend'), { ts: ahora - 12 * MIN })] },
      { id: 8, estado: 'ocupada', desde: ahora - 4 * MIN, items: [] }, { id: 9, estado: 'libre', items: [] }],
      qr: [{ mesa: 8, items: [{ n: 'Jugo de mango', q: 2, p: 3500 }], por: 'Cliente de la mesa 8' }],
      domis: [{ n: 1045, cli: 'Yesica Cantillo', items: [{ n: 'Asado especial', q: 1, nota: 'Con yuca y bollo' }, { n: 'Hamburguesa con papas', q: 1, nota: 'Sin cebolla' }], ts: ahora - 8 * MIN, estado: 'nuevo' }, { n: 1049, cli: 'Mesa 2 · para llevar', items: [{ n: 'Pollo asado a la leña', q: 1, nota: 'Medio' }], ts: ahora - 14 * MIN, estado: 'prep' }],
      pagos: [{ id: 1, mesa: 'Mesa 4', cli: 'Luis Pacheco', foto: 'u-luis', medio: 'breb', v: 66000 }], minAtraso: 10 };
  };
  const EST_M = { libre: ['Libre', ''], ocupada: ['Ocupada', 'teal'], cocina: ['En cocina', 'oro'], lista: ['Comida lista', 'verde'], cuenta: ['Pidió la cuenta', 'amar'] };
  const totMesa = m => m.items.reduce((a, i) => a + i.q * i.p, 0);
  function pResto(t) {
    const k = st(t), listas = k.mesas.filter(m => m.estado === 'lista');
    return cab('Mis mesas', esc(nombreYo()) + ' · ' + (ses().rol === 'dueno' ? 'todas las mesas' : 'entrada ' + LM.hora(Date.now() - 2.9 * H)), API().disponible ? btn(I('qr') + 'Mesas con QR', 'go', ' data-h="panel-mesas"', 'gris') : '') +
      listas.map(m => '<div class="sv-alerta verde">' + I('bell') + '<span><b>Mesa ' + m.id + ' · comida lista</b>' + esc(k.cocinero || 'Rubén') + ' la marcó lista. Llévala.</span>' + btn('Llevada', 'sv-re-llevada', ' data-id="' + m.id + '"', 'blanco') + '</div>').join('') +
      k.qr.map((q, i) => '<div class="sv-alerta borde">' + I('qr') + '<span><b>Mesa ' + q.mesa + ' pidió por QR</b>' + esc(q.items.map(x => x.q + ' ' + x.n.toLowerCase()).join(', ')) + ' · ' + pesos(q.items.reduce((a, x) => a + x.q * x.p, 0)) + '</span>' + btn('Confirmar', 'sv-re-qr', ' data-i="' + i + '"', 'teal') + '</div>').join('') +
      '<div class="sv-mesas-r">' + k.mesas.map(m => { const e = EST_M[m.estado]; return '<button type="button" class="sv-mr ' + m.estado + '" data-act="sv-re-mesa" data-id="' + m.id + '"><b class="num">' + m.id + '</b><span>' + e[0] + '</span><small class="num">' + (m.estado === 'cuenta' ? pesos(totMesa(m)) : m.desde ? durTxt(Date.now() - m.desde) : '') + '</small></button>'; }).join('') + '</div>';
  }
  const re = () => st(tienda());
  const mesaR = id => re().mesas.find(m => m.id === +id);
  A['sv-re-llevada'] = el => { const m = mesaR(el.dataset.id); m.items.forEach(i => { if (i.cocina === 'listo') i.cocina = 'servido'; }); m.estado = 'ocupada'; guardar(tienda()); LM.rerender(); toast('Mesa ' + m.id + ': servida.'); };
  A['sv-re-qr'] = el => { const k = re(), q = k.qr.splice(+el.dataset.i, 1)[0], m = mesaR(q.mesa); q.items.forEach(x => m.items.push({ n: x.n, q: x.q, p: x.p, cocina: 'pend', ts: Date.now() })); m.estado = 'cocina'; m.desde = m.desde || Date.now(); guardar(tienda()); LM.rerender(); toast('Pedido de la mesa ' + q.mesa + ' confirmado: va a cocina.'); };
  A['sv-re-mesa'] = el => {
    const t = tienda(), m = mesaR(el.dataset.id), menu = prodsDe(t.id), e = EST_M[m.estado];
    sheet('<div class="sh-h"><div class="tt"><small>' + e[0] + (m.desde ? ' · ' + durTxt(Date.now() - m.desde) : '') + '</small><h3>Mesa ' + m.id + '</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><div class="sh-b stack">' +
      (m.items.length ? m.items.map(i => '<div class="sv-lin"><span>' + i.q + ' × ' + esc(i.n) + ' <small>' + ({ pend: 'en cocina', prep: 'preparando', listo: 'lista', servido: 'servido' })[i.cocina] + '</small></span><b class="num">' + pesos(i.q * i.p) + '</b></div>').join('') + '<div class="sv-total"><span>Cuenta</span><b class="num">' + pesos(totMesa(m)) + '</b></div>' : '<p class="muted">Mesa sin pedido.</p>') +
      '<form class="stack" data-form="sv-re-pedir"><input type="hidden" name="id" value="' + m.id + '"><small class="sv-sub">Agregar al pedido (va a cocina)</small><div class="sv-menu">' + menu.map(p => '<label><span>' + esc(p.n) + '<small class="num">' + pesos(LM.precio(p).p) + '</small></span><input name="q-' + p.id + '" type="number" min="0" value="0" aria-label="Cantidad de ' + esc(p.n) + '"></label>').join('') + '</div><button class="sv-btn teal" type="submit">' + I('olla') + 'Enviar a cocina</button></form>' +
      (m.items.length && m.estado !== 'cuenta' ? btn('Pidió la cuenta', 'sv-re-cuenta', ' data-id="' + m.id + '"', 'gris') : '') +
      (m.items.length ? '<form class="stack" data-form="sv-re-cobrar"><input type="hidden" name="id" value="' + m.id + '">' + pagoSel() + '<button class="sv-btn teal xl" type="submit">' + I('check') + 'Cobrar ' + pesos(totMesa(m)) + ' y liberar</button></form>' : (m.estado !== 'libre' ? btn('Liberar la mesa', 'sv-re-liberar', ' data-id="' + m.id + '"', 'gris') : btn('Sentar clientes', 'sv-re-sentar', ' data-id="' + m.id + '"', 'teal'))) + '</div>');
  };
  F['sv-re-pedir'] = (f, d) => { const t = tienda(), m = mesaR(d.get('id')); let n = 0; prodsDe(t.id).forEach(p => { const q = +d.get('q-' + p.id) || 0; if (q) { n += q; m.items.push({ n: p.n, q, p: LM.precio(p).p, cocina: 'pend', ts: Date.now() }); } }); if (!n) { toast('Pon al menos una cantidad.'); return; } m.estado = 'cocina'; m.desde = m.desde || Date.now(); closeModal(); guardar(t); LM.rerender(); toast('Mesa ' + m.id + ': ' + n + ' producto(s) a cocina.'); };
  A['sv-re-cuenta'] = el => { const m = mesaR(el.dataset.id); m.estado = 'cuenta'; closeModal(); guardar(tienda()); LM.rerender(); toast('La cajera ve que la mesa ' + m.id + ' pidió la cuenta.'); };
  A['sv-re-sentar'] = el => { const m = mesaR(el.dataset.id); m.estado = 'ocupada'; m.desde = Date.now(); closeModal(); guardar(tienda()); LM.rerender(); };
  A['sv-re-liberar'] = el => { const m = mesaR(el.dataset.id); Object.assign(m, { estado: 'libre', items: [], desde: null }); closeModal(); guardar(tienda()); LM.rerender(); };
  F['sv-re-cobrar'] = (f, d) => { const t = tienda(), m = mesaR(d.get('id')), v = totMesa(m); vender(t, 'Mesa ' + m.id, v, d.get('m'), { o: 'mesa' }); Object.assign(m, { estado: 'libre', items: [], desde: null }); closeModal(); guardar(t); LM.rerender(); toast('Mesa ' + m.id + ' cobrada: ' + pesos(v)); };

  // --- cocina: comandas de las mesas, de los domicilios y de los pedidos de la app ---
  function comandas(t) {
    const k = st(t), out = [];
    k.mesas.forEach(m => { const it = m.items.filter(i => i.cocina === 'pend' || i.cocina === 'prep'); if (it.length) out.push({ k: 'm' + m.id, origen: 'Mesa ' + m.id, tipo: 'mesa', items: it, ts: Math.min.apply(null, it.map(i => i.ts || Date.now())), prep: it.some(i => i.cocina === 'prep'), quien: 'Mesera' }); });
    k.domis.filter(d => d.estado !== 'listo').forEach(d => out.push({ k: 'd' + d.n, origen: '#' + d.n + ' ' + (d.cli.indexOf('Mesa') === 0 ? 'Para llevar' : 'Domicilio'), tipo: 'dom', items: d.items, ts: d.ts, prep: d.estado === 'prep', quien: d.cli }));
    S().orders.filter(o => o.t === t.id && !o.rech && !o.cola && o.e >= 1 && o.e < LM.fin(o) && !(k.listos || []).includes(o.n)).forEach(o => out.push({ k: 'o' + o.n, origen: '#' + o.n + ' ' + ({ domicilio: 'Domicilio', alla: 'En el local', recoger: 'Para recoger' })[o.modo], tipo: o.modo === 'domicilio' ? 'dom' : 'loc', items: o.items.map(i => ({ q: i.q, n: (LM.PR(i.id) || {}).n || i.id, nota: o.nota || '' })), ts: o.te || o.ts, prep: (k.prepO || []).includes(o.n), quien: o.cliN || o.cli }));
    return out.sort((a, b) => a.ts - b.ts);
  }
  function pCocinaSV(t, N) {
    const k = st(t), ls = comandas(t), est = c => (Date.now() - c.ts) / MIN >= k.minAtraso ? 'atrasado' : c.prep ? 'prep' : 'nuevo';
    const atr = ls.filter(c => est(c) === 'atrasado').length;
    return '<div class="mt-kds sv-kds">' + cab('Cocina · ' + esc(t.n), ls.length + ' comandas' + (atr ? ' · <b class="rojo">' + atr + ' atrasada' + (atr > 1 ? 's' : '') + '</b>' : '') + '. Toca una comanda para empezarla; al terminar, LISTO.', btn(I('grid') + 'Pantalla completa', 'mt-kds-full', '', 'gris')) +
      (ls.length ? '<div class="mt-kds-grid">' + ls.map(c => '<article class="mt-cmd ' + est(c) + '" data-act="sv-kds-prep" data-k="' + c.k + '" tabindex="0"><header><b>' + esc(c.origen) + '</b><span class="num">' + I('clock') + '<span data-svt="' + c.ts + '" data-svf="min">' + durTxt(Date.now() - c.ts) + '</span></span></header><ul>' +
        c.items.map(i => '<li><b>' + i.q + '×</b> ' + esc(i.n) + (i.nota ? '<small>' + esc(i.nota) + '</small>' : '') + '</li>').join('') + '</ul><footer><small>' + esc(c.quien || '') + '</small>' + btn(I('check') + 'LISTO', 'sv-kds-listo', ' data-k="' + c.k + '"', 'verde') + '</footer></article>').join('') + '</div>' : '<div class="vacio">' + I('olla') + ' No hay comandas pendientes.</div>') +
      '<p class="mt-kds-ley"><i class="nuevo"></i>Recién llegada <i class="prep"></i>Preparando <i class="atrasado"></i>Atrasada (más de ' + k.minAtraso + ' min)</p>' +
      (ses().rol === 'dueno' ? '<form class="sv-form inline" data-form="sv-kds-min"><label>Una comanda se pone roja a los <input name="m" type="number" min="3" max="90" value="' + k.minAtraso + '"> minutos</label><button class="sv-btn gris" type="submit">Guardar</button></form>' : '') + '</div>';
  }
  pCocinaSV.v9 = true; pCocinaSV.cajero = true;
  A['sv-kds-prep'] = (el, ev) => {
    if (ev && ev.target && ev.target.closest('[data-act="sv-kds-listo"]')) return;
    const t = tienda(), k = st(t), id = el.dataset.k, n = +id.slice(1);
    if (id[0] === 'm') mesaR(n).items.forEach(i => { if (i.cocina === 'pend') i.cocina = 'prep'; else if (i.cocina === 'prep') i.cocina = 'pend'; });
    else if (id[0] === 'd') { const d = k.domis.find(x => x.n === n); d.estado = d.estado === 'prep' ? 'nuevo' : 'prep'; }
    else { k.prepO = k.prepO || []; const j = k.prepO.indexOf(n); if (j >= 0) k.prepO.splice(j, 1); else k.prepO.push(n); }
    guardar(t); LM.rerender();
  };
  A['sv-kds-listo'] = el => {
    const t = tienda(), k = st(t), id = el.dataset.k, n = +id.slice(1);
    if (id[0] === 'm') { const m = mesaR(n); m.items.forEach(i => { if (i.cocina === 'pend' || i.cocina === 'prep') i.cocina = 'listo'; }); m.estado = 'lista'; }
    else if (id[0] === 'd') { k.domis.find(x => x.n === n).estado = 'listo'; }
    else { k.listos = (k.listos || []).concat([n]); }
    k.cocinero = nombreYo(); LM.logN(t.id, 'Cocina marcó LISTO: ' + id); guardar(t); LM.rerender(); toast('Listo. Le avisamos a quien lo lleva.');
  };
  F['sv-kds-min'] = (f, d) => { const k = st(tienda()); k.minAtraso = Math.max(3, +d.get('m') || 15); guardar(tienda()); LM.rerender(); };

  /* ============================================================================================
     15. CAJA DEL TURNO (cajera de cualquier negocio)
     ============================================================================================ */
  function pTurno(t, N) {
    const s = ses(), N2 = LM.NEG(t.id); N2.sv = N2.sv || {};
    if (!N2.sv.caja) N2.sv.caja = { base: 100000, abierta: Date.now() - 4.2 * H, pagos: t.cat === 'comida' || t.cat === 'rapida' ? [] : [{ id: 1, mesa: 'Pedido #1052', cli: 'Luis Pacheco', foto: 'u-luis', medio: 'nequi', v: 48000 }], cobradoDemo: 318000, efectivoDemo: 154000 };
    const c = N2.sv.caja, k = keyDe(t) === 'resto' ? st(t) : null;
    const mias = N2.ventas.filter(v => v.por === s.u && (v.ts || 0) >= c.abierta);
    const cobrado = c.cobradoDemo + mias.reduce((a, v) => a + v.v, 0), ef = c.base + c.efectivoDemo + mias.filter(v => v.m === 'efectivo').reduce((a, v) => a + v.v, 0) - N2.gastos.filter(g => g.por === s.u).reduce((a, g) => a + g.v, 0);
    const pagos = (k ? k.pagos : []).concat(c.pagos).map(p => Object.assign({ src: k && k.pagos.includes(p) ? 'r' : 'c' }, p));
    const cuentas = k ? k.mesas.filter(m => m.estado === 'cuenta') : [];
    return cab('Caja · ' + esc(t.n), esc(nombreYo()) + ' · abierta ' + hora(c.abierta) + ' · base ' + pesos(c.base)) +
      '<div class="sv-kpis dos"><div class="sv-kpi"><small>Cobrado en mi turno</small><b class="num">' + pesos(cobrado) + '</b></div><div class="sv-kpi"><small>Efectivo en caja</small><b class="num">' + pesos(ef) + '</b></div></div>' +
      '<h3 class="sv-sub">Pagos por confirmar</h3>' + (pagos.length ? pagos.map(p => '<div class="sv-pago"><div class="sv-pago-h">' + av(p.cli, p.foto ? FOTO(p.foto) : '') + '<span><b>' + esc(p.mesa) + ' · ' + esc(p.cli) + '</b><small>Dice que pagó por ' + esc(LM.PAGO[p.medio] || p.medio) + '</small></span><b class="num">' + pesos(p.v) + '</b></div><div class="sv-2b">' + btn('No ha llegado', 'sv-tu-pago', ' data-id="' + p.id + '" data-s="' + p.src + '" data-ok="0"', 'borde rojo') + btn(I('check') + 'Sí llegó', 'sv-tu-pago', ' data-id="' + p.id + '" data-s="' + p.src + '" data-ok="1"', 'teal') + '</div></div>').join('') : '<p class="muted">No hay pagos por confirmar.</p>') +
      cuentas.map(m => '<button type="button" class="sv-cuenta" data-act="sv-re-mesa" data-id="' + m.id + '"><span class="sv-dr-ic amar">' + I('mesa') + '</span><span><b>Mesa ' + m.id + ' pidió la cuenta</b><small>Toca para cobrar</small></span><b class="num">' + pesos(totMesa(m)) + '</b></button>').join('') +
      '<div class="sv-2b">' + btn(I('wallet') + 'Anotar gasto', 'sv-tu-gasto', '', 'borde rojo') + btn(I('plus') + 'Nueva venta', 'go', ' data-h="panel-' + (keyDe(t) === 'tienda' ? 'atencion' : 'pos') + '"', 'teal') + '</div>' +
      (s.rol !== 'dueno' ? '<p class="sv-candado">' + I('lock') + 'El balance de la semana, la ganancia y el menú solo los ve ' + esc(SV.perfil(t.id).dueno) + '.</p>' : '');
  }
  pTurno.v9 = true; pTurno.cajero = true;
  A['sv-tu-pago'] = el => {
    const t = tienda(), N = LM.NEG(t.id), lista = el.dataset.s === 'r' ? st(t).pagos : N.sv.caja.pagos, i = lista.findIndex(p => p.id === +el.dataset.id), p = lista[i];
    if (el.dataset.ok === '1') { vender(t, p.mesa + ' · ' + p.cli, p.v, p.medio); lista.splice(i, 1); toast('Pago confirmado: ' + pesos(p.v) + ' por ' + (LM.PAGO[p.medio] || p.medio)); }
    else { p.cli = p.cli; lista.splice(i, 1); toast('Marcado como no llegado. Se le avisa al cliente para que revise.'); }
    guardar(t); LM.rerender();
  };
  A['sv-tu-gasto'] = () => sheet('<div class="sh-h"><div class="tt"><small>' + esc(tienda().n) + '</small><h3>Anotar gasto</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button></div><form class="sh-b stack" data-form="sv-tu-gasto"><div class="campo"><label for="svGd">¿En qué?</label><input id="svGd" name="d" required placeholder="Ej: hielo, gas, bolsas"></div><div class="campo"><label for="svGv">Valor</label><input id="svGv" name="v" type="number" min="100" step="100" required></div><button class="sv-btn teal xl" type="submit">Guardar gasto</button></form>');
  F['sv-tu-gasto'] = (f, d) => { const t = tienda(); gastar(t, String(d.get('d')), +d.get('v') || 0); closeModal(); guardar(t); LM.rerender(); toast('Gasto anotado'); };

  /* ======================= menú del panel (como en "7 propuestas de interfaz") ======================= */
  const PANTALLA = { billar: pBillar, barberia: pBarberia, tienda: pTienda, drogueria: pDrogueria, taller: pTaller, granero: pGranero, ferreteria: pFerreteria, moda: pModa, pesca: pPesca, quesera: pQuesera, ruta: pRuta, agro: pAgro, granja: pGranja, resto: pResto };
  function pAtencion(t, N) { traer(t.id); return '<div class="sv-at">' + PANTALLA[keyDe(t)](t, N) + '</div>'; }
  pAtencion.v9 = true; pAtencion.cajero = true;
  E.panelFn.atencion = pAtencion;
  E.panelFn.turno = pTurno;
  const _cocina = E.panelFn.cocina;
  const pCocina2 = function (t, N, o, c) { traer(t.id); return keyDe(t) === 'resto' ? pCocinaSV(t, N) : _cocina(t, N, o, c); };
  pCocina2.v9 = true; pCocina2.cajero = true; E.panelFn.cocina = pCocina2;
  const VIEJAS = ['mesas', 'turnos', 'ordenes', 'apartados', 'lotes', 'mayor', 'medida', 'acopio', 'produccion', 'rutas', 'granja', 'formulas', 'pos', 'billar'];
  const GRUPOS = [['HOY', ['tablero', 'pedidos', 'atencion', 'cocina', 'turno', 'caja', 'domicilios']], ['DINERO', ['gastos', 'balance']], ['NEGOCIO', ['productos', 'inventario', 'etiquetas', 'promos', 'vitrina', 'clientes', 'resenas', 'pqr', 'preguntas']], ['EQUIPO', ['empleados', 'asistencia', 'config', 'historial']]];
  const NOMBRE = { tablero: 'Tablero', pedidos: 'Pedidos de Mi Tienda', caja: 'Caja', clientes: 'Clientes y fiado', resenas: 'Reseñas', empleados: 'Empleados y roles', config: 'Configuración', etiquetas: 'Etiquetas QR' };
  const _items = E.panelItems;
  E.panelItems = (items, t, caj) => {
    items = _items(items, t, caj).filter(x => x[0] !== 'sep' && !VIEJAS.includes(x[0]));
    const m = MENU[keyDe(t)];
    items.push(['atencion', m[0], m[1], cuenta(t)]);
    if (caj) items.push(['turno', 'cash', 'Caja de mi turno']);
    if (!caj) items.push(['vitrina', 'eye', 'Mi vitrina y cupones']);
    const por = {}; items.forEach(x => { por[x[0]] = x; if (NOMBRE[x[0]]) x[2] = NOMBRE[x[0]]; });
    const out = [];
    GRUPOS.forEach(([g, keys]) => { const l = keys.filter(k => por[k]).map(k => por[k]); if (l.length) { out.push(['grp', g]); out.push(...l); } });
    items.filter(x => !GRUPOS.some(g => g[1].includes(x[0]))).forEach(x => out.push(x));
    return out;
  };
  function cuenta(t) {
    try {
      const k = st(t), key = keyDe(t);
      const n = { billar: () => k.mesas.filter(m => m.ini).length, barberia: () => k.fila.length, tienda: () => k.armar.length, drogueria: () => k.rx.filter(r => r.estado === 'revision').length, taller: () => k.ordenes.length, granero: () => k.pedidos.length, ferreteria: () => k.cot.length, pesca: () => 0, resto: () => k.mesas.filter(m => m.estado === 'lista' || m.estado === 'cuenta').length + k.qr.length }[key];
      return n ? (n() || undefined) : undefined;
    } catch (e) { return undefined; }
  }
  // ¿Qué ve cada rol?
  const _perm = E.permitidas;
  E.permitidas = (rol, t, extra) => {
    if (rol === 'atencion') return ['atencion', 'pedidos', 'asistencia'];
    if (rol === 'mesero') return ['atencion', 'pedidos', 'asistencia', 'mesas'].concat(keyDe(t) === 'resto' ? ['cocina'] : []); // 'mesas' = mesas con QR del servidor
    if (rol === 'cajero') return ['turno', 'pos', 'atencion', 'pedidos', 'gastos', 'domicilios', 'asistencia', 'mesas'];
    return _perm(rol, t, extra);
  };
  const _ir = E.irSegunRol;
  E.irSegunRol = () => {
    const s = ses(); if (!s) return;
    if (s.rol === 'atencion' || s.rol === 'mesero') { LM.go('panel-atencion'); return; }
    if (s.rol === 'cajero') { LM.go(keyDe(LM.T(s.t)) === 'tienda' ? 'panel-atencion' : 'panel-turno'); return; }
    return _ir();
  };
  const _rn = E.rolNombre;
  E.rolNombre = r => { const s = ses(); if (s && s.t && s.rol === r && r !== 'dueno') { const c = SV.cargoDe(s.t, s.u) || s.cargo; if (c) return c; } return r === 'atencion' ? 'Atención' : _rn(r); };
  // Pie del menú: la persona que está dentro
  E.panelPie = (t, s) => '<div class="sv-yo">' + av(nombreYo(), SV.fotoDe(t.id, s.u)) + '<span><b>' + esc(nombreYo()) + '</b><small>' + esc(E.rolNombre(s.rol)) + (s.rol === 'dueno' ? ' · todo el acceso' : '') + '</small></span></div>';
  E.panelTopExtra = (t, s, sec) => '<span class="sv-pill amar">' + I('cash') + 'Caja abierta</span>';
  // Al entrar, el cargo del empleado queda en la sesión
  const _tl = E.trasLogin;
  E.trasLogin = (...a) => { const r = _tl(...a); const s = ses(); if (s && s.t && s.rol !== 'cliente') { const c = SV.cargoDe(s.t, s.u); if (c) s.cargo = c; LM.save(); } if (s && s.rol === 'cliente' && location.hash === '#demo') setTimeout(() => LM.go('inicio'), 300); return r; };
  // Si el dueño borra a alguien del equipo de ejemplo, no vuelve a aparecer
  const _del = LM.A['emp-del'];
  if (_del) LM.A['emp-del'] = el => { const N = LM.NEG(ses().t), e = N.emp[+el.dataset.k]; if (e) { N.svBorrados = (N.svBorrados || []).concat([e.u]); } return _del(el); };

  /* ======================= vitrina: portada, frase y cupones (lo edita el dueño) ======================= */
  const FOTOS_PORTADA = ['f-puesto-comida', 'f-lena-fuego', 'f-fogon', 'f-fresas', 'f-limon', 'f-campo', 'f-cultivo', 'f-gallinas', 'f-canoas', 'f-rio', 'f-tienda-ropa', 'f-tenis', 'f-ladrillo', 'f-rueda', 'f-musica-dj', 'f-reloj', 'f-cafe-grano', 'f-camioneta', 'f-flores', 'f-helado'];
  function pVitrina(t, N) {
    const p = SV.perfil(t.id), cups = S().cupones.filter(c => c.t === t.id);
    const v = (N.sv && N.sv.vitrina) || {};
    return cab('Mi vitrina y cupones', 'Así se ve tu negocio cuando un cliente entra a tu tienda en Mi Tienda.', btn(I('eye') + 'Ver mi negocio', 'go', ' data-h="t-' + t.id + '"', 'teal')) +
      '<div class="sv-split"><div>' + caja('Portada', '<div class="sv-port-prev" style="--bg:url(' + esc(SV.abs(/^data:/.test(p.portada) ? p.portada : FOTO(p.portada))) + ')"><img src="' + esc(SV.lg(t)) + '" alt=""><b>' + esc(t.n) + '</b></div>' +
        '<small class="sv-sub">Escoge una foto o sube la tuya</small><div class="sv-fotos-g">' + FOTOS_PORTADA.map(f => '<button type="button" class="' + (p.portada === f ? 'on' : '') + '" data-act="sv-vi-port" data-f="' + f + '"><img src="' + esc(FOTO(f)) + '" alt=""></button>').join('') + '</div>' +
        '<label class="sv-btn gris">' + I('camera') + 'Subir foto de portada<input type="file" accept="image/*" data-chg="sv-vi-subir" hidden></label>') +
      caja('Lo que dices de tu negocio', '<form class="stack" data-form="sv-vi-datos"><div class="row2"><div class="campo"><label for="svVd1">Tu nombre</label><input id="svVd1" name="dueno" value="' + esc(p.dueno) + '"></div><div class="campo"><label for="svVd2">Tu cargo</label><input id="svVd2" name="cargo" value="' + esc(p.cargo) + '"></div></div>' +
        '<div class="campo"><label for="svVd3">Tu frase para los clientes</label><input id="svVd3" name="frase" maxlength="140" value="' + esc(p.frase) + '"></div>' +
        '<div class="row2"><div class="campo"><label for="svVd4">Promoción destacada</label><input id="svVd4" name="b0" value="' + esc(p.banner[0]) + '"></div><div class="campo"><label for="svVd5">Detalle</label><input id="svVd5" name="b1" value="' + esc(p.banner[1]) + '"></div></div>' +
        '<button class="sv-btn teal" type="submit">Guardar</button></form>') + '</div>' +
      '<aside class="sv-col">' + caja('Cupones del negocio', (cups.length ? cups.map(c => '<div class="sv-cup-adm"><div><b>' + esc(c.code) + '</b><small>' + esc(LM.cupTxt(LM.cupDe(c))) + (c.vence ? ' · vence ' + new Date(c.vence).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '') + ' · ' + (c.usos || 0) + ' usos</small></div>' +
        '<button type="button" class="sv-sw' + (c.activo ? ' on' : '') + '" data-act="sv-vi-cup" data-id="' + esc(c.id) + '" aria-pressed="' + !!c.activo + '"><i></i>' + (c.activo ? 'Activo' : 'Apagado') + '</button></div>').join('') : '<p class="muted">Todavía no tienes cupones.</p>') +
        '<h3 class="sv-sub">Crear cupón</h3><form class="stack" data-form="sv-vi-cupon"><div class="campo"><label for="svCuT">Tipo</label><select id="svCuT" name="tipo" data-chg="sv-vi-tipo"><option value="fijo">Valor fijo (ej: $2.000 desde $15.000)</option><option value="pct">Porcentaje (ej: 10 %)</option><option value="regalo">Regalo (ej: jugo gratis con 2 asados)</option></select></div>' +
        '<div class="row2"><div class="campo"><label for="svCuC">Código</label><input id="svCuC" name="code" required maxlength="14" style="text-transform:uppercase" placeholder="EJ: RANCHO2000"></div><div class="campo sv-cu-v"><label for="svCuV">Valor ($ o %)</label><input id="svCuV" name="valor" type="number" min="1" value="2000"></div></div>' +
        '<div class="campo sv-cu-m"><label for="svCuM">Pedido mínimo</label><input id="svCuM" name="min" type="number" min="0" step="1000" value="15000"></div>' +
        '<div class="sv-cu-r" hidden><div class="campo"><label for="svCuR">¿Qué regalas?</label><input id="svCuR" name="regalo" placeholder="Jugo natural gratis"></div><div class="row2"><div class="campo"><label for="svCuP">Al comprar</label><select id="svCuP" name="prod">' + prodsDe(t.id).map(x => '<option value="' + x.id + '">' + esc(x.n) + '</option>').join('') + '</select></div><div class="campo"><label for="svCuQ">Cantidad</label><input id="svCuQ" name="q" type="number" min="1" value="2"></div></div></div>' +
        '<div class="campo"><label for="svCuF">Vence</label><input id="svCuF" name="vence" type="date" value="' + enDias(7) + '" required></div><button class="sv-btn teal" type="submit">' + I('ticket') + 'Crear cupón</button></form>') + '</aside></div>';
  }
  pVitrina.v9 = true; E.panelFn.vitrina = pVitrina;
  const vit = () => { const N = LM.NEG(ses().t); N.sv = N.sv || {}; N.sv.vitrina = N.sv.vitrina || {}; return N.sv.vitrina; };
  A['sv-vi-port'] = el => { vit().portada = el.dataset.f; guardar(tienda()); LM.rerender(); toast('Portada cambiada'); };
  LM.A['sv-vi-subir'] = el => {
    const f = el.files && el.files[0]; if (!f) return;
    const img = new Image(), url = URL.createObjectURL(f);
    img.onload = () => { const c = document.createElement('canvas'), w = 1200, h = Math.round(w * img.height / img.width); c.width = w; c.height = Math.min(h, 500); const x = c.getContext('2d'); x.drawImage(img, 0, (c.height - h) / 2, w, h); vit().portada = c.toDataURL('image/jpeg', 0.62); URL.revokeObjectURL(url); guardar(tienda()); LM.rerender(); toast('Portada subida'); };
    img.src = url;
  };
  F['sv-vi-datos'] = (f, d) => { const v = vit(); v.dueno = String(d.get('dueno') || '').trim() || undefined; v.cargo = String(d.get('cargo') || '').trim() || undefined; v.frase = String(d.get('frase') || '').trim() || undefined; const p = SV.perfil(tienda().id); v.banner = [String(d.get('b0') || p.banner[0]), String(d.get('b1') || p.banner[1]), p.banner[2]]; Object.keys(v).forEach(k => v[k] === undefined && delete v[k]); guardar(tienda()); LM.rerender(); toast('Guardado. Así lo ven los clientes.'); };
  LM.A['sv-vi-tipo'] = el => { const f = el.form, t = el.value; f.querySelector('.sv-cu-r').hidden = t !== 'regalo'; f.querySelector('.sv-cu-v').hidden = t === 'regalo'; f.querySelector('.sv-cu-m').hidden = t !== 'fijo'; f.querySelector('#svCuV').value = t === 'pct' ? 10 : 2000; };
  const espejoCupones = t => { const N = LM.NEG(t.id); N.sv = N.sv || {}; N.sv.cupones = S().cupones.filter(c => c.t === t.id); guardar(t); };
  F['sv-vi-cupon'] = (f, d) => {
    const t = tienda(), code = String(d.get('code') || '').trim().toUpperCase().replace(/\s+/g, ''), tipo = d.get('tipo');
    if (!code) return; if (S().cupones.some(c => c.t === t.id && c.code === code)) { toast('Ya tienes un cupón con ese código.'); return; }
    const c = { id: 'cu' + Date.now(), t: t.id, code, tipo, activo: true, usos: 0, pct: 0, vence: new Date(d.get('vence') + 'T23:59:00').getTime() };
    if (tipo === 'pct') c.pct = Math.min(50, Math.max(1, +d.get('valor') || 10));
    if (tipo === 'fijo') { c.valor = Math.max(500, +d.get('valor') || 2000); c.min = +d.get('min') || 0; }
    if (tipo === 'regalo') { c.regalo = String(d.get('regalo') || 'Regalo').trim(); c.cond = { prod: d.get('prod'), q: Math.max(1, +d.get('q') || 1) }; }
    c.svNota = 'Válido hasta el ' + new Date(c.vence).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric' });
    S().cupones.push(c); LM.logN(t.id, 'Creó el cupón ' + code); espejoCupones(t); LM.rerender(); toast('Cupón ' + code + ' creado. Ya sale en tu tienda.');
  };
  A['sv-vi-cup'] = el => { const c = S().cupones.find(x => x.id === el.dataset.id); c.activo = !c.activo; espejoCupones(tienda()); LM.rerender(); };

  /* ======================= lo que el cliente hace desde la tienda ======================= */
  const pub = tid => SV.publico ? SV.publico(tid) : null;
  SV.atencionCliente = t => {
    const key = keyDe(t), N = LM.NEG(t.id), local = N.sv && N.sv[key];
    if (key === 'billar') {
      const P = pub(t.id), mesas = P && P.mesas ? P.mesas : (local || SEED.billar()).mesas.map(m => ({ id: m.id, n: m.n, tipo: m.tipo, estado: m.ini ? 'ocupada' : (m.apartada && m.apartada.hasta > Date.now() ? 'apartada' : 'libre') }));
      const tar = (P && P.tarifas) || (local || {}).tarifas || { Pool: 6000, Carambola: 7000 }, libres = mesas.filter(m => m.estado === 'libre');
      return '<section class="sv-box sv-cli-at"><div class="sv-h"><h2>Mesas libres ahora</h2><b class="verde num">' + libres.length + ' de ' + mesas.length + '</b></div><div class="sv-mini-mesas">' + mesas.map(m => '<button type="button" class="' + m.estado + '"' + (m.estado === 'libre' ? ' data-act="sv-cl-apartar" data-id="' + m.id + '"' : ' disabled') + '>' + mesaSVG(m.estado !== 'libre', m.tipo) + '<small>' + m.id + ' · ' + (m.estado === 'libre' ? 'Libre' : m.estado === 'apartada' ? 'Apartada' : 'Ocupada') + '</small></button>').join('') + '</div>' +
        '<div class="sv-lin"><span>Pool · la hora</span><b class="num">' + pesos(tar.Pool) + '</b></div><div class="sv-lin"><span>Carambola · la hora</span><b class="num">' + pesos(tar.Carambola) + '</b></div>' +
        '<p class="sv-aviso amar">' + I('alert') + 'Venta de licor solo a mayores de 18 años.</p><p class="muted">Toca una mesa libre para apartarla por 15 minutos. Si no llegas, queda libre otra vez.</p></section>';
    }
    if (key === 'barberia') {
      const b = local || SEED.barberia(), P = pub(t.id), C = SV.turnoCli = SV.turnoCli || { s: 'corte-barba', b: '', h: '' };
      const ocup = id => { if (P && P.barberos) { const x = P.barberos.find(y => y.id === id); return x ? x.ocupados : []; } const x = b.barberos.find(y => y.id === id); return x ? x.agenda.filter(e => e.dia === hoyISO()).map(e => e.h) : []; };
      const horas = ['15:30', '16:00', '16:30', '17:00', '17:30', '18:00'], s = b.servicios.find(x => x.id === C.s) || b.servicios[0];
      const tomada = h => C.b ? ocup(C.b).includes(h) : b.barberos.every(x => ocup(x.id).includes(h));
      return '<section class="sv-box sv-cli-at"><div class="sv-h"><h2>Pedir turno</h2><small>Hay <b>' + ((P && P.fila) != null ? P.fila : b.fila.length) + ' en la fila</b> del local</small></div>' +
        '<small class="sv-sub">1 · ¿Qué te vas a hacer?</small><div class="sv-opc">' + b.servicios.slice(0, 3).map(x => '<button type="button" class="' + (x.id === s.id ? 'on' : '') + '" data-act="sv-cl-tu" data-k="s" data-v="' + x.id + '"><span><b>' + esc(x.n) + '</b> · ' + x.min + ' min</span><b class="num">' + pesos(x.p) + '</b></button>').join('') + '</div>' +
        '<small class="sv-sub">2 · ¿Con quién?</small><div class="sv-opc tres">' + b.barberos.map(x => '<button type="button" class="' + (C.b === x.id ? 'on' : '') + '" data-act="sv-cl-tu" data-k="b" data-v="' + x.id + '">' + av(x.n, x.foto ? FOTO(x.foto) : '') + esc(x.n) + '</button>').join('') + '<button type="button" class="' + (!C.b ? 'on' : '') + '" data-act="sv-cl-tu" data-k="b" data-v="">' + I('users') + 'El que esté libre</button></div>' +
        '<small class="sv-sub">3 · ¿A qué hora? · hoy</small><div class="sv-horas">' + horas.map(h => '<button type="button" class="' + (C.h === h ? 'on' : '') + '"' + (tomada(h) ? ' disabled' : ' data-act="sv-cl-tu" data-k="h" data-v="' + h + '"') + '>' + h12(h).replace(' p. m.', '') + '</button>').join('') + '</div>' +
        btn(C.h ? 'Pedir turno ' + h12(C.h) + (C.b ? ' con ' + esc(b.barberos.find(x => x.id === C.b).n) : '') + ' · ' + pesos(s.p) : 'Escoge la hora', 'sv-cl-turno', C.h ? '' : ' disabled', 'teal xl') + '</section>';
    }
    if (key === 'taller') return '<section class="sv-box sv-cli-at"><div class="sv-h"><h2>¿Tu moto está en el taller?</h2></div><form class="sv-form inline" data-form="sv-cl-moto"><input name="ot" required placeholder="Número de orden, ej: OT-218" style="text-transform:uppercase" aria-label="Número de orden"><button class="sv-btn teal" type="submit">Ver mi moto</button></form><p class="muted">Ahí ves el diagnóstico, la cotización y la apruebas. El taller no toca tu moto sin tu aprobación.</p></section>';
    if (key === 'drogueria') return '<section class="sv-box sv-cli-at"><div class="sv-aviso">' + ic('sobre') + '<span><b>¿Tu medicamento necesita fórmula?</b> Pídelo normal y envía la foto de la fórmula por el chat del pedido. La regente la revisa antes de despacharlo, y el domiciliario te pide ver la original al entregar.</span></div></section>';
    return '';
  };
  A['sv-cl-tu'] = el => { SV.turnoCli[el.dataset.k] = el.dataset.v; if (el.dataset.k === 'b') SV.turnoCli.h = ''; const box = el.closest('.sv-cli-at'); if (box) { const tid = (location.hash || '').slice(3); box.outerHTML = SV.atencionCliente(LM.T(tid)); LM.paint(document.getElementById('app')); } };
  A['sv-cl-turno'] = () => LM.needCli(async () => {
    const tid = (location.hash || '').slice(3), t = LM.T(tid), C = SV.turnoCli, b = st(t), s = b.servicios.find(x => x.id === C.s);
    if (API().disponible && API().yo) {
      try { const r = await API().post('/api/sv/' + tid + '/cliente', { accion: 'turno', servicio: C.s, barbero: C.b, hora: C.h }); toast('Turno pedido: ' + h12(r.hora) + ' con ' + r.barbero + '. Te esperamos.'); SV.cargarPublico && (delete (SV.publico(tid) || {}).x); C.h = ''; LM.rerender(); return; }
      catch (e) { if (e.codigo !== 'sin_datos') { toast(e.message); return; } }
    }
    const libre = x => !x.agenda.some(e => e.dia === hoyISO() && e.h === C.h);
    const x = C.b ? b.barberos.find(y => y.id === C.b) : b.barberos.find(libre);
    if (!x || !libre(x)) { toast('Esa hora ya la tomaron. Escoge otra.'); return; }
    x.agenda.push({ dia: hoyISO(), h: C.h, cli: S().user.nombre, tel: S().user.cel || '', servicio: s.id, app: true, estado: 'turno' });
    guardar(t); toast('Turno pedido: ' + h12(C.h) + ' con ' + x.n + ' · ' + pesos(s.p)); C.h = ''; LM.rerender();
  });
  A['sv-cl-apartar'] = el => LM.needCli(async () => {
    const tid = (location.hash || '').slice(3), t = LM.T(tid), id = +el.dataset.id;
    if (API().disponible && API().yo) {
      try { const r = await API().post('/api/sv/' + tid + '/cliente', { accion: 'apartar-mesa', mesa: id }); toast(r.mesa + ' apartada hasta las ' + hora(r.hasta) + '.'); LM.rerender(); return; }
      catch (e) { if (e.codigo !== 'sin_datos') { toast(e.message); return; } }
    }
    const m = st(t).mesas.find(x => x.id === id); if (m.ini) { toast('Esa mesa ya está ocupada.'); return; }
    m.apartada = { por: S().user.nombre, hasta: Date.now() + 15 * MIN }; guardar(t); toast(m.n + ' apartada por 15 minutos.'); LM.rerender();
  });
  F['sv-cl-moto'] = (f, d) => { LM.go('moto-' + (location.hash || '').slice(3) + '-' + String(d.get('ot')).trim().toUpperCase().replace(/^(\d)/, 'OT-$1')); };

  // --- la moto en el taller, como la ve el cliente (#moto-taller-OT-218) ---
  const MOTO = {};
  function vMoto(tid, ot) {
    const t = LM.T(tid); if (!t) return '<div class="wrap"><p>No existe ese taller.</p></div>';
    let o = MOTO[ot];
    if (!o && API().disponible && API().yo) { if (!(ot in MOTO)) { MOTO[ot] = null; API().get('/api/sv/' + tid + '/moto/' + ot).then(r => { MOTO[ot] = r.orden; LM.rerender(); }).catch(() => { MOTO[ot] = 0; LM.rerender(); }); } }
    if (!o) o = (st(t).ordenes || []).find(x => x.id === ot);
    if (!o) return '<div class="wrap sv-moto"><div class="sv-box"><h1>No encontramos la orden ' + esc(ot) + '</h1><p>Revisa el número o escríbele al taller.</p>' + btn('Volver al taller', 'go', ' data-h="t-' + tid + '"', 'teal') + '</div></div>';
    const pasos = [['recibida', 'Recibida'], ['diagnostico', 'Diagnóstico'], ['aprobacion', 'Tu aprobación'], ['reparacion', 'En reparación'], ['lista', 'Lista para recoger']], i = pasos.findIndex(p => p[0] === o.estado);
    return '<div class="wrap sv-moto"><div class="sv-moto-h"><button class="sv-x" type="button" data-act="go" data-h="t-' + tid + '" aria-label="Volver">' + I('chevl') + '</button><div><h1>Tu moto en el taller</h1><small>' + esc(t.n) + '</small></div><img src="' + esc(SV.lg(t)) + '" alt=""></div>' +
      '<div class="sv-box sv-moto-m"><img src="' + esc(FOTO('f-rueda')) + '" alt=""><div><b>' + esc(o.moto) + '</b><span><em class="sv-placa">' + esc(o.placa) + '</em> · orden ' + esc(o.id) + '</span></div></div>' +
      '<div class="sv-box"><ol class="sv-pasos">' + pasos.map((p, j) => '<li class="' + (j < i ? 'ok' : j === i ? 'on' : '') + '"><i>' + (j < i ? I('check') : '') + '</i>' + p[1] + '</li>').join('') + '</ol></div>' +
      '<div class="sv-box"><div class="sv-cli">' + av(SV.perfil(tid).dueno, SV.perfil(tid).foto ? FOTO(SV.perfil(tid).foto) : '') + '<span><b>' + esc(SV.perfil(tid).dueno) + ' te envió la cotización</b><small>"' + esc(o.diag || o.falla) + '"</small></span></div>' +
      o.items.map(x => '<div class="sv-lin"><span>' + esc(x.n) + '</span><b class="num">' + pesos(x.v) + '</b></div>').join('') + '<div class="sv-total"><span>Total</span><b class="num">' + pesos(totOT(o)) + '</b></div></div>' +
      (o.estado === 'aprobacion' ? '<div class="sv-pie">' + btn('Aprobar el arreglo · ' + pesos(totOT(o)), 'sv-moto-ok', ' data-t="' + tid + '" data-o="' + o.id + '"', 'teal xl') + '<div class="sv-2b">' + (o.items.find(x => !x.mo) ? btn('Solo ' + esc(o.items.find(x => !x.mo).n.split(' (')[0].toLowerCase()), 'sv-moto-ok', ' data-t="' + tid + '" data-o="' + o.id + '" data-solo="' + o.items.find(x => !x.mo).k + '"', 'borde') : '') + '<a class="sv-btn borde" href="tel:' + esc(String(t.tel || '').replace(/\s/g, '')) + '">' + I('phone') + 'Llamar al taller</a></div></div>' : '<p class="sv-aviso">' + I('info') + (o.aprobada ? 'Ya aprobaste la cotización. Te avisamos cuando esté lista.' : 'Te avisamos por WhatsApp cuando cambie el estado.') + '</p>') + '</div>';
  }
  A['sv-moto-ok'] = el => LM.needCli(async () => {
    const tid = el.dataset.t, ot = el.dataset.o, solo = el.dataset.solo || '';
    if (API().disponible && API().yo) {
      try { await API().post('/api/sv/' + tid + '/cliente', { accion: 'aprobar-ot', ot, solo }); delete MOTO[ot]; toast('¡Aprobado! El taller empieza el arreglo.'); LM.rerender(); return; }
      catch (e) { if (e.codigo !== 'sin_datos' && e.status !== 404) { toast(e.message); return; } }
    }
    const t = LM.T(tid), o = st(t).ordenes.find(x => x.id === ot);
    o.aprobada = solo ? 'parcial' : 'todo'; if (solo) o.items = o.items.filter(i => i.k === solo || i.mo); o.estado = 'reparacion'; o.log = (o.log || []).concat([{ h: Date.now(), t: 'El cliente aprobó la cotización por la app' }]);
    guardar(t); toast('¡Aprobado! El taller empieza el arreglo.'); LM.rerender();
  });
  const _ruta = E.ruta;
  E.ruta = r => {
    document.body.classList.remove('mode-rep', 'mode-admin', 'mode-ext'); // si no, la vista de domiciliario o admin queda pegada
    const m = /^moto-([a-z0-9-]+?)-(OT-\d+)$/.exec(r);
    if (m) { document.getElementById('app').innerHTML = vMoto(m[1], m[2]); return true; }
    return _ruta(r);
  };
  // los <select> e <input> con data-chg="sv-…" llaman a su acción
  document.addEventListener('change', e => { const el = e.target, k = el && el.dataset && el.dataset.chg; if (k && /^sv-/.test(k) && A[k]) A[k](el, e); });
  SV.SEED = SEED; SV.keyDe = keyDe;
})();
