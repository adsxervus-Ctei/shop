/* Mi Tienda · Servus 0.2 · LO NUEVO PARA EL CLIENTE Y LA PLATAFORMA
   1. Franja de pautas arriba del inicio (mínimo 3, máximo 5): la foto rota sola y el color de toda la franja
      cambia con cada pauta. Las tarjetas de atajos quedan encima de ese color.
   2. Estados de los negocios (imagen o video de máximo 15 s, con texto y botón) y "Mis estados" del dueño.
   3. Carruseles que se mueven solos (Súper ofertas, Top 5, Combos y Negocios que debes conocer): se detienen
      al pasar el mouse o tocar, y el producto muestra su detalle.
   4. Buscar por voz y por foto (código QR o de barras), micrófono para Toño y botón para subir al inicio.
   5. Instalar la app: ventana al entrar; si la cierran, queda el aviso pequeño. Nunca se simula la instalación.
   6. Formulario para registrar un negocio nuevo y el panel del superadministrador (#super).
   7. Foto de perfil y "Mis partidas" en la cuenta del cliente. */
(function () {
  'use strict';
  const LM = window.LM, E = LM.EXT, A = LM.A, F = LM.F, SV = LM.sv;
  const { esc, pesos, toast, sheet, closeModal } = LM;
  const ic = (n, c) => SV.ic(n, c);
  const S = () => LM.S;
  const ses = () => LM.S.session;
  const API = () => LM.api || { disponible: false };
  const FOTO = SV.foto;
  const g2 = () => { const s = S(); s.sv02 = s.sv02 || {}; return s.sv02; };
  const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const x = () => '<button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + ic('x') + '</button>';
  const hoyISO = (n = 0) => { const d = new Date(Date.now() + n * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const fechaC = iso => new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '');
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  /* ======================================================================================
     1. FRANJA DE PAUTAS
     ====================================================================================== */
  const PAUTAS_DEMO = [
    { id: 'd1', negocio: 'rancho', titulo: 'Hamburguesa con papas a $18.000', texto: 'Carne de la casa, papas y salsa. En Rancho Costeño, hoy hasta las 3 p. m.', imagen: 'galeria/f-hamburguesa.jpg', enlace: 't-rancho', boton: 'Pedir ahora', inicio: hoyISO(-2), fin: hoyISO(12), valor: 150000, estado: 'activa' },
    { id: 'd2', negocio: 'calzado', titulo: 'Tenis desde $89.000 en Calzado El Paso', texto: 'Cambio de talla gratis. Pagas al recibir.', imagen: 'galeria/f-tenis.jpg', enlace: 't-calzado', boton: 'Ver tenis', inicio: hoyISO(-1), fin: hoyISO(13), valor: 120000, estado: 'activa' },
    { id: 'd3', negocio: 'granja', titulo: 'Gallina criolla y huevos de la Granja Chimí', texto: 'Recogidos hoy. Domicilio a Hatillo y Chimí.', imagen: 'galeria/f-gallinas.jpg', enlace: 't-granja', boton: 'Ver la granja', inicio: hoyISO(0), fin: hoyISO(6), valor: 60000, estado: 'activa' }];
  // Lo de la plataforma: rellena hasta 3 si no hay suficientes pautas pagadas (no dice "Patrocinado")
  const CASA = [
    { id: 'c1', casa: true, titulo: 'Paga con QR o llave Bre-B en todo el pueblo', texto: 'Tu saldo, tus pagos y tus movimientos en la misma app.', imagen: 'galeria/f-celular.jpg', color: '#0B4F55', enlace: 'cuenta-billetera', boton: 'Abrir mi billetera' },
    { id: 'c2', casa: true, titulo: 'Dile a Toño qué necesitas y él lo busca', texto: '"Almuerzo por menos de 20 mil en Chimí". Te muestra opciones y te arma el pedido.', imagen: 'galeria/f-puesto-comida.jpg', color: '#24303A', enlace: 'tono', boton: 'Hablar con Toño' },
    { id: 'c3', casa: true, titulo: '¿Tienes un negocio? Véndele a todo el pueblo', texto: 'Caja, inventario, domicilios y tu vitrina con cupones, desde el celular.', imagen: 'galeria/f-cafe-local.jpg', color: '#2F4A12', enlace: 'registra-negocio', boton: 'Registrar mi negocio' }];
  const PA = { srv: null, t: 0, i: 0, timer: 0 };
  function pautasLocales() { const g = g2(); if (!g.pautas) { g.pautas = PAUTAS_DEMO.map(p => Object.assign({}, p)); LM.save(); } return g.pautas; }
  const vigente = p => p.estado === 'activa' && p.inicio <= hoyISO() && p.fin >= hoyISO();
  function pautasHoy() {
    if (API().disponible && Date.now() - PA.t > 60000) { PA.t = Date.now(); API().get('/api/sv/pautas').then(d => { PA.srv = d.pautas || []; if (enInicio()) refrescarBanda(); }).catch(() => {}); }
    const pagas = (API().disponible && PA.srv ? PA.srv : pautasLocales().filter(vigente)).slice(0, 5);
    return pagas.concat(CASA.slice(0, Math.max(0, 3 - pagas.length)));
  }
  SV.pautasHoy = pautasHoy;
  const enInicio = () => ['', 'inicio'].includes((location.hash || '').slice(1));
  // Color de la franja: el promedio de los colores fuertes de la foto, oscurecido para que el texto blanco se lea
  const COLORES = (() => { try { return JSON.parse(lsGet('sv2-colores', '{}')); } catch (e) { return {}; } })();
  function colorDe(src, cb) {
    if (COLORES[src]) return cb(COLORES[src]);
    const im = new Image();
    im.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = c.height = 32; const k = c.getContext('2d'); k.drawImage(im, 0, 0, 32, 32);
        const d = k.getImageData(0, 0, 32, 32).data; let r = 0, g = 0, b = 0, w = 0;
        for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]), s = mx ? (mx - mn) / mx : 0, p = 0.15 + s * s; r += d[i] * p; g += d[i + 1] * p; b += d[i + 2] * p; w += p; }
        r /= w; g /= w; b /= w;
        const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, f = lum > 0.28 ? 0.28 / lum : 1;
        const hex = '#' + [r, g, b].map(v => Math.round(v * f).toString(16).padStart(2, '0')).join('');
        COLORES[src] = hex; lsSet('sv2-colores', JSON.stringify(COLORES)); cb(hex);
      } catch (e) { cb('#0D5C63'); }
    };
    im.onerror = () => cb('#0D5C63');
    im.src = src;
  }
  function slideH(p, i) {
    const t = p.negocio && LM.T(p.negocio);
    return '<article class="sv2-s' + (i === PA.i ? ' on' : '') + '" data-ix="' + i + '" data-img="' + esc(p.imagen) + '"' + (p.color ? ' data-color="' + esc(p.color) + '"' : '') + ' aria-roledescription="anuncio" aria-label="' + (i + 1) + ' de N"' + (i === PA.i ? '' : ' aria-hidden="true"') + '>' +
      '<img class="sv2-s-img" src="' + esc(p.imagen) + '" alt="" ' + (i ? 'loading="lazy"' : '') + '>' +
      '<div class="sv2-s-tx">' + (p.casa ? '' : '<span class="sv2-pat">Patrocinado</span>') + (t ? '<img class="sv2-s-lg" src="' + esc(SV.lg(t)) + '" alt="">' : '') +
      '<h2>' + esc(p.titulo) + '</h2>' + (p.texto ? '<p>' + esc(p.texto) + '</p>' : '') +
      '<button class="sv-btn blanco" type="button" data-act="sv2-pauta" data-h="' + esc(p.enlace || '') + '"' + (i === PA.i ? '' : ' tabindex="-1"') + '>' + esc(p.boton || 'Ver más') + '</button></div></article>';
  }
  A['sv2-pauta'] = el => { const h = el.dataset.h; if (!h) return; if (h === 'tono') A.tono(); else LM.go(h); };
  const ATAJOS = () => {
    const cli = ses() && ses().rol === 'cliente';
    return [cli ? ['user', 'Hola, ' + esc((S().user.nombre || '').split(' ')[0]), 'Mira tus pedidos, fiados y favoritos.', 'Ir a mi cuenta', 'go', 'cuenta'] : ['user', 'Ingresa a tu cuenta', 'Sigue tus pedidos y guarda tus direcciones.', 'Ingresar', 'login', 'cliente'],
      ['qr', 'Medios de pago', 'Efectivo, Nequi, QR, Bre-B, Mi Tienda Pago o fiado.', 'Ver medios', 'medios', ''],
      ['tag', 'Menos de $10.000', 'Antojos y básicos a buen precio.', 'Ver productos', 'menos', ''],
      ['trophy', 'Más vendidos', 'Lo que más pide el pueblo esta semana.', 'Ver los más vendidos', 'go', 'buscar'],
      ['shield', 'Compra protegida', 'Si llega mal, el negocio te repone o te devuelve.', 'Cómo funciona', 'protegida', ''],
      ['pin', 'Enviar a tu zona', 'Cambia tu zona y mira cuánto vale el domicilio.', 'Cambiar zona', 'zona', '']];
  };
  // Servus 3.0 (diagramación tipo marketplace): la franja ocupa todo el ancho, toma el color de la pauta y deja ver
  // su foto difuminada detrás. Los atajos salieron de la franja: ahora son la caja de beneficios (SV.atajosH).
  SV.bandaH = () => {
    const ps = pautasHoy(); if (PA.i >= ps.length) PA.i = 0;
    const N = ps.length, img0 = (ps[PA.i] || {}).imagen || '';
    return '<section class="sv2-banda sv3-banda" id="mlhero" aria-roledescription="carrusel" aria-label="Pautas y novedades">' +
      '<div class="sv3-difu" aria-hidden="true"><img class="on" src="' + esc(img0) + '" alt=""><img src="' + esc(img0) + '" alt=""></div>' +
      '<div class="wrap sv2-banda-in"><div class="sv2-sl" tabindex="0">' + ps.map(slideH).join('').replace(/de N"/g, 'de ' + N + '"') +
      (N > 1 ? '<button class="sv2-fl l" type="button" data-act="sv2-sl" data-d="-1" aria-label="Anterior">' + ic('chevl') + '</button><button class="sv2-fl r" type="button" data-act="sv2-sl" data-d="1" aria-label="Siguiente">' + ic('chevr') + '</button>' +
        '<div class="sv2-dots">' + ps.map((p, i) => '<button type="button" class="' + (i === PA.i ? 'on' : '') + '" data-act="sv2-sl-ir" data-ix="' + i + '" aria-label="Anuncio ' + (i + 1) + '"><i></i></button>').join('') + '</div>' : '') + '</div>' +
      '<div class="sv-hero-b"><button type="button" class="sv-hero-m" data-act="go" data-h="c-tienda" style="--bg:url(' + esc(SV.abs(FOTO('f-fresas'))) + ')"><b>Mercado a domicilio desde $2.000</b><small>Tiendas y graneros del pueblo</small></button>' +
      '<button type="button" class="sv-hero-n" data-act="go" data-h="registra-negocio"><span><b>¿Tienes un negocio?</b><small>Vende en Mi Tienda y lleva tu caja desde el celular.</small></span>' + ic('arrow') + '</button></div></div></section>';
  };
  // Caja de beneficios debajo de la franja (los mismos atajos de la 0.2, con su botón)
  SV.atajosH = () => '<section class="wrap sv3-benef" aria-label="Atajos"><div class="sv2-atajos">' + ATAJOS().map(c => '<button type="button" class="sv2-at" data-act="' + c[4] + '" data-h="' + c[5] + '" data-tab="' + c[5] + '"><span class="sv2-at-i">' + ic(c[0]) + '</span><span class="sv3-at-tx"><b>' + c[1] + '</b><small>' + c[2] + '</small><em>' + c[3] + '</em></span></button>').join('') + '</div></section>';
  function irSlide(i) {
    const sl = document.querySelector('.sv2-sl'); if (!sl) return;
    const ss = sl.querySelectorAll('.sv2-s'), n = ss.length; if (!n) return;
    PA.i = (i + n) % n;
    ss.forEach((s, k) => { const on = k === PA.i; s.classList.toggle('on', on); s.setAttribute('aria-hidden', on ? 'false' : 'true'); const b = s.querySelector('button'); if (b) b.tabIndex = on ? 0 : -1; });
    sl.querySelectorAll('.sv2-dots button').forEach((b, k) => b.classList.toggle('on', k === PA.i));
    pintarColor();
  }
  function pintarColor() {
    const s = document.querySelector('.sv2-s.on'), banda = document.querySelector('.sv2-banda'); if (!s || !banda) return;
    const aplicar = c => { if (document.querySelector('.sv2-s.on') === s) banda.style.setProperty('--banda', c); };
    if (s.dataset.color) aplicar(s.dataset.color); else colorDe(s.dataset.img, aplicar);
    difuminar(s.dataset.img);
  }
  // La foto de la pauta, difuminada detrás de la franja: dos capas que se cruzan para que el cambio sea suave
  function difuminar(src) {
    const d = document.querySelector('.sv3-difu'); if (!d || !src) return;
    const [a, b] = d.querySelectorAll('img'), on = a.classList.contains('on') ? a : b, otra = on === a ? b : a;
    if (on.getAttribute('src') === src) return;
    otra.onload = () => { otra.classList.add('on'); on.classList.remove('on'); };
    otra.setAttribute('src', src);
  }
  A['sv2-sl'] = el => { irSlide(PA.i + +el.dataset.d); reiniciar(); };
  A['sv2-sl-ir'] = el => { irSlide(+el.dataset.ix); reiniciar(); };
  let pausa = false;
  function reiniciar() { clearInterval(PA.timer); if (RM()) return; PA.timer = setInterval(() => { if (!pausa && !document.hidden && document.querySelector('.sv2-sl')) irSlide(PA.i + 1); }, 5500); }
  function montarBanda() {
    const sl = document.querySelector('.sv2-sl'); if (!sl || sl.dataset.listo) return;
    sl.dataset.listo = 1;
    sl.addEventListener('mouseenter', () => { pausa = true; }); sl.addEventListener('mouseleave', () => { pausa = false; });
    sl.addEventListener('focusin', () => { pausa = true; }); sl.addEventListener('focusout', () => { pausa = false; });
    sl.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { irSlide(PA.i + 1); reiniciar(); } if (e.key === 'ArrowLeft') { irSlide(PA.i - 1); reiniciar(); } });
    let x0 = null;
    sl.addEventListener('pointerdown', e => { x0 = e.clientX; });
    sl.addEventListener('pointerup', e => { if (x0 != null && Math.abs(e.clientX - x0) > 45) { irSlide(PA.i + (e.clientX < x0 ? 1 : -1)); reiniciar(); } x0 = null; });
    pintarColor(); reiniciar();
  }
  function refrescarBanda() { const b = document.querySelector('.sv2-banda'); if (!b) return; const n = document.createElement('div'); n.innerHTML = SV.bandaH(); b.replaceWith(n.firstChild); LM.paint(document.querySelector('.sv2-banda')); montarBanda(); }

  /* ======================================================================================
     2. ESTADOS DE LOS NEGOCIOS
     ====================================================================================== */
  const ES = { srv: null, t: 0 };
  function semilla(t) {
    const p = SV.perfil(t.id), ps = S().prods.filter(x => x.t === t.id && (x.fotoMini || x.fotoSrv)).sort((a, b) => (b.v || 0) - (a.v || 0));
    const img = v => /^data:/.test(v) ? v : FOTO(v);
    const out = [{ id: t.id + '-e1', tipo: 'imagen', src: img(p.portada), texto: p.frase, cta: { tipo: 'tienda', txt: 'Ver la tienda' } }];
    if (ps[0]) out.push({ id: t.id + '-e2', tipo: 'imagen', src: ps[0].fotoSrv || ps[0].fotoMini, texto: 'Hoy: ' + ps[0].n + ' a ' + pesos(LM.precio(ps[0]).p), cta: { tipo: 'producto', ref: ps[0].id, txt: 'Pedir' } });
    out.push({ id: t.id + '-e3', tipo: 'imagen', src: img(p.banner[2]), texto: p.banner[0] + '. ' + p.banner[1], cta: { tipo: 'whatsapp', txt: 'Escribir' } });
    if (ps[1]) out.push({ id: t.id + '-e4', tipo: 'imagen', src: ps[1].fotoSrv || ps[1].fotoMini, texto: ps[1].n + ' · ' + pesos(LM.precio(ps[1]).p), cta: { tipo: 'producto', ref: ps[1].id, txt: 'Ver' } });
    return out;
  }
  function estadosDe(tid) {
    const g = g2(), propios = (g.estados || {})[tid];
    if (ES.srv && ES.srv[tid] && ES.srv[tid].length) return ES.srv[tid];
    if (propios && propios.length) return propios;
    return SV.PERFIL[tid] ? semilla(LM.T(tid)) : [];
  }
  SV.estadosDe = estadosDe;
  function cargarEstados() { if (API().disponible && Date.now() - ES.t > 60000) { ES.t = Date.now(); API().get('/api/sv/estados').then(d => { ES.srv = d.estados || {}; }).catch(() => {}); } }
  const vistos = () => { try { return JSON.parse(lsGet('sv2-vistos', '{}')); } catch (e) { return {}; } };
  SV.estadosH = () => {
    cargarEstados();
    const v = vistos(), ts = S().tiendas.filter(t => estadosDe(t.id).length).sort((a, b) => (v[a.id] ? 1 : 0) - (v[b.id] ? 1 : 0));
    if (!ts.length) return '';
    // Servus 3.0: los estados también se mueven solos (mismo riel de Súper ofertas, Top 5, Combos y Negocios)
    return '<section class="wrap sv2-estados-s"><h2 class="sr">Estados de los negocios</h2>' + SV.riel(ts.map(t => '<button type="button" class="sv2-est' + (v[t.id] ? ' visto' : '') + '" data-act="sv2-ver-est" data-t="' + esc(t.id) + '" aria-label="Ver los estados de ' + esc(t.n) + '"><span class="sv2-anillo"><img src="' + esc(SV.lg(t)) + '" alt=""></span><small>' + esc(t.n) + '</small></button>'), 'estados') + '</section>';
  };
  // Visor de estados (como WhatsApp o Instagram)
  const VE = { lista: [], ti: 0, i: 0, timer: 0, t0: 0, dur: 5000, pausa: false, quedan: 0 };
  A['sv2-ver-est'] = el => {
    VE.lista = S().tiendas.filter(t => estadosDe(t.id).length).map(t => t.id);
    VE.ti = Math.max(0, VE.lista.indexOf(el.dataset.t)); VE.i = 0; abrirVisor();
  };
  function abrirVisor() {
    let o = document.getElementById('sv2Visor');
    if (!o) { o = document.createElement('div'); o.id = 'sv2Visor'; o.className = 'sv2-visor'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); document.body.appendChild(o); }
    document.body.classList.add('sv2-sin-scroll'); pintarVisor();
  }
  function cerrarVisor() { clearTimeout(VE.timer); cancelAnimationFrame(VE.raf); const o = document.getElementById('sv2Visor'); if (o) o.remove(); document.body.classList.remove('sv2-sin-scroll'); }
  async function srcDe(e) { if (/^idb:/.test(e.src)) { const b = await idb('get', e.src.slice(4)); return b ? URL.createObjectURL(b) : ''; } return e.src; }
  async function pintarVisor() {
    const o = document.getElementById('sv2Visor'); if (!o) return;
    const tid = VE.lista[VE.ti], t = LM.T(tid), ls = estadosDe(tid), e = ls[VE.i];
    if (!e) { cerrarVisor(); return; }
    const v = vistos(); v[tid] = 1; lsSet('sv2-vistos', JSON.stringify(v));
    const cta = e.cta && e.cta.tipo !== 'ninguno' ? '<button class="sv-btn lima" type="button" data-act="sv2-est-cta">' + esc(e.cta.txt || { tienda: 'Ver la tienda', producto: 'Pedir', whatsapp: 'Escribir' }[e.cta.tipo] || 'Ver') + '</button>' : '';
    o.setAttribute('aria-label', 'Estados de ' + t.n);
    o.innerHTML = '<div class="sv2-v-caja"><div class="sv2-v-barras">' + ls.map((_, i) => '<i><b style="width:' + (i < VE.i ? 100 : 0) + '%"></b></i>').join('') + '</div>' +
      '<header class="sv2-v-h"><img src="' + esc(SV.lg(t)) + '" alt=""><span><b>' + esc(t.n) + '</b><small>' + esc(SV.perfil(tid).tipo) + '</small></span>' +
      (e.tipo === 'video' ? '<button type="button" class="sv2-v-b" data-act="sv2-est-son" aria-label="Activar o quitar el sonido">' + ic('megafono') + '</button>' : '') +
      '<button type="button" class="sv2-v-b" data-act="sv2-est-x" aria-label="Cerrar">' + ic('x') + '</button></header>' +
      '<div class="sv2-v-m" id="sv2VM"></div>' +
      '<button type="button" class="sv2-v-zona izq" data-act="sv2-est-ant" aria-label="Estado anterior"></button><button type="button" class="sv2-v-zona der" data-act="sv2-est-sig" aria-label="Estado siguiente"></button>' +
      '<footer class="sv2-v-f">' + (e.texto ? '<p>' + esc(e.texto) + '</p>' : '') + cta + '</footer></div>';
    LM.paint(o);
    const m = o.querySelector('#sv2VM'), src = await srcDe(e);
    if (e.tipo === 'video') {
      m.innerHTML = '<video src="' + esc(src) + '" playsinline muted autoplay preload="auto"></video>';
      const vid = m.querySelector('video');
      vid.addEventListener('loadedmetadata', () => { VE.dur = Math.min(15.5, vid.duration || 15) * 1000; arrancar(); });
      vid.addEventListener('ended', siguiente);
      vid.addEventListener('error', () => { VE.dur = 3000; arrancar(); });
    } else {
      m.innerHTML = '<img src="' + esc(src) + '" alt="">'; VE.dur = 5000; arrancar();
    }
    const caja = o.querySelector('.sv2-v-caja');
    caja.addEventListener('pointerdown', ev => { if (ev.target.closest('button:not(.sv2-v-zona)')) return; VE.hold = setTimeout(() => pausar(true), 220); });
    caja.addEventListener('pointerup', () => { clearTimeout(VE.hold); if (VE.pausa) setTimeout(() => pausar(false), 0); });
  }
  function arrancar() { cancelAnimationFrame(VE.raf); VE.t0 = performance.now(); VE.acum = 0; VE.pausa = false; tick(); }
  function tick() {
    const b = document.querySelectorAll('.sv2-v-barras b')[VE.i]; if (!b) return;
    const p = Math.min(1, (VE.acum + (VE.pausa ? 0 : performance.now() - VE.t0)) / VE.dur);
    b.style.width = (p * 100) + '%';
    if (p >= 1) { const vid = document.querySelector('#sv2VM video'); if (!vid || vid.ended || vid.error) siguiente(); return; }
    VE.raf = requestAnimationFrame(tick);
  }
  function pausar(on) {
    if (on === VE.pausa) return;
    const vid = document.querySelector('#sv2VM video');
    if (on) { VE.acum += performance.now() - VE.t0; VE.pausa = true; if (vid) vid.pause(); }
    else { VE.t0 = performance.now(); VE.pausa = false; if (vid) vid.play().catch(() => {}); }
  }
  function siguiente() { cancelAnimationFrame(VE.raf); const ls = estadosDe(VE.lista[VE.ti]); if (VE.i + 1 < ls.length) VE.i++; else if (VE.ti + 1 < VE.lista.length) { VE.ti++; VE.i = 0; } else { cerrarVisor(); return; } pintarVisor(); }
  function anterior() { cancelAnimationFrame(VE.raf); if (VE.i > 0) VE.i--; else if (VE.ti > 0) { VE.ti--; VE.i = estadosDe(VE.lista[VE.ti]).length - 1; } pintarVisor(); }
  A['sv2-est-sig'] = () => { if (!VE.pausa) siguiente(); };
  A['sv2-est-ant'] = () => { if (!VE.pausa) anterior(); };
  A['sv2-est-x'] = cerrarVisor;
  A['sv2-est-son'] = () => { const v = document.querySelector('#sv2VM video'); if (v) v.muted = !v.muted; };
  A['sv2-est-cta'] = () => {
    const tid = VE.lista[VE.ti], e = estadosDe(tid)[VE.i], t = LM.T(tid); cerrarVisor();
    if (e.cta.tipo === 'producto' && LM.PR(e.cta.ref)) A.ver({ dataset: { id: e.cta.ref } });
    else if (e.cta.tipo === 'whatsapp') window.open('https://wa.me/57' + String(t.tel || '').replace(/\D/g, '') + '?text=' + encodeURIComponent('Hola, ' + t.n + '. Vi tu estado en Mi Tienda.'), '_blank', 'noopener');
    else LM.go('t-' + tid);
  };
  document.addEventListener('keydown', e => { if (!document.getElementById('sv2Visor')) return; if (e.key === 'Escape') cerrarVisor(); if (e.key === 'ArrowRight') siguiente(); if (e.key === 'ArrowLeft') anterior(); });

  // Videos del dueño cuando no hay servidor: se guardan en este aparato (IndexedDB), no en localStorage
  function idb(op, k, v) {
    return new Promise(ok => {
      try {
        const r = indexedDB.open('mitienda-estados', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('v');
        r.onsuccess = () => { const tx = r.result.transaction('v', op === 'get' ? 'readonly' : 'readwrite'), s = tx.objectStore('v'); const q = op === 'get' ? s.get(k) : op === 'put' ? s.put(v, k) : s.delete(k); q.onsuccess = () => ok(q.result); q.onerror = () => ok(null); };
        r.onerror = () => ok(null);
      } catch (e) { ok(null); }
    });
  }
  // Panel del dueño: Mis estados
  const ME = { archivo: null, tipo: '', seg: 0, vista: '', srv: null, cargando: false };
  const conServidor = tid => API().disponible && API().yo && API().esDeNegocio(tid);
  function pEstados(t) {
    if (conServidor(t.id) && !ME.srv && !ME.cargando) { ME.cargando = true; API().get('/api/negocio/' + t.id + '/estados').then(d => { ME.srv = d.estados; ME.cargando = false; LM.rerender(); }).catch(() => { ME.cargando = false; }); }
    const propios = conServidor(t.id) ? (ME.srv || []) : ((g2().estados || {})[t.id] || []);
    const prods = S().prods.filter(p => p.t === t.id);
    return '<div class="sv-cab"><div><h1>Mis estados</h1><p>Lo que ven los clientes al tocar el círculo de tu negocio en el inicio. Fotos o videos de máximo 15 segundos, con un texto y un botón.</p></div><div class="sv-cab-b"><button class="sv-btn teal" type="button" data-act="go" data-h="inicio">' + ic('eye') + 'Ver en el inicio</button></div></div>' +
      (propios.length < 3 ? '<div class="sv-alerta amar">' + ic('info') + '<span><b>Sube por lo menos 3 estados.</b> Mientras tanto, los clientes ven 3 de ejemplo armados con tu portada y tus productos.</span></div>' : '') +
      '<div class="sv2-est-panel"><form class="sv-box sv2-est-form" data-form="sv2-est-subir"><h2>Nuevo estado</h2>' +
      '<label class="sv2-drop" for="sv2EstF">' + (ME.vista ? (ME.tipo === 'video' ? '<video src="' + esc(ME.vista) + '" muted playsinline controls></video>' : '<img src="' + esc(ME.vista) + '" alt="Vista previa">') : ic('subir') + '<b>Toca para escoger una foto o un video</b><small>Video de máximo 15 segundos y 8 MB</small>') + '</label>' +
      '<input id="sv2EstF" class="sr" type="file" accept="image/*,video/mp4,video/webm,video/quicktime" data-chg="sv2-est-f">' +
      '<div class="campo"><label for="sv2EstT">Texto (opcional)</label><input id="sv2EstT" name="texto" maxlength="160" placeholder="Ej: Hoy hay sancocho de gallina"></div>' +
      '<div class="campo"><label for="sv2EstC">Botón</label><select id="sv2EstC" name="cta"><option value="tienda">Ver la tienda</option><option value="producto">Pedir un producto</option><option value="whatsapp">Escribir por WhatsApp</option><option value="ninguno">Sin botón</option></select></div>' +
      '<div class="campo"><label for="sv2EstP">Producto del botón</label><select id="sv2EstP" name="prod">' + prods.map(p => '<option value="' + esc(p.id) + '">' + esc(p.n) + '</option>').join('') + '</select></div>' +
      '<button class="sv-btn teal xl" type="submit"' + (ME.archivo ? '' : ' disabled') + '>' + ic('subir') + 'Publicar estado</button></form>' +
      '<div class="sv-box"><h2>Publicados (' + propios.length + ' de 10)</h2>' + (propios.length ? '<div class="sv2-est-l">' + propios.map(e => '<figure>' + (e.tipo === 'video' ? '<span class="sv2-est-vid">' + ic('video') + (e.segundos ? Math.round(e.segundos) + ' s' : 'Video') + '</span>' : '<img src="' + esc(e.src) + '" alt="">') + '<figcaption>' + esc(e.texto || 'Sin texto') + '</figcaption><button class="sv-btn gris chico" type="button" data-act="sv2-est-borrar" data-id="' + esc(e.id) + '">' + ic('trash') + 'Borrar</button></figure>').join('') + '</div>' : '<p class="muted">Todavía no has publicado estados.</p>') + '</div></div>';
  }
  pEstados.v9 = true;
  E.panelFn.estados = pEstados;
  const _items = E.panelItems;
  E.panelItems = (items, t, caj) => {
    const out = _items(items, t, caj);
    if (!caj) { const i = out.findIndex(z => z[0] === 'vitrina'); const it = ['estados', 'video', 'Mis estados']; if (i >= 0) out.splice(i + 1, 0, it); else out.push(it); }
    return out;
  };
  A['sv2-est-f'] = el => {
    const f = el.files && el.files[0]; if (!f) return;
    const video = /^video\//.test(f.type);
    if (video && f.size > 8 * 1024 * 1024) { toast('El video pesa más de 8 MB. Grábalo más corto o en menor calidad.'); el.value = ''; return; }
    if (video) {
      const url = URL.createObjectURL(f), v = document.createElement('video'); v.preload = 'metadata'; v.muted = true;
      v.onloadedmetadata = () => {
        if (!(v.duration > 0) || v.duration > 15.5) { toast('El video dura ' + Math.round(v.duration || 0) + ' segundos. Máximo 15: recórtalo en tu celular (Galería → Editar → Recortar).'); URL.revokeObjectURL(url); el.value = ''; return; }
        Object.assign(ME, { archivo: f, tipo: 'video', seg: Math.round(v.duration * 10) / 10, vista: url }); LM.rerender();
      };
      v.onerror = () => toast('No pudimos leer ese video. Prueba con un MP4.');
      v.src = url;
    } else {
      achicar(f, 1080, 0.82).then(d => { Object.assign(ME, { archivo: d, tipo: 'imagen', seg: 0, vista: d }); LM.rerender(); }).catch(() => toast('No pudimos leer esa foto.'));
    }
  };
  function achicar(file, max, q) {
    return new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', q)); }; im.onerror = mal; im.src = r.result; }; r.onerror = mal; r.readAsDataURL(file); });
  }
  SV.achicar = achicar;
  const aDataURL = f => new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = mal; r.readAsDataURL(f); });
  F['sv2-est-subir'] = async (f, d) => {
    const t = LM.T(ses().t); if (!ME.archivo) return;
    const ctaT = String(d.get('cta')), cta = { tipo: ctaT, ref: ctaT === 'producto' ? String(d.get('prod')) : '', txt: { tienda: 'Ver la tienda', producto: 'Pedir', whatsapp: 'Escribir', ninguno: '' }[ctaT] };
    const btn = f.querySelector('[type=submit]'); if (btn) { btn.disabled = true; btn.textContent = 'Publicando…'; }
    try {
      if (conServidor(t.id)) {
        const archivo = ME.tipo === 'video' ? await aDataURL(ME.archivo) : ME.archivo;
        const r = await API().post('/api/negocio/' + t.id + '/estados', { archivo, texto: String(d.get('texto') || ''), cta_tipo: cta.tipo, cta_ref: cta.ref, cta_txt: cta.txt, segundos: ME.seg });
        ME.srv = [r.estado].concat(ME.srv || []); ES.t = 0;
      } else {
        const g = g2(); g.estados = g.estados || {}; const ls = g.estados[t.id] = g.estados[t.id] || [];
        if (ls.length >= 10) { toast('Tienes 10 estados (el máximo). Borra uno para subir otro.'); return; }
        const id = 'e' + Date.now(); let src = ME.archivo;
        if (ME.tipo === 'video') { await idb('put', id, ME.archivo); src = 'idb:' + id; }
        ls.unshift({ id, tipo: ME.tipo, src, texto: String(d.get('texto') || ''), cta, segundos: ME.seg || null }); LM.save();
      }
      Object.assign(ME, { archivo: null, tipo: '', seg: 0, vista: '' }); toast('Estado publicado. Ya lo ven en el inicio.'); LM.rerender();
    } catch (e) { toast(e.message || 'No se pudo publicar.'); if (btn) { btn.disabled = false; btn.textContent = 'Publicar estado'; } }
  };
  A['sv2-est-borrar'] = async el => {
    const t = LM.T(ses().t), id = el.dataset.id;
    if (conServidor(t.id)) { try { await API().post('/api/negocio/' + t.id + '/estados/' + id + '/borrar'); ME.srv = (ME.srv || []).filter(e => String(e.id) !== id); ES.t = 0; } catch (e) { toast(e.message); return; } }
    else { const ls = (g2().estados || {})[t.id] || []; const i = ls.findIndex(e => e.id === id); if (i >= 0) { if (/^idb:/.test(ls[i].src)) idb('del', ls[i].src.slice(4)); ls.splice(i, 1); LM.save(); } }
    toast('Estado borrado.'); LM.rerender();
  };

  /* ======================================================================================
     3. CARRUSELES QUE SE MUEVEN SOLOS
     ====================================================================================== */
  // La lista va dos veces seguidas: al llegar a la mitad vuelve al principio sin que se note.
  SV.riel = (items, cls) => '<div class="sv2-riel ' + (cls || '') + '" data-riel tabindex="0" aria-label="Lista que se mueve sola. Pasa el mouse o toca para detenerla."><div class="sv2-pista">' + items.join('') + '</div><div class="sv2-pista copia" aria-hidden="true" inert>' + items.join('') + '</div></div>';
  const RIELES = new Set();
  function montarRieles() {
    document.querySelectorAll('[data-riel]').forEach(r => {
      if (r.dataset.listo) return; r.dataset.listo = 1;
      const st = { r, pausa: false, quieto: 0, x: 0 };
      const parar = () => { st.pausa = true; }, seguir = () => { st.pausa = false; st.quieto = performance.now() + 600; st.x = r.scrollLeft; };
      r.addEventListener('mouseenter', parar); r.addEventListener('mouseleave', seguir);
      r.addEventListener('focusin', parar); r.addEventListener('focusout', seguir);
      r.addEventListener('touchstart', parar, { passive: true }); r.addEventListener('touchend', () => setTimeout(seguir, 2500), { passive: true });
      r.addEventListener('wheel', () => { st.quieto = performance.now() + 2500; st.x = r.scrollLeft; }, { passive: true });
      st.x = r.scrollLeft;
      RIELES.add(st);
    });
  }
  let ult = 0;
  function animar(ts) {
    const dt = ult ? Math.min(64, ts - ult) : 16; ult = ts;
    // Con navegador automático (pruebas) no se mueve, salvo que la prueba lo pida (window.sv2Mover)
    if (!RM() && (!navigator.webdriver || window.sv2Mover)) RIELES.forEach(st => {
      if (!st.r.isConnected) { RIELES.delete(st); return; }
      const p1 = st.r.firstElementChild, mitad = p1 ? p1.offsetWidth : 0; // una vuelta = el ancho de la primera lista
      if (st.pausa || ts < st.quieto || !mitad || st.r.scrollWidth <= st.r.clientWidth + 2) { st.x = st.r.scrollLeft; return; }
      st.x += dt * 0.035; // ~35 px por segundo
      if (st.x >= mitad) st.x -= mitad;
      st.r.scrollLeft = st.x;
    });
    requestAnimationFrame(animar);
  }
  requestAnimationFrame(animar);

  /* ======================================================================================
     4. BUSCAR POR VOZ Y POR FOTO · MICRÓFONO DE TOÑO · SUBIR AL INICIO
     ====================================================================================== */
  const Reco = window.SpeechRecognition || window.webkitSpeechRecognition;
  function dictar(boton, alTerminar) {
    if (!Reco) { toast('Este navegador no permite dictar. Usa Chrome en Android o Safari en iPhone.'); return; }
    const r = new Reco(); r.lang = 'es-CO'; r.interimResults = true; r.maxAlternatives = 1;
    let final = '';
    boton.classList.add('oyendo'); boton.setAttribute('aria-pressed', 'true');
    r.onresult = e => { final = Array.from(e.results).map(x => x[0].transcript).join(' '); alTerminar(final, false); };
    r.onerror = e => { boton.classList.remove('oyendo'); boton.setAttribute('aria-pressed', 'false'); if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Permite el micrófono para buscar por voz (candado de la barra de direcciones).'); else if (e.error === 'no-speech') toast('No te escuché. Toca el micrófono y habla cerca del celular.'); };
    r.onend = () => { boton.classList.remove('oyendo'); boton.setAttribute('aria-pressed', 'false'); if (final.trim()) alTerminar(final.trim(), true); };
    try { r.start(); toast('Te escucho… di lo que buscas.'); } catch (e) { boton.classList.remove('oyendo'); }
  }
  function montarBuscador() {
    const f = document.querySelector('header.top form.search'); if (!f || f.dataset.sv2) return; f.dataset.sv2 = 1;
    const enviar = f.querySelector('button[type=submit]');
    const b1 = document.createElement('button'); b1.type = 'button'; b1.className = 'sv2-sb'; b1.dataset.act = 'sv2-voz'; b1.setAttribute('aria-label', 'Buscar por voz'); b1.setAttribute('aria-pressed', 'false'); b1.innerHTML = ic('mic');
    // Servus 3.0: se quitó el botón de buscar con la cámara (foto de código QR o de barras) por pedido del administrador
    f.insertBefore(b1, enviar);
  }
  A['sv2-voz'] = el => dictar(el, (txt, fin) => { const q = document.getElementById('q'); if (!q) return; q.value = txt; if (fin) { const f = q.form; if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); } });
  // Micrófono en Toño: se agrega cada vez que se pinta su ventana
  function montarTono() {
    const p = document.getElementById('tono'); if (!p) return;
    const f = p.querySelector('form'); if (!f || f.querySelector('.sv2-tono-mic')) return;
    const inp = f.querySelector('input'), env = f.querySelector('button[type=submit]');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sv2-tono-mic'; b.setAttribute('aria-label', 'Hablarle a Toño'); b.setAttribute('aria-pressed', 'false'); b.innerHTML = ic('mic');
    b.addEventListener('click', () => dictar(b, (txt, fin) => { if (!inp) return; inp.value = txt; if (fin) { if (f.requestSubmit) f.requestSubmit(); else if (env) env.click(); } }));
    if (env) f.insertBefore(b, env); else f.appendChild(b);
  }
  new MutationObserver(montarTono).observe(document.body, { childList: true, subtree: false });
  setInterval(montarTono, 1500);
  // Subir al inicio, al lado de Toño
  const arriba = document.createElement('button');
  arriba.type = 'button'; arriba.id = 'sv2Arriba'; arriba.className = 'sv2-arriba'; arriba.setAttribute('aria-label', 'Subir al inicio de la página'); arriba.innerHTML = ic('arriba');
  arriba.addEventListener('click', () => { scrollTo({ top: 0, behavior: RM() ? 'auto' : 'smooth' }); const l = document.querySelector('.logo'); if (l) l.focus({ preventScroll: true }); });
  document.body.appendChild(arriba);
  addEventListener('scroll', () => { arriba.classList.toggle('on', scrollY > 700 && !document.body.classList.contains('sv2-modo-tv')); }, { passive: true });

  /* ======================================================================================
     5. INSTALAR LA APP
     ====================================================================================== */
  const enApp = () => LM.enApp ? LM.enApp() : false;
  // Al entrar: la ventana de instalación (una vez por visita). Si la cierran, queda el aviso pequeño abajo.
  const _banner = E.bannerInstalar;
  E.bannerInstalar = () => {
    if (enApp() || (E.yaInstalada && E.yaInstalada())) return;
    if (lsGet('hm-pruebas', '')) { _banner(); return; } // las pruebas automáticas no ven la ventana, solo el aviso
    let vista = ''; try { vista = sessionStorage.getItem('sv2-inst-pop') || ''; } catch (e) {}
    const cerrada = +lsGet('hm-inst-x', 0) > Date.now();
    if (!vista && !cerrada) { try { sessionStorage.setItem('sv2-inst-pop', '1'); } catch (e) {} setTimeout(() => { if (!document.querySelector('#modal:not([hidden])') && !document.getElementById('sv2Visor')) LM.instShow(); }, 1400); }
    else _banner();
  };
  const _instX = A['inst-x'];
  A['inst-x'] = el => { _instX(el); setTimeout(() => { if (!enApp()) { lsSet('mt-banner-x', '0'); _banner(); } }, 300); };
  // Si el navegador no ofrece instalar, se explica cómo hacerlo de verdad (antes salía "instalada" sin estarlo)
  E.instManual = () => {
    const ua = navigator.userAgent, enRed = /FBAN|FBAV|Instagram|WhatsApp|Line\/|TikTok/i.test(ua), samsung = /SamsungBrowser/i.test(ua), android = /Android/i.test(ua), edge = /Edg\//.test(ua);
    let pasos;
    if (enRed) pasos = [['Ábrela en Chrome', 'Estás dentro de WhatsApp, Facebook o Instagram, y ahí no se puede instalar. Toca los tres puntos (⋮) y escoge <b>Abrir en Chrome</b> o <b>Abrir en el navegador</b>.'], ['Vuelve a tocar Instalar', 'Ya en Chrome, sale la ventana para instalar.']];
    else if (samsung) pasos = [['Toca el menú', 'Las tres rayas (≡) abajo a la derecha.'], ['"Agregar página a"', 'Escoge <b>Pantalla de inicio</b>.'], ['Busca el ícono', 'Queda en tu pantalla de inicio o en la lista de apps.']];
    else if (android) pasos = [['Toca los tres puntos (⋮)', 'Arriba a la derecha en Chrome.'], ['"Instalar app" o "Agregar a la pantalla principal"', 'Luego toca <b>Instalar</b>.'], ['Busca el ícono', 'Chrome lo pone en la pantalla de inicio. Si no lo ves, está en la lista de apps.']];
    else pasos = [['Busca el ícono de instalar', 'En ' + (edge ? 'Edge' : 'Chrome') + ', al final de la barra de direcciones hay un ícono de computador con una flecha. Tócalo.'], ['Toca "Instalar"', 'La app queda en el escritorio y en el menú de inicio.'], ['¿No sale el ícono?', 'Menú (⋮) → <b>Transmitir, guardar y compartir</b> → <b>Instalar página como app</b>.']];
    LM.ovl('instOv', '<div class="st-sheet" role="dialog" aria-modal="true" aria-labelledby="sv2InstT"><div class="st-scroll"><h2 id="sv2InstT" style="margin-bottom:6px">Instalar Mi Tienda</h2><p class="muted" style="margin:0 0 12px">' + (enRed ? 'Desde aquí no se puede instalar.' : 'Tu navegador no abrió la ventana de instalación (pasa si ya la tienes instalada o si la cerraste antes). Hazlo así:') + '</p><ol class="pasos">' +
      pasos.map(s => '<li class="ok"><span class="pt">' + ic('check') + '</span><div><strong>' + s[0] + '</strong><small>' + s[1] + '</small></div></li>').join('') + '</ol>' +
      '<p class="muted" style="font-size:13px">' + ic('info') + ' En algunos Samsung y Xiaomi la app queda solo en la lista de apps. Para que salga en la pantalla de inicio: mantén presionado el ícono y toca <b>Agregar a inicio</b>.</p>' +
      '<div class="st-acts"><button class="btn b-lg" type="button" data-act="inst-x">Entendido</button></div></div></div>', 'inst');
  };

  /* ======================================================================================
     6. REGISTRAR UN NEGOCIO (#registra-negocio) Y SUPERADMINISTRADOR (#super)
     ====================================================================================== */
  const CATS_REG = [['comida', 'Restaurante o asadero'], ['rapida', 'Comidas rápidas y jugos'], ['tienda', 'Tienda, minimercado o panadería'], ['farmacia', 'Droguería'], ['papeleria', 'Papelería'], ['deposito', 'Depósito o ferretería'], ['ropa', 'Ropa y calzado'], ['belleza', 'Barbería o belleza'], ['taller', 'Taller de motos'], ['billar', 'Billar o juegos'], ['agro', 'Agro y veterinaria'], ['mayorista', 'Granos y víveres por mayor'], ['pesca', 'Pescado'], ['quesera', 'Quesos y lácteos'], ['granja', 'Granja'], ['distribuidora', 'Distribuidora'], ['campo', 'Del campo'], ['otro', 'Otro']];
  const MUNIS = ['Hatillo de Loba', 'San Martín de Loba', 'Barranco de Loba', 'Otro'];
  const REG = { ok: null, err: '' };
  function vRegistro() {
    if (REG.ok) return '<div class="wrap sv2-reg"><div class="sv-box sv2-centro">' + ic('check', 'grande') + '<h1>¡Recibimos tu solicitud!</h1><p>Te vamos a llamar o escribir al <b class="num">' + esc(REG.ok.tel) + '</b> en los próximos días para activar <b>' + esc(REG.ok.nombre) + '</b>. Cuando esté aprobado te llega tu usuario y una clave para entrar.</p><button class="sv-btn teal" type="button" data-act="go" data-h="inicio">Volver al inicio</button></div></div>';
    return '<div class="wrap sv2-reg"><div class="sv2-reg-g"><div class="sv2-reg-i"><h1>Registra tu negocio en Mi Tienda</h1><p>Llena estos datos y el equipo de Mi Tienda te contacta para activarlo. No pagas nada por registrarte.</p>' +
      '<ul class="sv2-ul"><li>' + ic('check') + 'Tu vitrina con portada, cupones y estados.</li><li>' + ic('check') + 'Caja, inventario, gastos y balance desde el celular.</li><li>' + ic('check') + 'Pedidos y domicilios con los domiciliarios del pueblo.</li></ul>' +
      '<p class="muted">¿Ya tienes cuenta de negocio? <button class="link" type="button" data-act="login" data-tab="negocio">Entrar a mi negocio</button></p></div>' +
      '<form class="sv-box sv2-form" data-form="sv2-registro"><div class="campo"><label for="rgN">Nombre del negocio</label><input id="rgN" name="nombre" required maxlength="80" autocomplete="organization"></div>' +
      '<div class="campo"><label for="rgC">¿Qué tipo de negocio es?</label><select id="rgC" name="categoria">' + CATS_REG.map(c => '<option value="' + c[0] + '">' + c[1] + '</option>').join('') + '</select></div>' +
      '<div class="sv2-2"><div class="campo"><label for="rgM">Municipio</label><select id="rgM" name="municipio">' + MUNIS.map(m => '<option>' + m + '</option>').join('') + '</select></div><div class="campo"><label for="rgD">Dirección</label><input id="rgD" name="direccion" maxlength="140" autocomplete="street-address"></div></div>' +
      '<div class="campo"><label for="rgO">Nombre del dueño o la dueña</label><input id="rgO" name="dueno" required maxlength="80" autocomplete="name"></div>' +
      '<div class="sv2-2"><div class="campo"><label for="rgT">Celular (WhatsApp)</label><input id="rgT" name="telefono" required inputmode="tel" maxlength="13" placeholder="3001234567" autocomplete="tel-national"></div><div class="campo"><label for="rgE">Correo (opcional)</label><input id="rgE" name="correo" type="email" maxlength="120" autocomplete="email"></div></div>' +
      '<div class="campo"><label for="rgX">¿Qué vendes? (opcional)</label><textarea id="rgX" name="mensaje" rows="3" maxlength="400"></textarea></div>' +
      '<label class="sv2-chk"><input type="checkbox" name="acepta" required> Acepto la <a href="privacidad.html" target="_blank" rel="noopener">política de privacidad</a> y que me contacten por WhatsApp o llamada.</label>' +
      (REG.err ? '<p class="sv2-err" role="alert">' + esc(REG.err) + '</p>' : '') + '<button class="sv-btn teal xl" type="submit">Enviar solicitud</button></form></div></div>';
  }
  F['sv2-registro'] = async (f, d) => {
    const b = Object.fromEntries(d.entries()); b.acepta = !!d.get('acepta'); REG.err = '';
    const tel = String(b.telefono || '').replace(/\D/g, '').replace(/^57(?=3\d{9}$)/, '');
    if (!/^3\d{9}$/.test(tel)) { REG.err = 'Escribe un celular de 10 números que empiece por 3.'; LM.rerender(); return; }
    try {
      if (API().disponible) await API().post('/api/sv/solicitud-negocio', b);
      else { const g = g2(); g.solicitudes = solicitudesLocales(); g.solicitudes.unshift({ id: Date.now(), nombre: b.nombre, categoria: b.categoria, municipio: b.municipio, direccion: b.direccion, dueno_nombre: b.dueno, telefono: tel, correo: b.correo, mensaje: b.mensaje, estado: 'pendiente', creado: new Date().toISOString() }); LM.save(); }
      REG.ok = { tel, nombre: b.nombre }; LM.rerender(); scrollTo(0, 0);
    } catch (e) { REG.err = e.message; LM.rerender(); }
  };
  // Los botones "Registra tu negocio" llevan al formulario
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-act="login"][data-tab="negocio"]'); if (b && /Registra/i.test(b.textContent)) { e.stopImmediatePropagation(); e.preventDefault(); LM.go('registra-negocio'); } }, true);

  /* ---------- superadministrador ---------- */
  const SA = { tab: 'resumen', d: {}, err: '', cargando: false, estado: 'pendiente', q: '', local: false, clave: null, editar: null };
  function solicitudesLocales() { const g = g2(); if (!g.solicitudes) g.solicitudes = [{ id: 1, nombre: 'Panadería La Espiga', categoria: 'tienda', municipio: 'Hatillo de Loba', direccion: 'Calle del Comercio', dueno_nombre: 'Yolanda Mejía', telefono: '3157770011', correo: 'espiga@ejemplo.com', mensaje: 'Queremos vender pan y tortas por encargo.', estado: 'pendiente', creado: new Date(Date.now() - 864e5).toISOString() }, { id: 2, nombre: 'Taller Moto Rápido', categoria: 'taller', municipio: 'San Martín de Loba', direccion: 'Salida a Barranco', dueno_nombre: 'Wilmer Ortiz', telefono: '3168880022', mensaje: 'Reparación de motos y venta de repuestos.', estado: 'pendiente', creado: new Date(Date.now() - 3 * 3600e3).toISOString() }]; return g.solicitudes; }
  const esSuper = () => API().disponible ? API().tieneRol('admin') : lsGet('sv2-super', '') === '1';
  async function cargarSA() {
    SA.err = '';
    if (!API().disponible) { SA.local = true; localSA(); return; }
    SA.cargando = true;
    try {
      if (SA.tab === 'resumen') { SA.d.res = await API().get('/api/super/resumen'); SA.d.pautas = (await API().get('/api/super/pautas')).pautas; }
      if (SA.tab === 'solicitudes') SA.d.sol = (await API().get('/api/super/solicitudes?estado=' + SA.estado)).solicitudes;
      if (SA.tab === 'negocios') SA.d.neg = (await API().get('/api/super/negocios')).negocios;
      if (SA.tab === 'clientes') SA.d.cli = (await API().get('/api/super/clientes?q=' + encodeURIComponent(SA.q))).clientes;
      if (SA.tab === 'pautas') { const r = await API().get('/api/super/pautas'); SA.d.pautas = r.pautas; SA.d.negs = SA.d.neg || (await API().get('/api/super/negocios')).negocios; }
    } catch (e) { SA.err = e.message; }
    SA.cargando = false;
  }
  function localSA() {
    const sol = solicitudesLocales(), ts = S().tiendas;
    SA.d.sol = sol.filter(s => s.estado === SA.estado);
    SA.d.neg = ts.map(t => ({ id: t.id, nombre: t.n, categoria: t.cat, municipio: 'Hatillo de Loba', estado: (g2().suspendidos || []).includes(t.id) ? 'suspendido' : 'activo', dueno: SV.perfil(t.id).dueno, telefono: t.tel, pedidos30: S().orders.filter(o => o.t === t.id).length }));
    SA.d.negs = SA.d.neg;
    SA.d.cli = [{ nombre: S().user.nombre || 'María de Chimí', telefono: '3105550102', usuario: 'maria', roles: ['cliente'], creado: new Date().toISOString(), pedidos: S().orders.length }];
    SA.d.pautas = pautasLocales().map(p => Object.assign({}, p, { negocio_nombre: (LM.T(p.negocio) || {}).n }));
    SA.d.res = { negocios: { total: ts.length, activos: ts.filter(t => !(g2().suspendidos || []).includes(t.id)).length, nuevos30: 0 }, clientes: { total: 1, nuevos7: 1, hoy: 0 }, hoy: { pedidos: S().orders.length, ventas: S().orders.reduce((a, o) => a + (o.total || 0), 0) }, solicitudes: sol.filter(s => s.estado === 'pendiente').length, repartidores: 0, pqr: 0, pautas: { n: SA.d.pautas.filter(vigente).length, valor: SA.d.pautas.filter(vigente).reduce((a, p) => a + (+p.valor || 0), 0) }, semana: [], top: ts.slice(0, 5).map(t => ({ id: t.id, nombre: t.n, pedidos: S().orders.filter(o => o.t === t.id).length, ventas: 0 })) };
  }
  async function pintarSA(recargar) {
    const app = document.getElementById('app'); if (!app || (location.hash || '').slice(1) !== 'super') return;
    if (recargar !== false && esSuper()) { if (!SA.d.res && API().disponible) app.innerHTML = '<div class="sv2-sa"><p class="muted" style="padding:40px">Cargando…</p></div>'; await cargarSA(); }
    app.innerHTML = vSuper(); LM.paint(app);
  }
  const TABS = [['resumen', 'chart', 'Resumen'], ['solicitudes', 'users', 'Solicitudes'], ['negocios', 'tienda', 'Negocios'], ['clientes', 'user', 'Clientes'], ['pautas', 'megafono', 'Pautas']];
  function vSuper() {
    if (API().disponible === null) return '<div class="wrap"><p class="muted">Cargando…</p></div>';
    if (!esSuper()) return vEntrarSA();
    const pend = (SA.d.res && SA.d.res.solicitudes) || 0;
    const cuerpo = { resumen: vResumen, solicitudes: vSolicitudes, negocios: vNegocios, clientes: vClientes, pautas: vPautas }[SA.tab]();
    return '<div class="sv2-sa"><aside class="sv2-sa-lado" aria-label="Menú del superadministrador"><div class="sv2-sa-marca"><span>' + ic('escudo') + '</span><div><b>Mi Tienda</b><small>Superadministrador</small></div></div><nav>' +
      TABS.map(t => '<button type="button" class="' + (SA.tab === t[0] ? 'on' : '') + '" data-act="sv2-sa-tab" data-t="' + t[0] + '"' + (SA.tab === t[0] ? ' aria-current="page"' : '') + '>' + ic(t[1]) + '<span>' + t[2] + '</span>' + (t[0] === 'solicitudes' && pend ? '<em class="num">' + pend + '</em>' : '') + '</button>').join('') +
      '<button type="button" data-act="go" data-h="admin">' + ic('moto') + '<span>Domiciliarios y tarifas</span></button><button type="button" data-act="go" data-h="inicio">' + ic('eye') + '<span>Ver la app</span></button><button type="button" data-act="sv2-sa-salir">' + ic('power') + '<span>Salir</span></button></nav></aside>' +
      '<main class="sv2-sa-main">' + (SA.local ? '<div class="sv-alerta amar">' + ic('info') + '<span><b>Sin servidor:</b> estos son datos de ejemplo de este aparato. Con el servidor publicado, aquí ves la plataforma completa.</span></div>' : '') + (SA.err ? '<div class="sv-alerta rojo">' + ic('info') + '<span>' + esc(SA.err) + '</span></div>' : '') + cuerpo + '</main></div>';
  }
  function vEntrarSA() {
    return '<div class="wrap sv2-sa-in"><form class="sv-box sv2-form" data-form="sv2-sa-entrar"><div class="sv2-sa-marca osc"><span>' + ic('escudo') + '</span><div><b>Mi Tienda</b><small>Superadministrador</small></div></div><h1>Entrar</h1>' +
      (API().disponible && API().yo ? '<div class="sv-alerta amar">' + ic('info') + '<span>Tu cuenta (' + esc(API().yo.nombre) + ') no es de superadministrador.</span></div>' : '') +
      '<div class="campo"><label for="saU">Usuario</label><input id="saU" name="u" required autocomplete="username"></div><div class="campo"><label for="saP">Clave</label><input id="saP" name="p" type="password" required autocomplete="current-password"></div>' +
      (SA.err ? '<p class="sv2-err" role="alert">' + esc(SA.err) + '</p>' : '') + '<button class="sv-btn teal xl" type="submit">' + ic('escudo') + 'Entrar</button>' +
      '<p class="muted">Prueba: <b>superadmin</b> / 1234 (solo en el servidor de pruebas o sin servidor). En el servidor real, el usuario y la clave se crean con las variables <code>SUPERADMIN_USUARIO</code> y <code>SUPERADMIN_CLAVE</code>.</p></form></div>';
  }
  F['sv2-sa-entrar'] = async (f, d) => {
    SA.err = ''; const u = String(d.get('u')).trim().toLowerCase(), p = String(d.get('p'));
    if (!API().disponible) { if (u === 'superadmin' && p === '1234') lsSet('sv2-super', '1'); else SA.err = 'Usuario o clave incorrectos.'; }
    else { try { await API().entrar(u, p); if (!API().tieneRol('admin')) SA.err = 'Esa cuenta no es de superadministrador.'; } catch (e) { SA.err = e.message; } }
    pintarSA();
  };
  A['sv2-sa-salir'] = async () => { lsSet('sv2-super', ''); if (API().disponible && API().yo) { try { await API().salir(); } catch (e) {} } SA.d = {}; pintarSA(false); };
  A['sv2-sa-tab'] = el => { SA.tab = el.dataset.t; pintarSA(); scrollTo(0, 0); };
  const kpi = (i, t, v, s, cls, act) => '<' + (act ? 'button type="button" data-act="sv2-sa-tab" data-t="' + act + '"' : 'div') + ' class="sv2-kpi ' + (cls || '') + '"><small>' + ic(i) + esc(t) + '</small><b class="num">' + v + '</b><span>' + s + '</span></' + (act ? 'button' : 'div') + '>';
  function vResumen() {
    const r = SA.d.res; if (!r) return '<p class="muted">Cargando…</p>';
    const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    const atencion = [[r.solicitudes, 'negocio' + (r.solicitudes === 1 ? '' : 's') + ' esperando aprobación', 'solicitudes', 'Revisar'], [r.repartidores, 'domiciliario' + (r.repartidores === 1 ? '' : 's') + ' esperando aprobación', 'admin', 'Revisar'], [r.pqr, 'PQR sin responder en los negocios', null, ''], [Math.max(0, 3 - r.pautas.n), 'espacios de pauta libres hoy (mínimo 3, máximo 5)', 'pautas', 'Vender pauta']].filter(a => a[0] > 0);
    const sem = r.semana || [], mx = Math.max(1, ...sem.map(s => s.n));
    return '<header class="sv2-sa-h"><div><h1>Hola, superadministrador</h1><p>' + esc(fecha.charAt(0).toUpperCase() + fecha.slice(1)) + ' · así va la plataforma</p></div></header>' +
      '<div class="sv2-kpis">' + kpi('tienda', 'Negocios activos', r.negocios.activos, r.negocios.total + ' en total · ' + r.negocios.nuevos30 + ' nuevos este mes', 'teal', 'negocios') + kpi('users', 'Clientes', r.clientes.total, '+' + r.clientes.nuevos7 + ' en 7 días · +' + r.clientes.hoy + ' hoy', '', 'clientes') +
      kpi('receipt', 'Pedidos de hoy', r.hoy.pedidos, pesos(+r.hoy.ventas) + ' vendidos por la app') + kpi('megafono', 'Pautas activas', r.pautas.n + ' de 5', pesos(+r.pautas.valor) + ' vendidos', 'lima', 'pautas') + '</div>' +
      '<div class="sv2-sa-2"><section class="sv-box"><h2>Lo que necesita tu atención</h2>' + (atencion.length ? '<ul class="sv2-aten">' + atencion.map(a => '<li><b class="num">' + a[0] + '</b><span>' + a[1] + '</span>' + (a[2] ? '<button class="sv-btn borde chico" type="button" data-act="' + (a[2] === 'admin' ? 'go" data-h="admin' : 'sv2-sa-tab" data-t="' + a[2]) + '">' + a[3] + '</button>' : '') + '</li>').join('') + '</ul>' : '<p class="muted">Todo al día. ' + ic('check') + '</p>') + '</section>' +
      '<section class="sv-box"><h2>Personas nuevas · 7 días</h2>' + (sem.length ? '<div class="sv2-barras" role="img" aria-label="Registros por día">' + sem.map(s => '<span><i style="height:' + Math.round(s.n / mx * 100) + '%"></i><b class="num">' + s.n + '</b><small>' + new Date(s.dia + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '') + '</small></span>').join('') + '</div>' : '<p class="muted">Sin registros nuevos en la semana.</p>') + '</section></div>' +
      '<section class="sv-box"><h2>Negocios con más pedidos · 30 días</h2><table class="sv2-tabla"><thead><tr><th>Negocio</th><th class="num">Pedidos</th><th class="num">Ventas</th></tr></thead><tbody>' + (r.top || []).map(n => '<tr><td><button class="link" type="button" data-act="go" data-h="t-' + esc(n.id) + '">' + esc(n.nombre) + '</button></td><td class="num">' + n.pedidos + '</td><td class="num">' + pesos(+n.ventas) + '</td></tr>').join('') + '</tbody></table></section>';
  }
  const CAT_N = Object.fromEntries(CATS_REG);
  function vSolicitudes() {
    const ls = SA.d.sol || [];
    return '<header class="sv2-sa-h"><div><h1>Solicitudes de negocios</h1><p>Los negocios que llenaron "Registra tu negocio". Llama o escribe antes de aprobar.</p></div></header>' +
      '<div class="sv2-seg izq">' + [['pendiente', 'Por revisar'], ['aprobada', 'Aprobadas'], ['rechazada', 'Rechazadas']].map(e => '<button type="button" class="' + (SA.estado === e[0] ? 'on' : '') + '" data-act="sv2-sa-est" data-e="' + e[0] + '" aria-pressed="' + (SA.estado === e[0]) + '">' + e[1] + '</button>').join('') + '</div>' +
      (ls.length ? '<div class="sv2-sol-l">' + ls.map(s => '<article class="sv-box sv2-sol"><header><div><h3>' + esc(s.nombre) + '</h3><small>' + esc(CAT_N[s.categoria] || s.categoria) + ' · ' + esc(s.municipio) + (s.direccion ? ' · ' + esc(s.direccion) : '') + '</small></div><small>' + new Date(s.creado).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) + '</small></header>' +
        '<dl class="sv2-dl"><dt>Dueño</dt><dd>' + esc(s.dueno_nombre) + '</dd><dt>Celular</dt><dd class="num">' + esc(s.telefono) + '</dd>' + (s.correo ? '<dt>Correo</dt><dd>' + esc(s.correo) + '</dd>' : '') + (s.mensaje ? '<dt>Vende</dt><dd>' + esc(s.mensaje) + '</dd>' : '') + (s.motivo ? '<dt>Motivo</dt><dd>' + esc(s.motivo) + '</dd>' : '') + (s.negocio_id ? '<dt>Negocio</dt><dd><code>' + esc(s.negocio_id) + '</code></dd>' : '') + '</dl>' +
        '<div class="sv2-sol-b"><a class="sv-btn borde chico" href="https://wa.me/57' + esc(s.telefono) + '?text=' + encodeURIComponent('Hola, ' + s.dueno_nombre + '. Te escribimos de Mi Tienda por la solicitud de ' + s.nombre + '.') + '" target="_blank" rel="noopener">' + ic('wa') + 'WhatsApp</a>' +
        (s.estado === 'pendiente' ? '<button class="sv-btn gris chico" type="button" data-act="sv2-sa-rech" data-id="' + s.id + '" data-n="' + esc(s.nombre) + '">Rechazar</button><button class="sv-btn teal" type="button" data-act="sv2-sa-aprob" data-id="' + s.id + '">' + ic('check') + 'Aprobar</button>' : '') + '</div></article>').join('') + '</div>' : '<p class="muted sv2-vacio">No hay solicitudes aquí.</p>');
  }
  A['sv2-sa-est'] = el => { SA.estado = el.dataset.e; pintarSA(); };
  A['sv2-sa-aprob'] = el => {
    const s = (SA.d.sol || []).find(z => String(z.id) === el.dataset.id); if (!s) return;
    const id = String(s.nombre).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(s.nombre) + '</small><h3>Aprobar el negocio</h3></div>' + x() + '</div><form class="sh-b stack" data-form="sv2-sa-aprob" data-id="' + s.id + '"><p>Se crea el negocio y la cuenta del dueño con su celular <b class="num">' + esc(s.telefono) + '</b>. Si ya tiene cuenta, solo se le suma el negocio.</p>' +
      '<div class="campo"><label for="saId">Código del negocio (sin espacios)</label><input id="saId" name="id" value="' + esc(id) + '" pattern="[a-z0-9-]{3,30}" required></div><button class="sv-btn teal xl" type="submit">' + ic('check') + 'Aprobar y crear la cuenta</button></form>');
  };
  F['sv2-sa-aprob'] = async (f, d) => {
    const id = f.dataset.id;
    try {
      let r;
      if (SA.local) { const s = solicitudesLocales().find(z => String(z.id) === id); s.estado = 'aprobada'; s.negocio_id = String(d.get('id')); LM.save(); r = { negocio: s.negocio_id, usuario: s.negocio_id, telefono: s.telefono, clave_temporal: '(sin servidor no se crea la cuenta)' }; }
      else r = await API().post('/api/super/solicitudes/' + id + '/aprobar', { id: String(d.get('id')) });
      const msg = 'Bienvenido a Mi Tienda. Tu negocio ya está activo. Entra en ' + location.origin + location.pathname + '#panel con el usuario ' + r.usuario + (r.clave_temporal ? ' y la clave ' + r.clave_temporal + ' (cámbiala al entrar)' : ' y tu clave de siempre') + '.';
      sheet('<div class="sh-h"><div class="tt"><small>Aprobado</small><h3>Negocio creado</h3></div>' + x() + '</div><div class="sh-b stack"><div class="sv2-ok">' + ic('check') + '<div><b>' + esc(r.negocio) + '</b><p>Usuario <b>' + esc(r.usuario) + '</b>' + (r.clave_temporal ? ' · clave temporal <b class="num">' + esc(r.clave_temporal) + '</b>' : ' (ya tenía cuenta)') + '</p></div></div>' +
        (r.clave_temporal ? '<p class="sv2-nota">' + ic('info') + 'Esta clave solo se muestra ahora. Envíasela al dueño y pídele que la cambie al entrar.</p>' : '') +
        '<a class="sv-btn teal xl" href="https://wa.me/57' + esc(r.telefono) + '?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener">' + ic('wa') + 'Enviar los datos por WhatsApp</a></div>');
      SA.d.res = null; await cargarSA(); const app = document.getElementById('app'); app.innerHTML = vSuper(); LM.paint(app);
    } catch (e) { toast(e.message); }
  };
  A['sv2-sa-rech'] = el => sheet('<div class="sh-h"><div class="tt"><small>' + esc(el.dataset.n) + '</small><h3>Motivo del rechazo</h3></div>' + x() + '</div><form class="sh-b stack" data-form="sv2-sa-rech" data-id="' + el.dataset.id + '"><div class="campo"><label for="saM">¿Qué debe corregir o por qué no se aprueba?</label><textarea id="saM" name="m" rows="3" required minlength="5"></textarea></div><button class="sv-btn teal xl" type="submit">Rechazar</button></form>');
  F['sv2-sa-rech'] = async (f, d) => {
    try { if (SA.local) { const s = solicitudesLocales().find(z => String(z.id) === f.dataset.id); s.estado = 'rechazada'; s.motivo = String(d.get('m')); LM.save(); } else await API().post('/api/super/solicitudes/' + f.dataset.id + '/rechazar', { motivo: String(d.get('m')) }); closeModal(); toast('Solicitud rechazada.'); pintarSA(); } catch (e) { toast(e.message); }
  };
  function vNegocios() {
    const q = SA.q.toLowerCase(), ls = (SA.d.neg || []).filter(n => !q || (n.nombre + ' ' + (n.dueno || '') + ' ' + n.id).toLowerCase().includes(q));
    return '<header class="sv2-sa-h"><div><h1>Negocios</h1><p>' + (SA.d.neg || []).length + ' en la plataforma. Un negocio suspendido no sale en la app.</p></div><label class="sv2-sa-bus">' + ic('search') + '<span class="sr">Buscar negocio</span><input type="search" data-inp="sv2-sa-q" value="' + esc(SA.q) + '" placeholder="Buscar por nombre o dueño"></label></header>' +
      '<div class="sv2-tabla-w"><table class="sv2-tabla"><thead><tr><th>Negocio</th><th>Dueño</th><th>Municipio</th><th class="num">Pedidos 30 d</th><th>Estado</th><th><span class="sr">Acciones</span></th></tr></thead><tbody>' +
      ls.map(n => '<tr><td><b>' + esc(n.nombre) + '</b><small>' + esc(CAT_N[n.categoria] || n.categoria) + '</small></td><td>' + esc(n.dueno || '—') + '<small class="num">' + esc(n.telefono || '') + '</small></td><td>' + esc(n.municipio || '') + '</td><td class="num">' + (n.pedidos30 || 0) + '</td><td>' + (n.estado === 'activo' ? '<span class="sv-pill verde">Activo</span>' : '<span class="sv-pill rojo">Suspendido</span>') + '</td>' +
        '<td class="sv2-acc"><button class="sv-btn borde chico" type="button" data-act="go" data-h="t-' + esc(n.id) + '">Ver</button><button class="sv-btn gris chico" type="button" data-act="sv2-sa-susp" data-id="' + esc(n.id) + '" data-e="' + (n.estado === 'activo' ? 'suspendido' : 'activo') + '">' + (n.estado === 'activo' ? 'Suspender' : 'Activar') + '</button></td></tr>').join('') + '</tbody></table></div>';
  }
  A['sv2-sa-susp'] = async el => {
    try { if (SA.local) { const g = g2(); g.suspendidos = (g.suspendidos || []).filter(z => z !== el.dataset.id); if (el.dataset.e === 'suspendido') g.suspendidos.push(el.dataset.id); LM.save(); } else await API().post('/api/super/negocios/' + el.dataset.id + '/estado', { estado: el.dataset.e }); toast(el.dataset.e === 'suspendido' ? 'Negocio suspendido.' : 'Negocio activo otra vez.'); pintarSA(); } catch (e) { toast(e.message); }
  };
  let tq = 0;
  document.addEventListener('input', e => { const el = e.target; if (el && el.dataset && el.dataset.inp === 'sv2-sa-q') { SA.q = el.value; clearTimeout(tq); tq = setTimeout(async () => { if (SA.tab === 'clientes' && !SA.local) await cargarSA(); const app = document.getElementById('app'); app.innerHTML = vSuper(); LM.paint(app); const i = app.querySelector('[data-inp="sv2-sa-q"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); } });
  function vClientes() {
    const q = SA.q.toLowerCase(), ls = (SA.d.cli || []).filter(c => !SA.local || !q || (c.nombre + c.telefono).toLowerCase().includes(q));
    return '<header class="sv2-sa-h"><div><h1>Personas registradas</h1><p>Clientes, dueños, equipos y domiciliarios. Los más nuevos primero.</p></div><label class="sv2-sa-bus">' + ic('search') + '<span class="sr">Buscar persona</span><input type="search" data-inp="sv2-sa-q" value="' + esc(SA.q) + '" placeholder="Nombre, celular o usuario"></label></header>' +
      '<div class="sv2-tabla-w"><table class="sv2-tabla"><thead><tr><th>Nombre</th><th>Celular</th><th>Roles</th><th class="num">Pedidos</th><th>Desde</th></tr></thead><tbody>' +
      ls.map(c => '<tr><td><b>' + esc(c.nombre) + '</b>' + (c.usuario ? '<small>@' + esc(c.usuario) + '</small>' : '') + '</td><td class="num">' + esc(c.telefono) + '</td><td>' + (c.roles || []).map(r => '<span class="sv-pill">' + esc({ admin: 'Superadmin', negocio: 'Negocio', cliente: 'Cliente', repartidor: 'Domiciliario', equipo: 'Equipo' }[r] || r) + '</span>').join(' ') + '</td><td class="num">' + (c.pedidos || 0) + '</td><td>' + new Date(c.creado).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) + '</td></tr>').join('') + '</tbody></table></div>';
  }
  function estadoPauta(p) { const h = hoyISO(); return p.estado === 'pausada' ? ['Pausada', 'gris'] : p.fin < h ? ['Terminó', 'gris'] : p.inicio > h ? ['Programada', 'amar'] : ['Al aire', 'verde']; }
  function vPautas() {
    const ls = SA.d.pautas || [], hoy = ls.filter(vigente), negs = SA.d.negs || SA.d.neg || [];
    const ed = SA.editar;
    return '<header class="sv2-sa-h"><div><h1>Pautas del inicio</h1><p>Los negocios que pagan salen de primeros en la franja de arriba, con la etiqueta <b>Patrocinado</b>. Mínimo 3 y máximo 5 al mismo tiempo; si hay menos de 3, la app completa con anuncios propios.</p></div><button class="sv-btn teal" type="button" data-act="sv2-sa-pnueva">' + ic('plus') + 'Nueva pauta</button></header>' +
      '<div class="sv2-cupos" aria-label="Cupos de hoy">' + [0, 1, 2, 3, 4].map(i => '<span class="' + (i < hoy.length ? 'lleno' : '') + '">' + (hoy[i] ? esc((hoy[i].negocio_nombre || hoy[i].titulo).slice(0, 18)) : 'Libre') + '</span>').join('') + '<b>' + hoy.length + ' de 5 al aire hoy</b></div>' +
      (ed ? formPauta(ed, negs) : '') +
      '<div class="sv2-tabla-w"><table class="sv2-tabla"><thead><tr><th>Pauta</th><th>Negocio</th><th>Fechas</th><th class="num">Valor</th><th>Estado</th><th><span class="sr">Acciones</span></th></tr></thead><tbody>' +
      ls.map(p => { const e = estadoPauta(p); return '<tr><td><span class="sv2-mini"><img src="' + esc(p.imagen || '') + '" alt=""><b>' + esc(p.titulo) + '</b></span></td><td>' + esc(p.negocio_nombre || '') + '</td><td>' + fechaC(p.inicio) + ' – ' + fechaC(p.fin) + '</td><td class="num">' + pesos(+p.valor || 0) + '</td><td><span class="sv-pill ' + e[1] + '">' + e[0] + '</span></td><td class="sv2-acc"><button class="sv-btn borde chico" type="button" data-act="sv2-sa-ped" data-id="' + esc(p.id) + '">Editar</button><button class="sv-btn gris chico" type="button" data-act="sv2-sa-pbor" data-id="' + esc(p.id) + '">Borrar</button></td></tr>'; }).join('') + '</tbody></table></div>' +
      '<p class="sv2-nota">' + ic('info') + 'En Colombia no hay una tarifa oficial para pautas: el valor lo acuerdas con cada negocio. Lo obligatorio es que se vea que es publicidad (por eso la etiqueta "Patrocinado") y que lo que promete sea cierto. Pide a tu contador cómo facturarlo.</p>';
  }
  const GALERIA = ['f-hamburguesa', 'f-tenis', 'f-gallinas', 'f-fresas', 'f-helado', 'f-jugo', 'f-vestido', 'f-perro', 'f-canoa', 'f-cafe-grano', 'f-tienda-ropa', 'f-puesto-comida', 'f-fogon', 'f-cultivo'];
  function formPauta(p, negs) {
    return '<form class="sv-box sv2-form sv2-pauta-f" data-form="sv2-sa-pguardar" data-id="' + esc(p.id || '') + '"><h2>' + (p.id ? 'Editar pauta' : 'Nueva pauta') + '</h2><div class="sv2-2"><div class="campo"><label for="ptN">Negocio que paga</label><select id="ptN" name="negocio" required>' + negs.map(n => '<option value="' + esc(n.id) + '"' + (p.negocio === n.id ? ' selected' : '') + '>' + esc(n.nombre) + '</option>').join('') + '</select></div>' +
      '<div class="campo"><label for="ptB">Texto del botón</label><input id="ptB" name="boton" maxlength="24" value="' + esc(p.boton || 'Ver más') + '"></div></div>' +
      '<div class="campo"><label for="ptT">Título (lo que se lee grande)</label><input id="ptT" name="titulo" required maxlength="70" value="' + esc(p.titulo || '') + '"></div><div class="campo"><label for="ptX">Texto corto</label><input id="ptX" name="texto" maxlength="140" value="' + esc(p.texto || '') + '"></div>' +
      '<fieldset class="sv2-fs"><legend>Foto</legend><div class="sv2-gal">' + GALERIA.map(g => { const u = 'galeria/' + g + '.jpg'; return '<label><input type="radio" name="imagen_url" value="' + u + '"' + (p.imagen === u ? ' checked' : '') + '><img src="' + u + '" alt="' + g.slice(2) + '" loading="lazy"></label>'; }).join('') + '</div>' +
      (SA.local ? '' : '<div class="campo"><label for="ptF">O sube la foto del negocio (horizontal)</label><input id="ptF" type="file" accept="image/*" data-chg="sv2-sa-pfoto"></div>') + '</fieldset>' +
      '<div class="sv2-3"><div class="campo"><label for="ptI">Desde</label><input id="ptI" name="inicio" type="date" required value="' + esc(p.inicio || hoyISO()) + '"></div><div class="campo"><label for="ptH">Hasta</label><input id="ptH" name="fin" type="date" required value="' + esc(p.fin || hoyISO(6)) + '"></div><div class="campo"><label for="ptV">Valor que pagó ($)</label><input id="ptV" name="valor" type="number" min="0" step="1000" value="' + esc(p.valor || 0) + '"></div></div>' +
      '<div class="sv2-chips">' + [7, 15, 30].map(n => '<button type="button" data-act="sv2-sa-pdias" data-n="' + n + '">' + n + ' días</button>').join('') + '</div>' +
      '<label class="sv2-chk"><input type="checkbox" name="pausada"' + (p.estado === 'pausada' ? ' checked' : '') + '> Pausada (no sale en la app)</label>' +
      '<div class="sv2-pie2"><button class="sv-btn gris" type="button" data-act="sv2-sa-pcancel">Cancelar</button><button class="sv-btn teal xl" type="submit">Guardar pauta</button></div></form>';
  }
  A['sv2-sa-pnueva'] = () => { SA.editar = { boton: 'Ver más', imagen: 'galeria/f-hamburguesa.jpg' }; SA.foto = null; pintarSA(false); };
  A['sv2-sa-ped'] = el => { SA.editar = Object.assign({}, (SA.d.pautas || []).find(p => String(p.id) === el.dataset.id)); SA.foto = null; pintarSA(false); };
  A['sv2-sa-pcancel'] = () => { SA.editar = null; pintarSA(false); };
  A['sv2-sa-pdias'] = el => { const i = document.getElementById('ptI'), h = document.getElementById('ptH'); const d = new Date((i.value || hoyISO()) + 'T12:00:00'); d.setDate(d.getDate() + +el.dataset.n - 1); h.value = d.toISOString().slice(0, 10); };
  A['sv2-sa-pfoto'] = el => { const f = el.files && el.files[0]; if (f) achicar(f, 1400, 0.8).then(d => { SA.foto = d; toast('Foto lista. Se sube al guardar.'); }); };
  F['sv2-sa-pguardar'] = async (f, d) => {
    const id = f.dataset.id, b = { negocio: d.get('negocio'), titulo: d.get('titulo'), texto: d.get('texto'), boton: d.get('boton'), imagen_url: d.get('imagen_url') || null, inicio: d.get('inicio'), fin: d.get('fin'), valor: +d.get('valor') || 0, estado: d.get('pausada') ? 'pausada' : 'activa', enlace: 't-' + d.get('negocio') };
    if (b.fin < b.inicio) { toast('La fecha final debe ser igual o después de la inicial.'); return; }
    try {
      if (SA.local) {
        const ls = pautasLocales(), choca = dia => ls.filter(p => p.id !== id && p.estado === 'activa' && p.inicio <= dia && p.fin >= dia).length;
        if (b.estado === 'activa') { for (let dd = new Date(b.inicio + 'T12:00:00'); dd.toISOString().slice(0, 10) <= b.fin; dd.setDate(dd.getDate() + 1)) if (choca(dd.toISOString().slice(0, 10)) >= 5) { toast('En esas fechas ya hay 5 pautas activas (el máximo).'); return; } }
        const nueva = Object.assign({}, b, { imagen: b.imagen_url || 'galeria/f-hamburguesa.jpg' });
        if (id) Object.assign(ls.find(p => p.id === id), nueva); else ls.push(Object.assign({ id: 'p' + Date.now() }, nueva));
        LM.save();
      } else {
        if (SA.foto) b.imagen = SA.foto;
        if (id) await API().put('/api/super/pautas/' + id, b); else await API().post('/api/super/pautas', b);
        PA.t = 0;
      }
      SA.editar = null; SA.foto = null; toast('Pauta guardada.'); pintarSA();
    } catch (e) { toast(e.message); }
  };
  A['sv2-sa-pbor'] = async el => {
    if (!confirmarBorrar(el)) return;
    try { if (SA.local) { const g = g2(); g.pautas = pautasLocales().filter(p => String(p.id) !== el.dataset.id); LM.save(); } else { await API().post('/api/super/pautas/' + el.dataset.id + '/borrar'); PA.t = 0; } toast('Pauta borrada.'); pintarSA(); } catch (e) { toast(e.message); }
  };
  // Borrar pide un segundo toque (sin ventanas del navegador)
  function confirmarBorrar(el) { if (el.dataset.seguro) return true; el.dataset.seguro = 1; el.textContent = '¿Seguro? Toca otra vez'; setTimeout(() => { if (el.isConnected) { delete el.dataset.seguro; el.textContent = 'Borrar'; } }, 3500); return false; }
  if (LM.api && LM.api.on) LM.api.on('yo', () => { if ((location.hash || '').slice(1) === 'super') pintarSA(); });

  /* ======================================================================================
     7. CUENTA DEL CLIENTE: foto de perfil y "Mis partidas"
     ====================================================================================== */
  function tarjetaCuenta() {
    const s = ses(); if (!s || s.rol !== 'cliente') return '';
    const foto = (API().yo && API().yo.foto) || S().user.foto || '';
    return '<section class="wrap sv2-cta-c" id="sv2Cuenta"><div class="sv-box sv2-perfil"><label class="sv2-perfil-f" for="sv2PF">' + (foto ? '<img src="' + esc(foto) + '" alt="Tu foto">' : '<span>' + ic('camera') + '</span>') + '<small>' + (foto ? 'Cambiar foto' : 'Poner foto') + '</small></label><input id="sv2PF" class="sr" type="file" accept="image/*" data-chg="sv2-perfil-f">' +
      '<div><b>Tu foto de perfil</b><small>Sale en la pantalla del billar cuando juegas y en tus pedidos.</small></div></div>' +
      '<button type="button" class="sv-box sv2-mp-cta" data-act="go" data-h="mis-partidas">' + ic('trophy') + '<span><b>Mis partidas en el billar</b><small>Ganadas, perdidas y lo que debes en la mesa.</small></span>' + ic('chevr') + '</button></section>';
  }
  A['sv2-perfil-f'] = el => {
    const f = el.files && el.files[0]; if (!f) return;
    achicar(f, 480, 0.85).then(async d => {
      try {
        if (API().disponible && API().yo) { const r = await API().post('/api/yo/foto', { foto: d }); API().yo.foto = r.foto; }
        S().user.foto = d; LM.save(); toast('Foto guardada.'); LM.rerender();
      } catch (e) { toast(e.message); }
    }).catch(() => toast('No pudimos leer esa foto.'));
  };

  /* ======================================================================================
     RUTAS Y MONTAJE
     ====================================================================================== */
  const _ruta = E.ruta;
  E.ruta = r => {
    const app = document.getElementById('app');
    if (r === 'registra-negocio') { REG.err = ''; if (REG.ok && REG.visto) REG.ok = null; REG.visto = !!REG.ok; app.innerHTML = vRegistro(); return true; }
    if (r === 'super') { document.body.classList.add('sv2-en-super'); app.innerHTML = vSuper(); setTimeout(() => pintarSA(), 0); return true; }
    document.body.classList.remove('sv2-en-super');
    return _ruta(r);
  };
  const _tras = E.trasRender;
  E.trasRender = r => {
    try { _tras(r); } catch (e) {}
    montarBuscador(); montarRieles(); montarTono();
    if (document.querySelector('.sv2-sl')) montarBanda();
    if (/^cuenta/.test(r || (location.hash || '').slice(1)) && !document.getElementById('sv2Cuenta')) { const app = document.getElementById('app'), h = tarjetaCuenta(); if (app && h) app.insertAdjacentHTML('afterbegin', h), LM.paint(app.querySelector('#sv2Cuenta')); }
  };
  montarBuscador();
})();
/* Los <input type=file> y <select> con data-chg="sv2-…" llaman a su acción */
document.addEventListener('change', e => { const el = e.target, k = el && el.dataset && el.dataset.chg; if (k && /^sv2-/.test(k) && window.LM.A[k]) window.LM.A[k](el, e); });
