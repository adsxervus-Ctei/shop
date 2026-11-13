/* Mi Tienda · Servus 0.1 · LO QUE VE EL CLIENTE
   1. Inicio (computador y celular): portada, círculos de categorías, Súper ofertas con reloj,
      Los mejor calificados al lado de Combos, Negocios que debes conocer y Más para ti.
   2. La tienda de cada negocio ("Ver mi negocio"): portada, dueño, cupones para tomar, cómo entrega,
      lo más pedido, reseñas, combos y "sobre el negocio".
   3. Página para probar cada rol con datos de ejemplo (#demo) y el perfil de ejemplo del domiciliario. */
(function () {
  'use strict';
  const LM = window.LM, E = LM.EXT, A = LM.A, SV = LM.sv;
  const { esc, pesos, toast } = LM;
  const ic = SV.ic;
  const S = () => LM.S;
  const ses = () => LM.S.session;
  const API = () => LM.api || { disponible: false };
  const F = SV.foto;

  /* ---------- piezas ---------- */
  const fotoP = p => p.fotoSrv || p.fotoMini || '';
  const tag = (txt, cls) => '<span class="sv-tag ' + (cls || '') + '">' + txt + '</span>';
  const confTag = () => '<span class="sv-conf">' + ic('check') + 'Confianza</span>';
  const miles = n => n >= 1000 ? (Math.round(n / 100) / 10).toLocaleString('es-CO') + ' mil' : String(n);
  const pct = (a, b) => b > a ? Math.round((1 - a / b) * 100) : 0;
  function tarjeta(p, o) {
    o = o || {};
    const t = LM.T(p.t), pr = LM.precio(p), f = fotoP(p), d = pct(pr.p, pr.old);
    const extra = o.extra || (t.cat === 'comida' || t.cat === 'rapida' ? tag('Llega en ' + t.min + ' min', 'ok') : p.t === 'tienda' ? tag('Fiado disponible', 'ok') : p.t === 'calzado' ? tag('Cambio de talla gratis', 'ok') : p.t === 'pescadores' ? tag('Pesca del día', 'ok') : p.t === 'granero' ? tag('Por mayor', 'ok') : '');
    return '<article class="sv-card"><button class="sv-card-a" type="button" data-act="ver" data-id="' + esc(p.id) + '" aria-label="Ver ' + esc(p.n) + '">' +
      '<span class="sv-ph">' + (f ? '<img class="ph" loading="lazy" src="' + esc(f) + '" alt="">' : '<span class="sv-ph-ic">' + LM.ic(p.i) + '</span>') + (d ? '<b class="sv-off">-' + d + '%</b>' : '') + '</span>' +
      '<span class="sv-card-b">' + (SV.confianza(p.t) && !o.sinConf ? confTag() : '') + '<span class="sv-nom">' + esc(p.n) + '</span>' +
      '<span class="sv-pre"><b class="num">' + pesos(pr.p) + '</b>' + (pr.old ? '<s class="num">' + pesos(pr.old) + '</s>' : '') + '</span>' +
      '<span class="sv-meta">' + (d ? '<em>-' + d + '%</em>' : '') + LM.ic('star', 'fill') + String(p.r).replace('.', ',') + ' · ' + miles(p.v || 0) + ' vendidos</span>' + extra +
      '<span class="sv-de"><img src="' + esc(SV.lg(t)) + '" alt="">' + esc(t.n) + '</span></span></button>' +
      '<button class="sv-add" type="button" data-act="add" data-id="' + esc(p.id) + '" aria-label="Agregar ' + esc(p.n) + ' al carrito">' + LM.ic('plus') + '</button></article>';
  }
  SV.tarjeta = tarjeta;
  const ofertas = () => {
    const now = Date.now();
    return S().promos.filter(x => x.activo && x.hasta > now && LM.PR(x.prod)).map(x => LM.PR(x.prod))
      .sort((a, b) => (fotoP(b) ? 1 : 0) - (fotoP(a) ? 1 : 0)).filter((p, i, l) => l.indexOf(p) === i);
  };
  const reloj = () => '<span class="sv-reloj num" data-svcd="' + (LM.finDia ? LM.finDia() : Date.now() + 6 * 3600e3) + '">00:00:00</span>';
  setInterval(() => document.querySelectorAll('[data-svcd]').forEach(el => {
    const ms = Math.max(0, +el.dataset.svcd - Date.now()), h = Math.floor(ms / 3600e3), m = Math.floor(ms / 60e3) % 60, s = Math.floor(ms / 1000) % 60;
    el.textContent = [h, m, s].map(x => String(x).padStart(2, '0')).join(':');
  }), 1000);

  const CIRC = [['Comida', 'f-hamburguesa', 'c-comida'], ['Mercado', 'f-fresas', 'c-tienda'], ['Granos', 'f-cafe-grano', 'c-mayorista'], ['Droguería', '', 't-drogueria', 'drogueria'],
    ['Moda', 'f-vestido', 'c-ropa'], ['Calzado', 'f-tenis', 't-calzado'], ['Granja', 'f-gallina', 'c-granja'], ['Agro', 'f-campo', 'c-agro'], ['Pesca', 'f-canoa', 'c-pesca'],
    ['Mascotas', 'f-perro', 'p-concentrado-perro'], ['Helados', 'f-helado', 't-chimi'], ['Mandados', 'f-ciclistas', 'rep']];

  function combosH(lista) {
    return lista.map(cb => {
      const ps = cb.items.map(LM.PR); if (ps.some(x => !x)) return '';
      const q = cb.q || cb.items.map(() => 1);
      const tot = ps.reduce((a, p, i) => a + LM.precio(p).p * q[i], 0), antes = ps.reduce((a, p, i) => a + p.p * q[i], 0);
      return '<article class="sv-combo"><div class="sv-cb-fotos">' + ps.map((p, i) => '<span class="sv-ph">' + (fotoP(p) ? '<img loading="lazy" src="' + esc(fotoP(p)) + '" alt="">' : LM.ic(p.i)) + (q[i] > 1 ? '<b class="sv-x">×' + q[i] + '</b>' : '') + '</span>').join('<i>+</i>') + '</div>' +
        '<b class="sv-nom">' + esc(cb.n) + '</b><span class="sv-cb-de">' + ps.map(p => { const t = LM.T(p.t); return '<span><img src="' + esc(SV.lg(t)) + '" alt="">' + esc(t.n) + '</span>'; }).join('<em>+</em>') + '</span>' +
        '<span class="sv-pre"><b class="num">' + pesos(tot) + '</b>' + (antes > tot ? '<s class="num">' + pesos(antes) + '</s>' : '') + '</span>' +
        '<button class="sv-btn rojo" type="button" data-act="sv-combo" data-id="' + cb.id + '">Agregar combo</button></article>';
    }).join('');
  }
  A['sv-combo'] = el => {
    const cb = SV.COMBOS.find(x => x.id === el.dataset.id); if (!cb) return;
    cb.items.forEach((id, i) => { const it = S().cart.find(x => x.id === id); const q = (cb.q || [])[i] || 1; if (it) it.q += q; else S().cart.push({ id, q }); });
    LM.save(); LM.updHeader(); toast('Combo "' + cb.n + '" en tu carrito: un pedido a cada negocio.');
  };
  const mejores = () => S().tiendas.filter(t => SV.PERFIL[t.id]).map(t => ({ t, p: SV.perfil(t.id) })).sort((a, b) => b.p.r - a.p.r || b.p.res - a.p.res).slice(0, 4);
  function negocioCard(t) {
    const p = SV.perfil(t.id), ps = S().prods.filter(x => x.t === t.id && fotoP(x)).slice(0, 3), seg = (S().user.favT || []).includes(t.id);
    return '<article class="sv-neg"><header><button type="button" class="sv-neg-logo" data-act="go" data-h="t-' + t.id + '"><img src="' + esc(SV.lg(t)) + '" alt=""></button><div><button type="button" class="sv-neg-n" data-act="go" data-h="t-' + t.id + '">' + esc(t.n) + '</button><small>' + esc(p.tipo) + ' · ' + LM.ic('star', 'fill') + String(p.r).replace('.', ',') + ' · ' + miles(p.seg) + ' seguidores</small></div>' +
      '<button class="sv-seguir' + (seg ? ' on' : '') + '" type="button" data-act="sv-seguir" data-id="' + t.id + '">' + (seg ? 'Siguiendo' : 'Seguir') + '</button></header>' +
      '<div class="sv-neg-f">' + (ps.length ? ps.map(x => '<button type="button" data-act="ver" data-id="' + esc(x.id) + '"><img loading="lazy" src="' + esc(fotoP(x)) + '" alt="' + esc(x.n) + '"></button>').join('') : '<span class="sv-ph-ic">' + LM.ic('tienda') + '</span>') + '</div>' +
      '<footer>' + (p.foto ? '<img class="sv-av" src="' + esc(F(p.foto)) + '" alt="">' : '<img class="sv-av" src="' + esc(SV.lg(t)) + '" alt="">') + '<span><b>' + esc(p.dueno) + '</b>, ' + esc(p.cargo.toLowerCase()) + '<small>Responde en 5 min</small></span>' +
      '<a class="sv-escribir" href="' + waNeg(t) + '" target="_blank" rel="noopener">Escribir</a></footer></article>';
  }
  const waNeg = t => 'https://wa.me/57' + String(t.tel || '').replace(/\D/g, '') + '?text=' + encodeURIComponent('Hola, ' + t.n + '. Te escribo desde Mi Tienda.');
  A['sv-seguir'] = el => {
    const u = S().user; u.favT = u.favT || []; const id = el.dataset.id, i = u.favT.indexOf(id);
    if (i >= 0) u.favT.splice(i, 1); else u.favT.push(id);
    LM.save(); el.classList.toggle('on', i < 0); el.textContent = i < 0 ? 'Siguiendo' : 'Seguir';
    toast(i < 0 ? 'Ahora sigues a ' + LM.T(id).n + '. Verás sus ofertas primero.' : 'Dejaste de seguir a ' + LM.T(id).n);
  };

  /* ---------- 1. inicio ---------- */
  let masN = 18;
  function vInicio() {
    const ofs = ofertas(), now = Date.now();
    // La portada: la última oferta que publicó un dueño (Promociones) o, si no hay, la de ejemplo
    const pd = S().promos.filter(x => x.activo && x.hasta > now && !x.sv && !/^pr\d{1,2}$/.test(x.id) && LM.PR(x.prod)).slice(-1)[0];
    const hero = pd ? LM.PR(pd.prod) : (LM.PR('hamburguesa-rc') || ofs[0]), ht = hero && LM.T(hero.t), hp = hero && LM.precio(hero);
    const heroT = pd ? (pd.titulo || hero.n) : hero && hero.n.split(' a la')[0], heroF = pd && (pd.foto || hero.fotoMini) ? (pd.foto || hero.fotoMini) : F('f-lena-fuego');
    const abiertos = S().tiendas.filter(t => t.abierto && t.logo).slice(0, 6);
    const mas = S().prods.filter(p => fotoP(p) && LM.T(p.t)).sort((a, b) => (b.v || 0) - (a.v || 0));
    const cli = ses() && ses().rol === 'cliente';
    return '<div class="sv-home">' +
      // portada
      '<section class="wrap sv-hero">' +
      (hero ? '<div class="sv-hero-a" id="mlhero" style="--bg:url(' + esc(SV.abs(heroF)) + ')"><img class="sv-hero-lg" src="' + esc(SV.lg(ht)) + '" alt=""><h1>' + esc(heroT) + ' a <span class="num">' + pesos(hp.p) + '</span></h1><p>' + esc(pd ? hero.n + '. ' : hero.d + ' ') + 'En ' + esc(ht.n) + (pd ? ', por tiempo limitado.' : ', hoy hasta las 3 p. m.') + '</p>' +
        '<button class="sv-btn blanco" type="button" data-act="ver" data-id="' + esc(hero.id) + '">Pedir ahora</button></div>' : '') +
      '<div class="sv-hero-b"><button type="button" class="sv-hero-m" data-act="go" data-h="c-tienda" style="--bg:url(' + esc(SV.abs(F('f-fresas'))) + ')"><b>Mercado a domicilio desde $2.000</b></button>' +
      '<button type="button" class="sv-hero-n" data-act="login" data-tab="negocio"><span><b>¿Tienes un negocio?</b><small>Vende en Mi Tienda y lleva tu caja desde el celular.</small></span>' + LM.ic('arrow') + '</button></div></section>' +
      // círculos
      '<nav class="wrap sv-circ" aria-label="Categorías">' + CIRC.map(c => '<button type="button" data-act="go" data-h="' + c[2] + '"><span>' + (c[1] ? '<img loading="lazy" src="' + esc(F(c[1])) + '" alt="">' : '<img src="' + esc(SV.logo(c[3])) + '" alt="" class="lg">') + '</span>' + c[0] + '</button>').join('') + '</nav>' +
      // pedir de nuevo (solo la cliente que ya tiene pedidos entregados)
      (cli && LM.lxAgain ? LM.lxAgain(true) : '') +
      // súper ofertas
      '<section class="wrap sv-sec"><div class="sv-h"><h2 class="rojo">Súper ofertas</h2><span class="sv-term">Terminan en ' + reloj() + '</span><button class="sv-ver" type="button" data-act="go" data-h="c-ofertas">Ver todo ' + LM.ic('chevr') + '</button></div>' +
      '<div class="sv-rail six">' + ofs.slice(0, 6).map(p => tarjeta(p)).join('') + '</div></section>' +
      // abiertos cerca (solo celular)
      '<section class="wrap sv-sec sv-solo-m"><div class="sv-h"><h2>Abiertos cerca de ti</h2></div><div class="sv-abiertos">' + abiertos.map(t => { const p = SV.perfil(t.id); return '<button type="button" data-act="go" data-h="t-' + t.id + '"><img src="' + esc(SV.lg(t)) + '" alt=""><span><b>' + esc(t.n) + '</b><small>' + esc(p.tipo) + ' · ' + LM.ic('star', 'fill') + String(p.r).replace('.', ',') + '</small></span><em>Abierto</em></button>'; }).join('') + '</div></section>' +
      // mejor calificados + combos
      '<section class="wrap sv-duo">' +
      '<div class="sv-box"><div class="sv-h"><h2>' + LM.ic('star', 'fill') + 'Los mejor calificados</h2><small>Por las reseñas de los vecinos</small></div><div class="sv-top">' +
      mejores().map(({ t, p }, i) => { const pf = S().prods.find(x => x.t === t.id && fotoP(x)); return '<button type="button" class="sv-top-i" data-act="go" data-h="t-' + t.id + '"><span class="sv-ph">' + (pf ? '<img loading="lazy" src="' + esc(fotoP(pf)) + '" alt="">' : '<img src="' + esc(SV.lg(t)) + '" alt="" style="object-fit:contain;padding:18px;background:#fff">') + '<b class="sv-pos">' + (i + 1) + '</b></span><span class="sv-top-b"><span class="sv-de"><img src="' + esc(SV.lg(t)) + '" alt="">' + esc(t.n) + '</span>' + (SV.confianza(t.id) ? confTag() : '') + '<b class="num">' + LM.ic('star', 'fill') + String(p.r).replace('.', ',') + '</b><small>' + miles(p.res) + ' reseñas · ' + esc(p.tipo) + '</small></span></button>'; }).join('') + '</div></div>' +
      '<div class="sv-box"><div class="sv-h"><h2>Combos</h2><small>De dos negocios, en <b>un solo domicilio</b></small></div><div class="sv-combos">' + combosH(SV.COMBOS.slice(0, 2)) + '</div></div></section>' +
      // negocios que debes conocer
      '<section class="wrap sv-sec"><div class="sv-h"><h2>Negocios que debes conocer</h2><button class="sv-ver" type="button" data-act="ancla" data-h="negocios">Ver los ' + S().tiendas.length + ' negocios ' + LM.ic('chevr') + '</button></div>' +
      '<div class="sv-rail four">' + ['rancho', 'tienda', 'granja', 'calzado'].map(LM.T).filter(Boolean).map(negocioCard).join('') + '</div></section>' +
      // más para ti
      '<section class="wrap sv-sec" id="svMas"><h2 class="sv-mas-t">Más para ti</h2><div class="sv-grid">' + mas.slice(0, masN).map(p => tarjeta(p)).join('') + '</div>' +
      (mas.length > masN ? '<div class="sv-centro"><button class="sv-btn borde" type="button" data-act="sv-mas">Ver más productos</button></div>' : '') + '</section>' +
      // todos los negocios (el directorio; el enlace "Negocios" del encabezado baja hasta aquí)
      '<section class="wrap sv-sec" id="negocios"><div class="sv-h"><h2>Todos los negocios</h2><small>' + S().tiendas.filter(t => t.abierto).length + ' abiertos ahora</small></div><div class="vendors">' + S().tiendas.map(LM.vendorCard).join('') + '</div></section>' +
      (cli ? '' : '<section class="wrap sv-sec"><div class="sv-unete"><div><b>¿Tienes un negocio en La Loba?</b><small>Vende en Mi Tienda: caja, inventario, domicilios y tu propia vitrina con cupones.</small></div><button class="sv-btn lima" type="button" data-act="login" data-tab="negocio">Registra tu negocio</button><button class="sv-btn borde" type="button" data-act="go" data-h="rep">Hazte domiciliario</button></div></section>') +
      '</div>';
  }
  A['sv-mas'] = () => { masN += 12; LM.rerender(); };

  /* ---------- 2. la tienda del negocio ---------- */
  const TB = { tid: '', tab: 'inicio', q: '' };
  const PUB = {}; // lo público que trae el servidor (vitrina, cupones, mesas…)
  async function cargarPublico(tid) {
    if (!API().disponible || (PUB[tid] && Date.now() - PUB[tid].t < 20000)) return;
    PUB[tid] = { t: Date.now(), d: (PUB[tid] || {}).d || null };
    try {
      const d = await API().get('/api/sv/' + tid + '/publico'); PUB[tid].d = d;
      const N = LM.NEG(tid); N.sv = N.sv || {};
      if (d.vitrina) N.sv.vitrina = d.vitrina;
      (d.cupones || []).forEach(c => { const i = S().cupones.findIndex(x => x.id === c.id); if (i >= 0) S().cupones[i] = c; else S().cupones.push(c); });
      if ((location.hash || '').slice(1) === 't-' + tid) pintarTienda(tid);
    } catch (e) {}
  }
  SV.publico = tid => (PUB[tid] || {}).d;
  SV.cargarPublico = cargarPublico;
  function cuponesDe(tid) { return S().cupones.filter(c => c.t === tid && c.activo && (!c.vence || c.vence > Date.now())); }
  function cuponH(c) {
    const tom = (S().cupAct || []).includes(c.id);
    const grande = c.tipo === 'fijo' ? pesos(c.valor) : c.tipo === 'regalo' ? esc(c.regalo) : c.pct + '%';
    const sub = c.tipo === 'fijo' ? (c.min ? 'Desde ' + pesos(c.min) : 'En cualquier pedido') : c.tipo === 'regalo' ? (c.cond ? 'Con ' + c.cond.q + ' ' + esc((LM.PR(c.cond.prod) || {}).n || '') : 'Con tu pedido') : 'De descuento';
    return '<div class="sv-cupon' + (tom ? ' tomado' : '') + '"><div><b>' + grande + '</b><small>' + sub + '</small><em>' + esc(c.svNota || (c.vence ? 'Vence ' + new Date(c.vence).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '')) + '</em></div>' +
      (tom ? '<span class="sv-tomar ok">' + LM.ic('check') + 'Tomado</span>' : '<button class="sv-tomar" type="button" data-act="sv-tomar" data-id="' + esc(c.id) + '">Tomar</button>') + '</div>';
  }
  SV.cuponH = cuponH;
  A['sv-tomar'] = el => {
    const c = S().cupones.find(x => x.id === el.dataset.id); if (!c) return;
    S().cupAct = S().cupAct || []; if (!S().cupAct.includes(c.id)) S().cupAct.push(c.id);
    LM.save(); const box = el.closest('.sv-cupon'); if (box) { box.classList.add('tomado'); el.outerHTML = '<span class="sv-tomar ok">' + LM.ic('check') + 'Tomado</span>'; }
    toast('Cupón tomado. Se aplica solo cuando pidas en ' + LM.T(c.t).n + ' (código ' + c.code + ').');
  };
  function entregasH(t) {
    const z = t.zonas || {}, ls = [];
    if (z.cabecera != null) ls.push(['moto', 'Domicilio en Hatillo: <b class="num">' + pesos(z.cabecera) + '</b> · ' + t.min + '–' + (t.min + 10) + ' min']);
    if (z.chimi != null) ls.push(['pin', 'A Chimí y Las Brisas: <b class="num">' + pesos(z.chimi) + '</b>']);
    if (z.sanmartin != null) ls.push(['pin', 'A San Martín de Loba: <b class="num">' + pesos(z.sanmartin) + '</b>']);
    if (z.barranco != null) ls.push(['pin', 'A Barranco de Loba: <b class="num">' + pesos(z.barranco) + '</b>']);
    if (!ls.length) ls.push(['tienda', 'Se atiende en el local']);
    const pg = Object.keys(t.pagos || {}).filter(k => t.pagos[k]).map(k => LM.PAGO[k] || k);
    ls.push(['cash', 'Pagas al recibir: ' + esc(pg.join(', '))]);
    return ls.map(x => '<li>' + LM.ic(x[0]) + '<span>' + x[1] + '</span></li>').join('');
  }
  function vTienda(tid) {
    const t = LM.T(tid), p = SV.perfil(tid), N = LM.NEG(tid);
    if (TB.tid !== tid) { TB.tid = tid; TB.tab = 'inicio'; TB.q = ''; }
    cargarPublico(tid);
    const ps = S().prods.filter(x => x.t === tid && x.disp !== false);
    const top = ps.slice().sort((a, b) => (fotoP(b) ? 1 : 0) - (fotoP(a) ? 1 : 0) || (b.v || 0) - (a.v || 0));
    const revs = S().reviews.filter(r => r.t === tid);
    const s = ses(), duenoAqui = s && s.t === tid && s.rol === 'dueno';
    const seg = (S().user.favT || []).includes(tid);
    const combos = SV.COMBOS.filter(cb => cb.items.some(id => (LM.PR(id) || {}).t === tid));
    const cups = cuponesDe(tid);
    const tabs = [['inicio', 'Inicio'], ['productos', 'Productos (' + ps.length + ')'], ['combos', 'Combos'], ['resenas', 'Reseñas'], ['sobre', 'Sobre el negocio']];
    let cuerpo = '';
    if (TB.tab === 'inicio') {
      cuerpo = '<div class="sv-t-cols"><aside class="sv-t-izq">' +
        '<div class="sv-box sv-dueno">' + (p.foto ? '<img src="' + esc(/^data:|^img\//.test(p.foto) ? p.foto : F(p.foto)) + '" alt="">' : '<img src="' + esc(SV.lg(t)) + '" alt="">') + '<b>' + esc(p.dueno) + '</b><small>' + esc(p.cargo) + '</small><q>' + esc(p.frase) + '</q>' +
        '<div class="sv-dueno-n"><span><b>98 %</b>responde</span><span><b>5 min</b>en contestar</span><span><b>2026</b>en Mi Tienda</span></div></div>' +
        (cups.length ? '<div class="sv-box"><h3>Cupones del negocio</h3><div class="sv-cupones">' + cups.map(cuponH).join('') + '</div></div>' : '') +
        '<div class="sv-box"><h3>Así entregamos</h3><ul class="sv-entrega">' + entregasH(t) + '</ul></div></aside>' +
        '<div class="sv-t-der"><div class="sv-banner" style="--bg:url(' + esc(SV.abs(/^data:/.test(p.banner[2]) ? p.banner[2] : F(p.banner[2]))) + ')"><b>' + esc(p.banner[0]) + '</b><span>' + esc(p.banner[1]) + '</span></div>' +
        (SV.atencionCliente ? SV.atencionCliente(t) : '') +
        '<div class="sv-h"><h2>Lo más pedido</h2></div><div class="sv-grid six">' + top.slice(0, 12).map(x => tarjeta(x, { sinConf: false })).join('') + '</div>' +
        (revs.length ? '<div class="sv-h"><h2>Lo que dicen los vecinos</h2></div><div class="sv-revs">' + revs.slice(0, 3).map(revH).join('') + '</div>' : '') + '</div></div>';
    } else if (TB.tab === 'productos') {
      const l = ps.filter(x => !TB.q || x.n.toLowerCase().includes(TB.q.toLowerCase()));
      cuerpo = '<div class="sv-grid">' + (l.length ? l.map(x => tarjeta(x)).join('') : '<p class="muted">No hay productos con ese nombre.</p>') + '</div>';
    } else if (TB.tab === 'combos') {
      cuerpo = combos.length ? '<div class="sv-combos ancho">' + combosH(combos) + '</div>' : '<p class="muted">Este negocio todavía no tiene combos con otros negocios.</p>';
    } else if (TB.tab === 'resenas') {
      cuerpo = '<div class="sv-res-h"><b class="num">' + String(p.r).replace('.', ',') + '</b>' + LM.ic('star', 'fill') + '<span>' + miles(p.res) + ' reseñas en total</span></div>' + (revs.length ? '<div class="sv-revs col">' + revs.map(revH).join('') + '</div>' : '<p class="muted">Todavía no hay reseñas escritas en este celular.</p>');
    } else {
      cuerpo = '<div class="sv-box sv-sobre"><p>' + esc(t.desc || p.frase) + '</p><dl><dt>Dirección</dt><dd>' + esc(t.dir) + '</dd><dt>Horario</dt><dd>' + esc(t.horario || '') + '</dd><dt>Teléfono</dt><dd class="num">' + esc(t.tel || '') + '</dd><dt>Medios de pago</dt><dd>' +
        esc(Object.keys(t.pagos || {}).filter(k => t.pagos[k]).map(k => LM.PAGO[k] || k).join(', ')) + '</dd></dl><a class="sv-btn borde" href="' + waNeg(t) + '" target="_blank" rel="noopener">' + ic('wa') + 'Escribir por WhatsApp</a></div>';
    }
    const portada = /^data:/.test(p.portada) ? p.portada : F(p.portada);
    return (duenoAqui ? '<div class="sv-asi"><div class="wrap">' + LM.ic('eye') + '<span><b>Así ven tu negocio los clientes.</b> Cambia la portada, tu frase y los cupones cuando quieras.</span><button class="sv-btn lima" type="button" data-act="go" data-h="panel-vitrina">' + LM.ic('edit') + 'Editar mi vitrina</button><button class="sv-btn borde" type="button" data-act="go" data-h="panel">Volver al panel</button></div></div>' : '') +
      '<div class="sv-tienda"><header class="sv-portada" style="--bg:url(' + esc(SV.abs(portada)) + ')"><div class="wrap"><img class="sv-p-logo" src="' + esc(SV.lg(t)) + '" alt=""><div class="sv-p-tx"><h1>' + esc(t.n) + '</h1><p>' + esc(p.tipo) + ' · ' + esc(p.dir || t.dir) + ' · ' + (t.abierto ? 'Abierto' + (p.hasta ? ' hasta las ' + esc(p.hasta) : '') : 'Cerrado ahora') + '</p>' +
      '<div class="sv-p-tags">' + (SV.confianza(tid) ? confTag() : '') + '<span>' + LM.ic('star', 'fill') + String(p.r).replace('.', ',') + ' · ' + miles(p.res) + ' reseñas</span><span>' + miles(p.seg + (seg ? 1 : 0)) + ' seguidores</span></div></div>' +
      '<div class="sv-p-bts"><button class="sv-btn blanco sv-seguir' + (seg ? ' on' : '') + '" type="button" data-act="sv-seguir" data-id="' + tid + '">' + (seg ? 'Siguiendo' : '+ Seguir') + '</button><a class="sv-btn rojo" href="' + waNeg(t) + '" target="_blank" rel="noopener">Escribir al negocio</a></div></div></header>' +
      '<nav class="sv-tabs"><div class="wrap">' + tabs.map(x => '<button type="button" data-act="sv-tab" data-t="' + x[0] + '"' + (TB.tab === x[0] ? ' aria-current="page"' : '') + '>' + x[1] + '</button>').join('') +
      (TB.tab === 'productos' ? '<label class="sv-buscar">' + LM.ic('search') + '<input type="search" placeholder="Buscar en ' + esc(t.n) + '" value="' + esc(TB.q) + '" data-inp="sv-tq"></label>' : '') + '</div></nav>' +
      '<div class="wrap sv-t-cuerpo">' + cuerpo + '</div></div>';
  }
  const revH = r => '<div class="sv-rev"><b>' + esc(r.a) + ' <span class="sv-est">' + '★'.repeat(r.est) + '</span></b><p>' + esc(r.txt) + '</p><small>' + esc(r.f) + '</small></div>';
  function pintarTienda(tid) { const app = document.getElementById('app'); if (!app) return; const y = scrollY; app.innerHTML = vTienda(tid); LM.paint(app); scrollTo(0, y); }
  A['sv-tab'] = el => { TB.tab = el.dataset.t; pintarTienda(TB.tid); };
  let tq = 0;
  document.addEventListener('input', e => { const el = e.target; if (el && el.dataset && el.dataset.inp === 'sv-tq') { TB.q = el.value; clearTimeout(tq); tq = setTimeout(() => { pintarTienda(TB.tid); const i = document.querySelector('[data-inp="sv-tq"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); } });

  /* ---------- 3. probar cada rol (#demo) ---------- */
  const CARGO_IR = { 'Dueño': 'Entra a su panel', Cajero: 'Caja, cobros por confirmar y gastos', Mesero: 'Mesas, avisos de cocina y asistencia', Cocina: 'Solo el tablero de comandas', Domiciliario: 'Solo los domicilios de este negocio', 'Atención': 'La pantalla de atención del negocio' };
  // Las cuentas de prueba solo se muestran si el servidor las tiene encendidas (SERVUS_DEMO=1) o sin servidor
  let demoOk = null;
  function revisarDemo() { if (demoOk !== null || !API().disponible) return; demoOk = 'cargando'; API().get('/api/auth/proveedores').then(p => { demoOk = !!p.demo; if ((location.hash || '') === '#demo') LM.rerender(); }).catch(() => { demoOk = true; }); }
  function vDemo() {
    revisarDemo();
    if (API().disponible && demoOk === false) return '<div class="wrap sv-demo"><div class="sv-box"><h1>Las cuentas de prueba están apagadas</h1><p>Esta es la versión real de Mi Tienda. Para probar con datos de ejemplo, el administrador enciende <code>SERVUS_DEMO=1</code> en un servidor de pruebas (ver CONFIGURACION-PLATAFORMAS.md).</p><button class="sv-btn teal" type="button" data-act="go" data-h="inicio">Ir a la tienda</button></div></div>';
    const grupos = Object.keys(SV.EQUIPO).filter(LM.T).map(tid => {
      const t = LM.T(tid);
      return '<div class="sv-box sv-demo-n"><header><img src="' + esc(SV.lg(t)) + '" alt=""><div><b>' + esc(t.n) + '</b><small>' + esc(SV.perfil(tid).tipo) + '</small></div><button class="sv-btn borde chico" type="button" data-act="go" data-h="t-' + tid + '">Ver tienda</button></header>' +
        SV.EQUIPO[tid].map(([u, n, rol, cargo, foto]) => '<button type="button" class="sv-demo-u" data-act="mt-demo" data-u="' + u + '">' + (foto ? '<img src="' + esc(F(foto)) + '" alt="">' : '<span class="sv-av">' + esc(n[0]) + '</span>') + '<span><b>' + esc(n) + ' · ' + esc(cargo) + '</b><small>' + esc(CARGO_IR[rol] || '') + ' · usuario <code>' + esc(u) + '</code></small></span>' + LM.ic('chevr') + '</button>').join('') + '</div>';
    }).join('');
    return '<div class="wrap sv-demo"><div class="sv-demo-h"><h1>Prueba cada rol con datos de ejemplo</h1><p>Toca una persona y entras como ella. Todas las cuentas de prueba tienen la clave <b>1234</b>. Para volver aquí, sal de la cuenta y abre <code>#demo</code>.</p></div>' +
      '<div class="sv-demo-top"><button type="button" class="sv-demo-u grande" data-act="mt-demo" data-u="maria"><img src="' + esc(F('u-maria')) + '" alt=""><span><b>María · Cliente</b><small>Inicio con ofertas, pedidos y su cuenta · usuario <code>maria</code></small></span>' + LM.ic('chevr') + '</button>' +
      '<button type="button" class="sv-demo-u grande lima" data-act="go" data-h="domi-demo"><img src="' + esc(F('d-danto')) + '" alt=""><span><b>Danto · Domiciliario</b><small>Mapa, conectarse y pedidos cerca (perfil de ejemplo)</small></span>' + LM.ic('chevr') + '</button></div>' +
      '<div class="sv-demo-g">' + grupos + '</div></div>';
  }

  /* ---------- 4. perfil de ejemplo del domiciliario (#domi-demo) ---------- */
  const D = { on: false, paso: 0, hoy: 0, entregas: 0, sem: 186500, oferta: null, tomados: [] };
  const OFERTAS_DEMO = [
    { id: 1, neg: 'rancho', a: 'Barrio Abajo, casa 12', z: 'Hatillo', km: '1,2 km', v: 3000, items: '2 productos · $41.000 · efectivo' },
    { id: 2, neg: 'drogueria', a: 'Chimí, calle del colegio', z: 'Chimí', km: '4,8 km', v: 6000, items: '2 productos · $19.000 · Nequi (ya pagó)' },
    { id: 3, neg: 'tienda', a: 'Frente al parque, casa esquinera verde', z: 'Hatillo', km: '0,8 km', v: 3000, items: '5 productos · $53.500 · fiado' }
  ];
  function vDomi() {
    const t = D.oferta && LM.T(D.oferta.neg);
    const pasos = ['Ir al negocio', 'Recoger el pedido', 'Llevarlo al cliente', 'Entregado'];
    let hoja;
    if (!D.on) hoja = '<div class="sv-dm-n"><span><small>Hoy</small><b class="num">' + pesos(D.hoy) + '</b></span><span><small>Entregas</small><b class="num">' + D.entregas + '</b></span><span><small>Esta semana</small><b class="num">' + pesos(D.sem + D.hoy) + '</b></span></div>' +
      '<p class="sv-dm-av">' + ic('sobre') + '<span><b>' + OFERTAS_DEMO.length + ' pedidos esperando domiciliario</b> cerca de ti en este momento</span></p>' +
      '<button class="sv-btn lima xl" type="button" data-act="sv-dm-on">' + ic('power') + 'Conectarme</button><small class="sv-dm-p">Al conectarte te llegan los pedidos con su tarifa. Tú decides cuál tomar.</small>';
    else if (!D.oferta) hoja = '<div class="sv-dm-h"><b>Pedidos cerca de ti</b><button class="sv-btn borde chico" type="button" data-act="sv-dm-off">Desconectarme</button></div>' +
      OFERTAS_DEMO.filter(o => !D.tomados.includes(o.id)).map(o => { const n = LM.T(o.neg); return '<div class="sv-dm-of"><img src="' + esc(SV.lg(n)) + '" alt=""><div><b>' + esc(n.n) + ' → ' + esc(o.z) + '</b><small>' + esc(o.a) + ' · ' + o.km + '</small><small>' + esc(o.items) + '</small></div><div class="sv-dm-v"><b class="num">' + pesos(o.v) + '</b><button class="sv-btn lima chico" type="button" data-act="sv-dm-tomar" data-id="' + o.id + '">Tomar</button></div></div>'; }).join('') +
      (D.tomados.length >= OFERTAS_DEMO.length ? '<p class="muted">No hay más pedidos por ahora. Te avisamos con sonido cuando salga otro.</p>' : '');
    else hoja = '<div class="sv-dm-h"><b>' + esc(t.n) + ' → ' + esc(D.oferta.z) + '</b><b class="num">' + pesos(D.oferta.v) + '</b></div><ol class="sv-dm-pasos">' + pasos.map((x, i) => '<li class="' + (i < D.paso ? 'ok' : i === D.paso ? 'on' : '') + '">' + x + '</li>').join('') + '</ol>' +
      '<p class="muted" style="margin:6px 0">' + esc(D.oferta.a) + ' · ' + esc(D.oferta.items) + '</p>' +
      '<button class="sv-btn lima xl" type="button" data-act="sv-dm-paso">' + (D.paso === 0 ? 'Llegué al negocio' : D.paso === 1 ? 'Ya lo recogí' : 'Lo entregué') + '</button>';
    return '<div class="sv-dm"><div class="sv-dm-mapa"><svg viewBox="0 0 390 420" aria-hidden="true"><defs><pattern id="svCalles" width="70" height="70" patternUnits="userSpaceOnUse"><rect width="70" height="70" fill="#1d2329"/><rect x="6" y="6" width="58" height="58" rx="6" fill="#262d34"/></pattern></defs><rect width="390" height="420" fill="url(#svCalles)"/><path d="M0 330 390 250" stroke="#3a4228" stroke-width="16"/><rect x="250" y="320" width="90" height="70" rx="8" fill="#22402c"/><text x="295" y="360" fill="#7fae86" font-size="16" text-anchor="middle" font-family="Inter,sans-serif">Parque</text></svg>' +
      ['rancho', 'tienda', 'drogueria'].map((id, i) => '<img class="sv-dm-pin" style="left:' + [26, 72, 66][i] + '%;top:' + [26, 18, 56][i] + '%" src="' + esc(LM.T(id).logo) + '" alt="">').join('') +
      '<span class="sv-dm-yo' + (D.on ? ' on' : '') + '"><img src="' + esc(F('d-danto')) + '" alt=""></span>' +
      '<header class="sv-dm-top"><img src="' + esc(F('d-danto')) + '" alt=""><span><b>Danto</b><small>' + LM.ic('star', 'fill') + '4,9 · Boxer ABC 12D</small></span><button type="button" class="sv-dm-sw' + (D.on ? ' on' : '') + '" data-act="' + (D.on ? 'sv-dm-off' : 'sv-dm-on') + '">' + (D.on ? 'Conectado' : 'Desconectado') + '<i></i></button></header></div>' +
      '<div class="sv-dm-hoja">' + hoja + '</div>' +
      '<p class="sv-dm-nota">' + ic('info') + 'Este es el <b>perfil de ejemplo</b>: funciona en este celular para que veas el recorrido. Con el servidor publicado, el domiciliario real entra por <button class="link" type="button" data-act="go" data-h="rep">Hazte domiciliario</button> (cuenta de prueba <code>danto</code> / 1234).</p></div>';
  }
  const pintarDomi = () => { const app = document.getElementById('app'); app.innerHTML = vDomi(); LM.paint(app); };
  A['sv-dm-on'] = () => { D.on = true; pintarDomi(); toast('Conectado. Te llegan los pedidos de tu zona.'); };
  A['sv-dm-off'] = () => { D.on = false; D.oferta = null; D.paso = 0; pintarDomi(); };
  A['sv-dm-tomar'] = el => { D.oferta = OFERTAS_DEMO.find(o => o.id === +el.dataset.id); D.paso = 0; D.tomados.push(D.oferta.id); pintarDomi(); toast('Tomaste el pedido. Ve a ' + LM.T(D.oferta.neg).n + '.'); };
  A['sv-dm-paso'] = () => { D.paso++; if (D.paso >= 3) { D.hoy += D.oferta.v; D.entregas++; toast('Entregado. Ganaste ' + pesos(D.oferta.v) + '.'); D.oferta = null; D.paso = 0; } pintarDomi(); };

  /* ---------- rutas ---------- */
  const _ruta = E.ruta;
  E.ruta = r => {
    const app = document.getElementById('app');
    document.body.classList.remove('mode-rep', 'mode-admin', 'mode-ext');
    if (r === 'inicio' || r === '') { SV.revisarFotos && SV.revisarFotos(); app.innerHTML = vInicio(); document.body.classList.add('sv-en-inicio'); return true; }
    document.body.classList.remove('sv-en-inicio');
    if (r.indexOf('t-') === 0 && LM.T(r.slice(2))) { app.innerHTML = vTienda(r.slice(2)); return true; }
    if (r === 'demo') { app.innerHTML = vDemo(); return true; }
    if (r === 'domi-demo') { app.innerHTML = vDomi(); return true; }
    return _ruta(r);
  };
  A['ancla'] = A['ancla'] || (el => { const x = document.getElementById(el.dataset.h); if (x) x.scrollIntoView({ behavior: 'smooth' }); });

  /* ---------- encabezado y barra de abajo como en la propuesta ---------- */
  function encabezado() {
    const h = document.querySelector('header.top .hacts');
    if (h && !document.getElementById('svReg')) {
      const a = document.createElement('div'); a.id = 'svReg'; a.className = 'sv-hreg';
      a.innerHTML = '<button type="button" data-act="login" data-tab="negocio">Registra tu negocio</button><button type="button" data-act="go" data-h="rep">Hazte domiciliario</button>';
      h.insertBefore(a, h.firstChild);
    }
    const bn = document.querySelector('.bnav');
    if (bn && !bn.dataset.sv) {
      bn.dataset.sv = 1;
      bn.innerHTML = '<button type="button" data-act="go" data-h="inicio"><span data-i="home"></span>Inicio</button><button type="button" data-act="go" data-h="buscar"><span data-i="search"></span>Buscar</button>' +
        '<button type="button" data-act="go" data-h="cuenta-pedidos"><span data-i="bolsa"></span>Pedidos</button><button type="button" data-act="carrito"><span data-i="cart"></span>Carrito<span class="badge num" data-n="0" id="nCart2">0</span></button>' +
        '<button type="button" data-act="cuenta" data-h="cuenta" id="svBnCta"><span data-i="user"></span><span class="svBnTx">Ingresar</span></button>';
      LM.paint(bn);
    }
    const tx = document.querySelector('#svBnCta .svBnTx'); if (tx) tx.textContent = ses() ? 'Mi cuenta' : 'Ingresar';
  }
  const _tras = E.trasRender;
  E.trasRender = r => { try { _tras(r); } catch (e) {} encabezado(); };
  encabezado();
  SV.vInicio = vInicio; SV.vTienda = vTienda;
})();
