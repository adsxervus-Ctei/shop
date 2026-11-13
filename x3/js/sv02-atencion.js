/* Mi Tienda · Servus 0.2 · ATENCIÓN EN EL NEGOCIO
   1. Billar: partidas con jugadores y apuestas (el que pierde suma la apuesta), QR para que el jugador guarde
      sus partidas en su perfil, pantalla de cada mesa (TV, tablet o celular) y "Mis partidas" del cliente.
   2. Restaurantes y asaderos: pedido paso a paso por categorías (mesera y cliente ven el mismo menú del dueño),
      resumen tipo factura, forma de pago con cálculo de vueltas, ticket con QR y aprobación del administrador
      (enviar a cocina o cancelar). */
(function () {
  'use strict';
  const LM = window.LM, A = LM.A, F = LM.F, SV = LM.sv, E = LM.EXT;
  const { esc, pesos, toast, sheet, closeModal } = LM;
  const I = (n, c) => SV.ic(n, c);
  const S = () => LM.S;
  const ses = () => LM.S.session;
  const API = () => LM.api || { disponible: false };
  const AT = () => SV.at;
  const codigo6 = () => String(Math.floor(100000 + Math.random() * 900000));
  const urlBase = () => location.origin + location.pathname.replace(/index\.html$/, '');
  const qr = (txt, px) => LM.qrSVG ? LM.qrSVG(txt, px) : '';
  const iniciales = n => esc(String(n || '?').trim().split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase());
  const avatar = (n, foto, cls) => foto ? '<img class="sv2-av ' + (cls || '') + '" src="' + esc(foto) + '" alt="">' : '<span class="sv2-av ' + (cls || '') + '" aria-hidden="true">' + iniciales(n) + '</span>';
  // Si la app todavía no sabe si hay servidor, espera y vuelve a pintar (antes un QR abierto de una vez decía "no encontrado")
  const esperarApi = () => { if (API().disponible !== null && API().disponible !== undefined) return false; Promise.resolve(API().listo).then(() => LM.rerender()); return true; };
  const x = () => '<button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + I('x') + '</button>';

  /* ======================================================================================
     1. BILLAR · partidas y apuestas
     ====================================================================================== */
  const JUEGOS = [['Bola 8', ['#F4C21B', '#111']], ['Bola 9', ['#F4C21B', '#C2272D']], ['Carambola', ['#fff', '#F4C21B', '#C2272D']], ['Tres bandas', ['#fff', '#C2272D']], ['Chicago', ['#2456C9', '#E36A1B', '#111']], ['Libre', ['#fff']]];
  const MODOS = [['1v1', '1 vs 1'], ['2v2', '2 vs 2'], ['todos', 'Todos contra todos']];
  const APUESTAS = [['cerveza', 'Cerveza'], ['gaseosa', 'Gaseosa'], ['tiempo', 'El tiempo de la mesa'], ['nada', 'Sin apuesta']];
  const BEBIDAS = { cerveza: [['Águila', 4000], ['Club Colombia', 5000], ['Costeñita', 3500], ['Cerveza nacional', 4000]], gaseosa: [['Gaseosa 400 ml', 2500], ['Agua', 2000]] };
  const bolas = cols => '<svg width="54" height="24" viewBox="0 0 54 24" aria-hidden="true">' + cols.map((c, i) => '<circle cx="' + (12 + i * 14) + '" cy="12" r="9.5" fill="' + c + '" stroke="#15191E" stroke-opacity=".2"/>' + (c === '#111' ? '<circle cx="' + (12 + i * 14) + '" cy="12" r="4" fill="#fff"/>' : '')).join('') + '</svg>';
  const WZ = { paso: 1, juego: 'Bola 8', modo: '1v1', jug: ['', ''], apuesta: 'cerveza', beb: 'Águila', p: 4000, q: 1 };

  function wzBillar() {
    const m = AT().selMesa(), paso = WZ.paso;
    const barra = '<div class="sv2-pasos-barra" aria-hidden="true">' + [1, 2, 3].map(i => '<i class="' + (i <= paso ? 'on' : '') + '"></i>').join('') + '</div><small class="sv2-paso-n">Paso ' + paso + ' de 3</small>';
    let cuerpo = '', pie = '';
    if (paso === 1) {
      cuerpo = '<h4 class="sv2-h4">¿Qué van a jugar?</h4><div class="sv2-ops tres">' + JUEGOS.map(j => '<button type="button" class="sv2-op' + (WZ.juego === j[0] ? ' on' : '') + '" data-act="sv2-bz" data-k="juego" data-v="' + j[0] + '" aria-pressed="' + (WZ.juego === j[0]) + '">' + bolas(j[1]) + '<span>' + j[0] + '</span></button>').join('') + '</div>' +
        '<h4 class="sv2-h4">¿Cómo juegan?</h4><div class="sv2-seg">' + MODOS.map(o => '<button type="button" class="' + (WZ.modo === o[0] ? 'on' : '') + '" data-act="sv2-bz" data-k="modo" data-v="' + o[0] + '" aria-pressed="' + (WZ.modo === o[0]) + '">' + o[1] + '</button>').join('') + '</div>';
      pie = '<button class="sv-btn teal xl" type="button" data-act="sv2-bpaso" data-d="1">Siguiente: jugadores</button>';
    } else if (paso === 2) {
      const n = WZ.modo === '2v2' ? 4 : WZ.jug.length;
      while (WZ.jug.length < n) WZ.jug.push('');
      cuerpo = '<h4 class="sv2-h4">¿Quiénes juegan?</h4><p class="muted sv2-p">Escribe el nombre o el apodo. Si tienen la app, al escanear el QR de la mesa sus partidas les quedan guardadas.</p><div class="sv2-jugs">' +
        WZ.jug.map((j, i) => '<div class="sv2-jug">' + (WZ.modo === '2v2' ? '<span class="sv2-eq ' + (i < 2 ? 'a' : 'b') + '">' + (i < 2 ? 'A' : 'B') + '</span>' : '<span class="sv2-eq">' + (i + 1) + '</span>') + '<label class="sr" for="svJ' + i + '">Jugador ' + (i + 1) + '</label><input id="svJ' + i + '" data-inp="sv2-jug" data-ix="' + i + '" value="' + esc(j) + '" placeholder="Nombre o apodo" maxlength="20" autocomplete="off">' +
          (WZ.modo !== '2v2' && WZ.jug.length > 2 ? '<button class="sv2-x" type="button" data-act="sv2-bquitar" data-ix="' + i + '" aria-label="Quitar jugador ' + (i + 1) + '">' + I('x') + '</button>' : '') + '</div>').join('') + '</div>' +
        (WZ.modo !== '2v2' && WZ.jug.length < 8 ? '<button class="sv-btn borde" type="button" data-act="sv2-bmas">' + I('plus') + 'Agregar jugador</button>' : '');
      pie = '<div class="sv2-pie2"><button class="sv-btn gris" type="button" data-act="sv2-bpaso" data-d="-1">Atrás</button><button class="sv-btn teal xl" type="button" data-act="sv2-bpaso" data-d="1">Siguiente: apuesta</button></div>';
    } else {
      cuerpo = '<h4 class="sv2-h4">¿Qué se juegan?</h4><div class="sv2-ops dos">' + APUESTAS.map(a => '<button type="button" class="sv2-op' + (WZ.apuesta === a[0] ? ' on' : '') + '" data-act="sv2-bz" data-k="apuesta" data-v="' + a[0] + '" aria-pressed="' + (WZ.apuesta === a[0]) + '"><span>' + a[1] + '</span></button>').join('') + '</div>' +
        (BEBIDAS[WZ.apuesta] ? '<h4 class="sv2-h4">¿Cuál?</h4><div class="sv2-lista">' + BEBIDAS[WZ.apuesta].map(b => '<button type="button" class="sv2-op fila' + (WZ.beb === b[0] ? ' on' : '') + '" data-act="sv2-bbeb" data-n="' + esc(b[0]) + '" data-p="' + b[1] + '" aria-pressed="' + (WZ.beb === b[0]) + '"><span>' + esc(b[0]) + '</span><b class="num">' + pesos(b[1]) + '</b></button>').join('') + '</div>' +
          '<h4 class="sv2-h4">Por cada partida</h4><div class="sv2-step"><button type="button" data-act="sv2-bq" data-d="-1" aria-label="Menos">−</button><span><b class="num">' + WZ.q + '</b><small>' + (WZ.q === 1 ? 'unidad' : 'unidades') + '</small></span><button type="button" class="mas" data-act="sv2-bq" data-d="1" aria-label="Más">+</button></div>' +
          '<p class="sv2-regla"><b>Regla:</b> el que pierde cada partida suma ' + WZ.q + ' ' + esc(WZ.beb) + ' (' + pesos(WZ.p * WZ.q) + ') a su cuenta.</p>' : '') +
        (WZ.apuesta === 'tiempo' ? '<p class="sv2-regla"><b>Regla:</b> al cerrar, el tiempo de la mesa lo pagan los que perdieron, según cuántas partidas perdió cada uno.</p>' : '');
      pie = '<div class="sv2-pie2"><button class="sv-btn gris" type="button" data-act="sv2-bpaso" data-d="-1">Atrás</button><button class="sv-btn teal xl" type="button" data-act="sv2-bcrear">Empezar a anotar</button></div>';
    }
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(m.n) + ' · ' + esc(m.tipo) + '</small><h3>Partidas y apuestas</h3></div>' + x() + '</div><div class="sh-b stack sv2-wz">' + barra + cuerpo + '</div><div class="sv2-sh-pie">' + pie + '</div>', 'sv2-sheet');
  }
  A['sv2-bini'] = () => { Object.assign(WZ, { paso: 1, juego: 'Bola 8', modo: '1v1', jug: ['', ''], apuesta: 'cerveza', beb: 'Águila', p: 4000, q: 1 }); wzBillar(); };
  A['sv2-bz'] = el => { WZ[el.dataset.k] = el.dataset.v; if (el.dataset.k === 'apuesta' && BEBIDAS[el.dataset.v]) { WZ.beb = BEBIDAS[el.dataset.v][0][0]; WZ.p = BEBIDAS[el.dataset.v][0][1]; } if (el.dataset.k === 'modo' && el.dataset.v !== '2v2') WZ.jug = WZ.jug.slice(0, Math.max(2, WZ.jug.filter(Boolean).length)); wzBillar(); };
  A['sv2-bbeb'] = el => { WZ.beb = el.dataset.n; WZ.p = +el.dataset.p; wzBillar(); };
  A['sv2-bq'] = el => { WZ.q = Math.max(1, Math.min(6, WZ.q + +el.dataset.d)); wzBillar(); };
  A['sv2-bmas'] = () => { WZ.jug.push(''); wzBillar(); setTimeout(() => { const i = document.getElementById('svJ' + (WZ.jug.length - 1)); if (i) i.focus(); }, 30); };
  A['sv2-bquitar'] = el => { WZ.jug.splice(+el.dataset.ix, 1); wzBillar(); };
  document.addEventListener('input', e => { const el = e.target; if (el && el.dataset && el.dataset.inp === 'sv2-jug') WZ.jug[+el.dataset.ix] = el.value; });
  A['sv2-bpaso'] = el => {
    const d = +el.dataset.d;
    if (d > 0 && WZ.paso === 2) {
      const ls = WZ.jug.map(s => s.trim());
      if (ls.filter(Boolean).length < (WZ.modo === '2v2' ? 4 : 2)) { toast(WZ.modo === '2v2' ? 'Escribe los 4 jugadores.' : 'Escribe por lo menos 2 jugadores.'); return; }
      if (new Set(ls.filter(Boolean).map(s => s.toLowerCase())).size !== ls.filter(Boolean).length) { toast('Hay dos jugadores con el mismo nombre. Ponles un apodo distinto.'); return; }
    }
    WZ.paso = Math.max(1, Math.min(3, WZ.paso + d)); wzBillar();
  };
  A['sv2-bcrear'] = () => {
    const m = AT().selMesa();
    const jug = WZ.jug.map(s => s.trim()).filter(Boolean).map((n, i) => ({ n, eq: WZ.modo === '2v2' ? (i < 2 ? 'A' : 'B') : null, ganadas: 0, perdidas: 0, debe: 0 }));
    m.partida = { juego: WZ.juego, modo: WZ.modo, jugadores: jug, apuesta: BEBIDAS[WZ.apuesta] ? { tipo: WZ.apuesta, n: WZ.beb, p: WZ.p, q: WZ.q } : WZ.apuesta === 'tiempo' ? { tipo: 'tiempo', n: 'el tiempo de la mesa', p: 0, q: 0 } : null, hist: [], codigo: codigo6(), ini: Date.now() };
    m.jug = jug.length;
    closeModal(); AT().guardar(AT().tienda()); LM.rerender(); toast('Listo. Ahora toca quién pierde cada partida.');
  };

  // Bloque de partidas dentro del detalle de la mesa (pantalla de atención del billar)
  SV.partidaH = m => {
    const pa = m.partida;
    if (!pa) return '<div class="sv2-part-vacia"><span>' + I('trophy') + '<span><b>¿Juegan con apuesta?</b><small>Anota quién pierde cada partida: la apuesta se suma sola a su cuenta y sale en la pantalla de la mesa.</small></span></span>' + AT().btn('Anotar partidas', 'sv2-bini', '', 'lima') + '</div>';
    const num = pa.hist.length + 1, perdedores = equiposOJugadores(pa);
    const lider = pa.jugadores.slice().sort((a, b) => (b.ganadas - b.perdidas) - (a.ganadas - a.perdidas))[0];
    return '<div class="sv2-part"><div class="sv2-part-h"><b>' + esc(pa.juego) + ' · ' + esc((MODOS.find(o => o[0] === pa.modo) || [, ''])[1]) + '</b>' + (pa.apuesta ? '<small>Apuesta: ' + (pa.apuesta.tipo === 'tiempo' ? 'el tiempo de la mesa' : pa.apuesta.q + ' ' + esc(pa.apuesta.n) + ' por partida') + '</small>' : '<small>Sin apuesta</small>') + '</div>' +
      '<div class="sv2-marc">' + pa.jugadores.map(j => '<div class="sv2-marc-j' + (pa.hist.length && j === lider && lider.ganadas > 0 ? ' lider' : '') + '">' + avatar(j.n, j.foto) + '<b>' + esc(j.n) + (j.uid ? ' ' + I('check') : '') + '</b><span class="num"><em>' + j.ganadas + '</em> G · <em>' + j.perdidas + '</em> P</span>' + (j.debe ? '<small>Debe ' + j.debe + ' ' + esc(pa.apuesta ? pa.apuesta.n : '') + '</small>' : '') + '</div>').join('') + '</div>' +
      '<div class="sv2-perdio"><b>Partida ' + num + ' · ¿Quién perdió?</b><div class="sv2-perdio-b">' + perdedores.map(o => '<button type="button" class="sv2-op" data-act="sv2-perdio" data-v="' + esc(o.k) + '">Perdió ' + esc(o.n) + '</button>').join('') + '</div></div>' +
      (pa.hist.length ? '<ol class="sv2-hist" reversed>' + pa.hist.slice(-4).reverse().map((h, i) => '<li><span>Partida ' + h.n + '</span><b>Perdió ' + esc(h.perdio) + '</b>' + (h.apuesta ? '<small>+' + esc(h.apuesta) + '</small>' : '') + (i === 0 ? '<button type="button" class="link" data-act="sv2-deshacer">Deshacer</button>' : '') + '</li>').join('') + '</ol>' : '') +
      '<div class="sv2-part-bts">' + AT().btn(I('plus') + 'Jugador', 'sv2-bjug', '', 'gris') + AT().btn(I('qr') + 'QR para jugadores', 'sv2-bqr', '', 'gris') + AT().btn(I('tv') + 'Pantalla de la mesa', 'sv2-btv', '', 'gris') + AT().btn('Por jugador', 'sv2-bdiv', '', 'gris') + '</div></div>';
  };
  // En 2 vs 2 pierde el equipo; en 1 vs 1 y todos contra todos, una persona
  function equiposOJugadores(pa) {
    if (pa.modo === '2v2') return ['A', 'B'].map(e => ({ k: 'eq:' + e, n: 'equipo ' + e + ' (' + pa.jugadores.filter(j => j.eq === e).map(j => j.n).join(' y ') + ')' }));
    return pa.jugadores.map(j => ({ k: 'j:' + j.n, n: j.n }));
  }
  A['sv2-perdio'] = el => {
    const t = AT().tienda(), b = AT().bi(), m = AT().selMesa(), pa = m.partida; if (!pa) return;
    const [tipo, v] = el.dataset.v.split(/:(.*)/);
    const pierden = tipo === 'eq' ? pa.jugadores.filter(j => j.eq === v) : pa.jugadores.filter(j => j.n === v);
    const nombre = tipo === 'eq' ? 'equipo ' + v : v, ap = pa.apuesta;
    pa.jugadores.forEach(j => { if (pierden.includes(j)) j.perdidas++; else j.ganadas++; });
    let txt = null;
    if (ap && ap.q) {
      pierden.forEach(j => { j.debe += ap.q; m.cons.push({ n: ap.n + ' · apuesta de ' + j.n, q: ap.q, p: ap.p, quien: j.n, ap: pa.hist.length + 1 }); });
      txt = ap.q * pierden.length + ' ' + ap.n;
    }
    const h = { n: pa.hist.length + 1, perdio: nombre, quien: pierden.map(j => j.n), ts: Date.now(), apuesta: txt };
    pa.hist.push(h);
    b.log = (b.log || []).concat([{ ts: h.ts, mesa: m.n, juego: pa.juego, jugadores: pa.jugadores.map(j => ({ n: j.n, uid: j.uid || null })), perdio: pierden.length === 1 ? pierden[0].n : nombre, quien: h.quien, apuesta: txt }]).slice(-300);
    AT().guardar(t); LM.rerender(); toast('Partida ' + h.n + ': perdió ' + nombre + (txt ? '. Suma ' + txt + '.' : '.'));
  };
  A['sv2-deshacer'] = () => {
    const t = AT().tienda(), b = AT().bi(), m = AT().selMesa(), pa = m.partida; if (!pa || !pa.hist.length) return;
    const h = pa.hist.pop();
    pa.jugadores.forEach(j => { if (h.quien.includes(j.n)) { j.perdidas--; if (pa.apuesta && pa.apuesta.q) j.debe -= pa.apuesta.q; } else j.ganadas--; });
    m.cons = m.cons.filter(c => c.ap !== h.n);
    if (b.log && b.log.length && b.log[b.log.length - 1].ts === h.ts) b.log.pop();
    AT().guardar(t); LM.rerender(); toast('Se borró la partida ' + h.n + '.');
  };
  A['sv2-bjug'] = () => sheet('<div class="sh-h"><div class="tt"><small>' + esc(AT().selMesa().n) + '</small><h3>Agregar jugador</h3></div>' + x() + '</div><form class="sh-b stack" data-form="sv2-bjug"><div class="campo"><label for="svNj">Nombre o apodo</label><input id="svNj" name="n" required maxlength="20" autocomplete="off"></div><p class="muted">Entra desde la próxima partida, con 0 ganadas y 0 perdidas.</p><button class="sv-btn teal xl" type="submit">Agregar</button></form>');
  F['sv2-bjug'] = (f, d) => {
    const m = AT().selMesa(), pa = m.partida, n = String(d.get('n') || '').trim();
    if (!n || pa.jugadores.some(j => j.n.toLowerCase() === n.toLowerCase())) { toast('Escribe un nombre que no esté en la mesa.'); return; }
    if (pa.modo === '2v2') { toast('En 2 vs 2 los equipos son de 2. Cambia a "Todos contra todos" para sumar más.'); return; }
    pa.jugadores.push({ n, eq: null, ganadas: 0, perdidas: 0, debe: 0 }); m.jug = pa.jugadores.length;
    closeModal(); AT().guardar(AT().tienda()); LM.rerender();
  };
  const linkUnirse = (tid, m) => urlBase() + '#billar-' + tid + '-' + m.id + '-' + m.partida.codigo;
  const linkPantalla = (tid, m) => urlBase() + '#marcador-' + tid + '-' + m.id;
  A['sv2-bqr'] = () => {
    const t = AT().tienda(), m = AT().selMesa(), u = linkUnirse(t.id, m);
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(m.n) + '</small><h3>QR para los jugadores</h3></div>' + x() + '</div><div class="sh-b stack sv2-centro">' +
      '<div class="sv2-qr-g">' + qr(u, 230) + '</div><b>Escanéalo con la app Mi Tienda</b><p class="muted">Cada jugador escoge su nombre. Así sus partidas, lo que ganó y lo que debe le quedan en su perfil, en <b>Mis partidas</b>, y su foto sale en la pantalla de la mesa.</p>' +
      '<div class="sv2-vinc">' + m.partida.jugadores.map(j => '<span>' + esc(j.n) + (j.uid ? AT().pill('Vinculado', 'verde') : AT().pill('Sin vincular', 'gris')) + '</span>').join('') + '</div>' +
      '<p class="muted sv2-p">El código cambia cada vez que se abren partidas nuevas en la mesa, para que nadie se vincule a una mesa vieja.</p></div>');
  };
  A['sv2-btv'] = () => {
    const t = AT().tienda(), m = AT().selMesa(), u = linkPantalla(t.id, m);
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(m.n) + '</small><h3>Pantalla de la mesa</h3></div>' + x() + '</div><div class="sh-b stack">' +
      '<p>Cada mesa puede tener su pantalla con los jugadores, el marcador y lo que lleva cada uno. Abre este enlace <b>una sola vez</b> en el aparato que va a quedar en la mesa:</p>' +
      '<div class="sv2-tv-l"><div class="sv2-qr-g">' + qr(u, 170) + '</div><div><code class="sv2-url">' + esc(u) + '</code><button class="sv-btn borde chico" type="button" data-act="sv2-copiar" data-t="' + esc(u) + '">' + I('copy') + 'Copiar enlace</button><a class="sv-btn teal chico" href="' + esc(u) + '" target="_blank" rel="noopener">' + I('tv') + 'Abrir aquí</a></div></div>' +
      '<details class="sv2-det" open><summary>¿En qué aparato?</summary><ul class="sv2-ul">' +
      '<li><b>Tablet o celular viejo:</b> escanea el QR con la cámara, toca "Pantalla completa" y déjalo cargando. La pantalla no se apaga mientras está abierta (Chrome o Safari recientes).</li>' +
      '<li><b>Televisor o monitor por HDMI:</b> conecta un aparato con navegador (Android TV Box, Google TV / Chromecast con Google TV, Fire TV Stick o un mini PC) y abre el enlace en Chrome. Un monitor por VGA necesita un mini PC o un adaptador HDMI a VGA.</li>' +
      '<li><b>Smart TV con navegador:</b> abre el navegador del televisor y escribe el enlace.</li>' +
      '<li><b>Todas las mesas desde un solo enlace:</b> en cada pantalla puedes abrir <code>' + esc(urlBase() + '#marcador-' + t.id) + '</code> y escoger la mesa: queda guardada en ese aparato.</li></ul></details>' +
      '<p class="muted">La pantalla solo muestra nombres, fotos, partidas y lo que se apostó (sin valores en plata ni celulares). Se actualiza sola cada 3 segundos y necesita internet.</p></div>');
  };
  A['sv2-copiar'] = el => { try { navigator.clipboard.writeText(el.dataset.t); toast('Enlace copiado.'); } catch (e) { toast(el.dataset.t); } };

  // Cobrar por jugador: lo de cada uno (apuestas + lo que pidió) + su parte del tiempo
  function cuentasPorJugador(b, m) {
    const pa = m.partida, vt = AT().valorTiempo(b, m), js = pa.jugadores;
    const sinDueno = m.cons.filter(c => !c.quien).reduce((a, c) => a + c.q * c.p, 0);
    const totPerd = js.reduce((a, j) => a + j.perdidas, 0);
    return js.map(j => {
      const propio = m.cons.filter(c => c.quien === j.n).reduce((a, c) => a + c.q * c.p, 0);
      const tiempo = pa.apuesta && pa.apuesta.tipo === 'tiempo' && totPerd ? vt * j.perdidas / totPerd : vt / js.length;
      return { j, propio, tiempo: Math.round(tiempo / 100) * 100, comun: Math.round(sinDueno / js.length / 100) * 100 };
    });
  }
  A['sv2-bdiv'] = () => {
    const b = AT().bi(), m = AT().selMesa(), cs = cuentasPorJugador(b, m);
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(m.n) + ' · ' + AT().durTxt(AT().minJuego(m)) + '</small><h3>Cuenta por jugador</h3></div>' + x() + '</div><div class="sh-b stack">' +
      cs.map(c => '<div class="sv2-cj"><div class="sv2-cj-h">' + avatar(c.j.n, c.j.foto) + '<b>' + esc(c.j.n) + '</b><b class="num">' + pesos(c.propio + c.tiempo + c.comun) + '</b></div><small>' + [c.propio ? 'Apuestas y pedidos ' + pesos(c.propio) : '', 'Tiempo ' + pesos(c.tiempo), c.comun ? 'Pedidos de la mesa ' + pesos(c.comun) : ''].filter(Boolean).join(' · ') + '</small></div>').join('') +
      '<p class="muted">Cada uno paga lo suyo; para el efectivo usa "¿Con cuánto paga?" y la app dice las vueltas. Al final cierra la mesa con <b>Parar el reloj y cobrar</b>.</p>' + vueltasH(cs.reduce((a, c) => a + c.propio + c.tiempo + c.comun, 0), 'billar') + '</div>');
  };
  SV.cerrarPartida = m => { /* las partidas ya quedaron en el registro (b.log) al tocar quién perdió */ };

  /* ---------- calculadora de vueltas (efectivo) ---------- */
  const BILLETES = [2000, 5000, 10000, 20000, 50000, 100000];
  function vueltasH(total, id) {
    const sug = [total].concat(BILLETES.filter(b => b > total).slice(0, 3));
    return '<div class="sv2-vueltas" data-total="' + total + '" id="svV-' + id + '"><label for="svVi-' + id + '">¿Con cuánto paga en efectivo?</label><div class="sv2-chips">' + sug.map((v, i) => '<button type="button" data-act="sv2-paga" data-v="' + v + '" data-id="' + id + '">' + (i === 0 ? 'Exacto' : pesos(v)) + '</button>').join('') + '</div>' +
      '<input id="svVi-' + id + '" inputmode="numeric" data-inp="sv2-paga" data-id="' + id + '" placeholder="Ej: 50000"><output class="sv2-out" aria-live="polite"></output></div>';
  }
  SV.vueltasH = vueltasH;
  function calcVueltas(id, v) {
    const box = document.getElementById('svV-' + id); if (!box) return;
    const tot = +box.dataset.total, out = box.querySelector('output'), inp = box.querySelector('input');
    if (inp && document.activeElement !== inp) inp.value = v ? String(v) : '';
    box.dataset.recibe = v || 0;
    out.className = 'sv2-out' + (!v ? '' : v >= tot ? ' ok' : ' falta');
    out.innerHTML = !v ? '' : v >= tot ? 'Devolver <b class="num">' + pesos(v - tot) + '</b>' : 'Faltan <b class="num">' + pesos(tot - v) + '</b>';
    if (RS.abierto) RS.recibe = v || 0;
  }
  A['sv2-paga'] = el => calcVueltas(el.dataset.id, +el.dataset.v);
  document.addEventListener('input', e => { const el = e.target; if (el && el.dataset && el.dataset.inp === 'sv2-paga') calcVueltas(el.dataset.id, +String(el.value).replace(/\D/g, '') || 0); });

  /* ---------- pantalla de la mesa (#marcador-negocio-mesa) ---------- */
  const TV = { tid: '', mesa: '', datos: null, err: '', timer: 0, lock: null };
  function datosLocales(tid, mid) {
    const N = LM.NEG(tid), bb = N && N.sv && N.sv.billar; const m = bb && bb.mesas.find(x => String(x.id) === String(mid));
    if (!m) return null;
    const pa = m.partida;
    return { negocio: LM.T(tid).n, mesa: { id: m.id, n: m.n, tipo: m.tipo, ini: m.ini, pausa: m.pausa, pausado: m.pausado }, partida: pa ? { juego: pa.juego, modo: pa.modo, numero: pa.hist.length + 1, apuesta: pa.apuesta, jugadores: pa.jugadores.map(j => ({ n: j.n, foto: j.foto || null, vinculado: !!j.uid, ganadas: j.ganadas, perdidas: j.perdidas, debe: j.debe })), hist: pa.hist.slice(-6) } : null, codigo: pa && pa.codigo };
  }
  async function cargarTV() {
    if (API().disponible) {
      try { TV.datos = await API().get('/api/sv/' + TV.tid + '/marcador/' + TV.mesa); TV.err = ''; } catch (e) { TV.err = e.status === 404 ? 'Esa mesa no existe en este negocio.' : 'Sin conexión. Reintentando…'; }
    } else { TV.datos = datosLocales(TV.tid, TV.mesa); TV.err = TV.datos ? '' : 'Esa mesa no existe.'; }
    pintarTV();
  }
  function pintarTV() {
    const app = document.getElementById('app'); if (!app || !/^marcador-/.test((location.hash || '').slice(1))) return;
    const d = TV.datos, pa = d && d.partida;
    if (!d) { app.innerHTML = '<div class="sv2-tv"><div class="sv2-tv-vacio">' + (TV.err ? esc(TV.err) : 'Cargando la mesa…') + '</div></div>'; return; }
    const mesa = d.mesa, ms = mesa.ini ? (mesa.pausa || Date.now()) - mesa.ini - (mesa.pausado || 0) : 0;
    const orden = pa ? pa.jugadores.slice().sort((a, b) => (b.ganadas - b.perdidas) - (a.ganadas - a.perdidas)) : [];
    const lider = orden[0] && orden[0].ganadas > 0 && (!orden[1] || (orden[0].ganadas - orden[0].perdidas) > (orden[1].ganadas - orden[1].perdidas)) ? orden[0] : null;
    const uLink = pa && (d.codigo || (TV.codigo)) ? urlBase() + '#billar-' + TV.tid + '-' + mesa.id + '-' + (d.codigo || TV.codigo) : '';
    app.innerHTML = '<div class="sv2-tv"><header class="sv2-tv-h"><div><small>' + esc(d.negocio) + '</small><h1>' + esc(mesa.n) + (pa ? ' · ' + esc(pa.juego) : '') + '</h1></div>' +
      (mesa.ini ? '<div class="sv2-tv-reloj"><small>Tiempo</small><b class="num"' + (mesa.pausa ? '' : ' data-svt="' + mesa.ini + '" data-svx="' + (mesa.pausado || 0) + '"') + '>' + fmtReloj(ms) + '</b>' + (mesa.pausa ? '<small>En pausa</small>' : '') + '</div>' : '') +
      (pa ? '<div class="sv2-tv-p"><small>Partida</small><b class="num">' + pa.numero + '</b></div>' : '') + '<button class="sv2-tv-fs" type="button" data-act="sv2-fs" aria-label="Pantalla completa">' + I('expand') + '</button></header>' +
      (!mesa.ini ? '<div class="sv2-tv-vacio"><b>Mesa libre</b><span>Pídele a la mesera que la inicie.</span></div>' :
        !pa ? '<div class="sv2-tv-vacio"><b>Mesa en juego</b><span>Cuando la mesera anote los jugadores, aquí sale el marcador.</span></div>' :
          '<div class="sv2-tv-j n' + Math.min(pa.jugadores.length, 4) + '">' + pa.jugadores.map(j => '<article class="sv2-tv-c' + (j === lider ? ' lider' : '') + '">' + (j === lider ? '<span class="sv2-tv-cor">' + I('trophy') + 'Va ganando</span>' : '') + avatar(j.n, j.foto, 'xl') + '<h2>' + esc(j.n) + '</h2>' +
            '<div class="sv2-tv-n"><span><b class="num">' + j.ganadas + '</b><small>ganadas</small></span><span><b class="num">' + j.perdidas + '</b><small>perdidas</small></span></div>' +
            (pa.apuesta && pa.apuesta.q ? '<p class="sv2-tv-debe">' + (j.debe ? 'Debe <b class="num">' + j.debe + '</b> ' + esc(pa.apuesta.n) : 'No debe nada') + '</p>' : '') + '</article>').join('') + '</div>' +
          '<footer class="sv2-tv-f"><div class="sv2-tv-hist"><small>Últimas partidas</small>' + (pa.hist.length ? pa.hist.slice(-5).reverse().map(h => '<span>#' + h.n + ' perdió <b>' + esc(h.perdio) + '</b></span>').join('') : '<span>Todavía no se ha jugado ninguna.</span>') +
          (pa.apuesta ? '<em>Apuesta: ' + (pa.apuesta.tipo === 'tiempo' ? 'el que pierde paga el tiempo' : pa.apuesta.q + ' ' + esc(pa.apuesta.n) + ' por partida') + '</em>' : '') + '</div>' +
          (uLink ? '<div class="sv2-tv-qr"><div class="sv2-qr-g">' + qr(uLink, 120) + '</div><span>Escanea con Mi Tienda y guarda tus partidas</span></div>' : '') + '</footer>') + '</div>';
  }
  const fmtReloj = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 3600) + ':' + String(Math.floor(s / 60) % 60).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  A['sv2-fs'] = () => { const d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen().catch(() => toast('Este aparato no deja pantalla completa. Usa el botón del navegador.')); };
  async function despierta() { try { if ('wakeLock' in navigator && !TV.lock) { TV.lock = await navigator.wakeLock.request('screen'); TV.lock.addEventListener('release', () => { TV.lock = null; }); } } catch (e) {} }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && TV.tid) despierta(); });
  function vMarcador(r) {
    const m = /^marcador-([a-z0-9-]+?)(?:-(\d+))?$/.exec(r); if (!m) return '';
    document.body.classList.add('sv2-modo-tv');
    if (!m[2]) { // escoger la mesa de esta pantalla
      let guardada = ''; try { guardada = localStorage.getItem('sv2-tv-' + m[1]) || ''; } catch (e) {}
      if (guardada) { location.replace('#marcador-' + m[1] + '-' + guardada); return '<div class="sv2-tv"></div>'; }
      const N = LM.NEG(m[1]), mesas = (N && N.sv && N.sv.billar ? N.sv.billar.mesas : (SV.SEED.billar ? SV.SEED.billar().mesas : []));
      return '<div class="sv2-tv"><div class="sv2-tv-elige"><h1>¿Qué mesa es esta pantalla?</h1><p>Se queda guardado en este aparato.</p><div>' + mesas.map(x => '<button type="button" data-act="sv2-tv-mesa" data-t="' + esc(m[1]) + '" data-m="' + x.id + '">' + esc(x.n) + '</button>').join('') + '</div></div></div>';
    }
    if (TV.tid !== m[1] || TV.mesa !== m[2]) { TV.tid = m[1]; TV.mesa = m[2]; TV.datos = null; }
    clearInterval(TV.timer); TV.timer = setInterval(() => { if (!/^marcador-/.test((location.hash || '').slice(1))) { clearInterval(TV.timer); document.body.classList.remove('sv2-modo-tv'); return; } cargarTV(); }, 3000);
    setTimeout(cargarTV, 0); despierta();
    return '<div class="sv2-tv"><div class="sv2-tv-vacio">Cargando la mesa…</div></div>';
  }
  A['sv2-tv-mesa'] = el => { try { localStorage.setItem('sv2-tv-' + el.dataset.t, el.dataset.m); } catch (e) {} LM.go('marcador-' + el.dataset.t + '-' + el.dataset.m); };

  /* ---------- el jugador escanea el QR (#billar-negocio-mesa-codigo) ---------- */
  const UN = { datos: null, err: '', ok: '' };
  function vUnirse(r) {
    const m = /^billar-([a-z0-9-]+?)-(\d+)-(\d{6})$/.exec(r); if (!m) return '';
    const [, tid, mid, cod] = m, t = LM.T(tid);
    if (esperarApi()) return '<div class="wrap sv2-unir"><p class="muted">Buscando la mesa…</p></div>';
    if (!UN.datos || UN.key !== r) { UN.key = r; UN.datos = null; UN.err = ''; UN.ok = '';
      if (API().disponible) API().get('/api/sv/' + tid + '/marcador/' + mid).then(d => { UN.datos = d; LM.rerender(); }).catch(e => { UN.err = e.message; LM.rerender(); });
      else { UN.datos = datosLocales(tid, mid); if (!UN.datos) UN.err = 'Esa mesa no existe.'; }
    }
    const d = UN.datos, pa = d && d.partida;
    let cuerpo;
    if (UN.err) cuerpo = '<p class="sv2-err">' + esc(UN.err) + '</p>';
    else if (!d) cuerpo = '<p class="muted">Buscando la mesa…</p>';
    else if (!pa) cuerpo = '<p>Esta mesa no tiene partidas abiertas. Pídele a la mesera que anote los jugadores.</p>';
    else if (UN.ok) cuerpo = '<div class="sv2-ok">' + I('check') + '<div><b>¡Listo, ' + esc(UN.ok) + '!</b><p>Tus partidas de esta mesa quedan en <b>Mis partidas</b>.</p></div></div><button class="sv-btn teal xl" type="button" data-act="go" data-h="mis-partidas">Ver mis partidas</button>';
    else cuerpo = '<h2 class="sv2-h4">¿Cuál de estos eres tú?</h2><div class="sv2-lista">' + pa.jugadores.map((j, i) => '<button type="button" class="sv2-op fila" data-act="sv2-unirme" data-t="' + tid + '" data-m="' + mid + '" data-c="' + cod + '" data-ix="' + i + '"' + (j.vinculado ? ' disabled' : '') + '>' + avatar(j.n, j.foto) + '<span>' + esc(j.n) + '</span>' + (j.vinculado ? AT().pill('Ya vinculado', 'gris') : I('chevr')) + '</button>').join('') + '</div>' +
      '<p class="muted sv2-p">Tu nombre y tu foto de perfil salen en la pantalla de la mesa. Puedes poner tu foto en <button class="link" type="button" data-act="go" data-h="cuenta">Mi cuenta</button>.</p>';
    return '<div class="wrap sv2-unir"><div class="sv-box"><header><img src="' + esc(t ? SV.lg(t) : 'icons/icon-192.png') + '" alt=""><div><small>' + esc(t ? t.n : tid) + '</small><h1>' + esc(d ? d.mesa.n : 'Mesa ' + mid) + (pa ? ' · ' + esc(pa.juego) : '') + '</h1></div></header>' + cuerpo + '</div></div>';
  }
  A['sv2-unirme'] = el => {
    const { t: tid, m: mid, c: cod, ix: i } = el.dataset;
    LM.needCli(async () => {
      if (API().disponible) {
        try { const r = await API().post('/api/sv/' + tid + '/billar/unirme', { mesa: mid, codigo: cod, jugador: +i }); UN.ok = r.jugador; }
        catch (e) { toast(e.message); return; }
      } else {
        const N = LM.NEG(tid), m = N.sv.billar.mesas.find(x => String(x.id) === mid);
        if (!m || !m.partida || m.partida.codigo !== cod) { toast('Ese código ya no sirve.'); return; }
        m.partida.jugadores.forEach(j => { if (j.uid === 'yo') { delete j.uid; delete j.foto; } });
        const j = m.partida.jugadores[+i]; j.uid = 'yo'; j.foto = S().user.foto || null; UN.ok = j.n; LM.save();
      }
      LM.rerender();
    });
  };

  /* ---------- Mis partidas del cliente (#mis-partidas) ---------- */
  const MP = { d: null, t: 0, err: '' };
  function misLocales() {
    const out = [], abiertas = [];
    S().tiendas.forEach(t => {
      const bb = LM.NEG(t.id) && LM.NEG(t.id).sv && LM.NEG(t.id).sv.billar; if (!bb) return;
      (bb.log || []).forEach(x => { const yo = (x.jugadores || []).find(j => j.uid === 'yo'); if (yo) out.push({ negocio: t.id, negocio_n: t.n, mesa: x.mesa, juego: x.juego, ts: x.ts, gane: !(x.quien || [x.perdio]).includes(yo.n), perdio: x.perdio, rivales: x.jugadores.filter(j => j.n !== yo.n).map(j => j.n), apuesta: x.apuesta }); });
      bb.mesas.forEach(m => { const yo = m.partida && m.partida.jugadores.find(j => j.uid === 'yo'); if (yo) abiertas.push({ negocio: t.id, negocio_n: t.n, mesa: m.n, juego: m.partida.juego, ganadas: yo.ganadas, perdidas: yo.perdidas, debe: yo.debe, apuesta: m.partida.apuesta && m.partida.apuesta.n }); });
    });
    out.sort((a, b) => b.ts - a.ts);
    return { partidas: out, abiertas, ganadas: out.filter(x => x.gane).length, perdidas: out.filter(x => !x.gane).length };
  }
  function vMisPartidas() {
    if (!ses() || ses().rol !== 'cliente') return '<div class="wrap sv2-mp"><div class="sv-box"><h1>Mis partidas en el billar</h1><p>Entra con tu cuenta de cliente para ver tus partidas.</p><button class="sv-btn teal" type="button" data-act="login" data-tab="cliente">Ingresar</button></div></div>';
    if (esperarApi()) return '<div class="wrap sv2-mp"><p class="muted">Cargando tus partidas…</p></div>';
    if (API().disponible && API().yo) { if (Date.now() - MP.t > 15000) { MP.t = Date.now(); API().get('/api/sv/mis-partidas').then(d => { MP.d = d; LM.rerender(); }).catch(e => { MP.err = e.message; }); } }
    else MP.d = misLocales();
    const d = MP.d;
    if (!d) return '<div class="wrap sv2-mp"><p class="muted">Cargando tus partidas…</p></div>';
    const tot = d.ganadas + d.perdidas, ef = tot ? Math.round(d.ganadas / tot * 100) : 0;
    return '<div class="wrap sv2-mp"><h1>Mis partidas en el billar</h1>' +
      '<div class="sv2-mp-n"><div><b class="num verde">' + d.ganadas + '</b><small>ganadas</small></div><div><b class="num rojo">' + d.perdidas + '</b><small>perdidas</small></div><div><b class="num">' + ef + '%</b><small>efectividad</small></div></div>' +
      d.abiertas.map(a => '<div class="sv2-mp-ab">' + I('trophy') + '<span><b>Mesa abierta ahora · ' + esc(a.negocio_n) + '</b>' + esc(a.mesa) + ' · ' + esc(a.juego) + ' · ' + a.ganadas + ' G – ' + a.perdidas + ' P' + (a.debe ? ' · debes ' + a.debe + ' ' + esc(a.apuesta || '') : '') + '</span></div>').join('') +
      '<div class="sv-box"><h2>Últimas partidas</h2>' + (d.partidas.length ? '<ul class="sv2-mp-l">' + d.partidas.slice(0, 40).map(p => '<li><div><b>' + esc(p.negocio_n) + ' · ' + esc(p.mesa) + ' · ' + esc(p.juego) + '</b><small>' + new Date(p.ts).toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) + ' · contra ' + esc(p.rivales.join(', ')) + '</small></div>' + (p.gane ? AT().pill('Ganaste', 'verde') : AT().pill('Perdiste', 'rojo')) + '</li>').join('') + '</ul>' : '<p class="muted">Todavía no tienes partidas. En el billar, escanea el QR de la mesa y escoge tu nombre.</p>') + '</div>' +
      '<button class="sv-btn teal xl" type="button" data-act="go" data-h="escanear">' + I('scan') + 'Escanear el QR de una mesa</button></div>';
  }

  /* ======================================================================================
     2. RESTAURANTES · pedido paso a paso, resumen tipo factura, pago y ticket con QR
     ====================================================================================== */
  const ORDEN_CAT = ['Entradas', 'Asados', 'Almuerzos', 'Platos', 'Pescados', 'Hamburguesas', 'Perros', 'Comidas rápidas', 'Arepas y fritos', 'Salsas', 'Adicionales', 'Acompañantes', 'Bebidas', 'Jugos', 'Jugos y raspao', 'Postres'];
  const RS = { abierto: false };
  const menuDe = tid => S().prods.filter(p => p.t === tid && p.disp !== false);
  function categorias(tid) {
    const subs = [...new Set(menuDe(tid).map(p => p.sub || 'Menú'))];
    return subs.sort((a, b) => { const ia = ORDEN_CAT.indexOf(a), ib = ORDEN_CAT.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b); });
  }
  SV.pasos = (tid, o) => {
    const cats = categorias(tid);
    if (!cats.length) { toast('Este negocio todavía no tiene menú.'); return; }
    Object.assign(RS, { abierto: true, tid, modo: o.modo, mesa: o.mesa || null, cats, paso: 0, q: {}, pago: 'efectivo', recibe: 0, entrega: o.modo === 'cliente' ? 'domicilio' : 'mesa', dir: (S().user.dirs && S().user.dirs[0] || {}).d || '' });
    pintarRS();
  };
  const items = () => Object.keys(RS.q).filter(id => RS.q[id] > 0).map(id => ({ p: LM.PR(id), q: RS.q[id] })).filter(x => x.p);
  const totalRS = () => items().reduce((a, x) => a + LM.precio(x.p).p * x.q, 0);
  const fotoP = p => p.fotoSrv || p.fotoMini || '';
  function pintarRS() {
    const t = LM.T(RS.tid), paso = RS.paso, n = RS.cats.length, enRes = paso >= n;
    const cuenta = items().reduce((a, x) => a + x.q, 0), tot = totalRS();
    const quien = RS.modo === 'mesa' ? 'Mesa ' + RS.mesa + ' · atiende ' + esc(AT().nombreYo()) : esc(t.n);
    const barra = '<nav class="sv2-cats" aria-label="Categorías del menú">' + RS.cats.map((c, i) => '<button type="button" class="' + (i === paso ? 'on' : '') + (RS.cats[i] && items().some(x => (x.p.sub || 'Menú') === c) ? ' lleva' : '') + '" data-act="sv2-rsir" data-ix="' + i + '"' + (i === paso ? ' aria-current="step"' : '') + '>' + esc(c) + '</button>').join('') + '<button type="button" class="' + (enRes ? 'on' : '') + '" data-act="sv2-rsir" data-ix="' + n + '"' + (enRes ? ' aria-current="step"' : '') + '>Resumen</button></nav>';
    let cuerpo, pie;
    if (!enRes) {
      const cat = RS.cats[paso], ls = menuDe(RS.tid).filter(p => (p.sub || 'Menú') === cat);
      cuerpo = '<h4 class="sv2-h4">' + esc(cat) + '</h4><div class="sv2-menu">' + ls.map(p => { const q = RS.q[p.id] || 0, pr = LM.precio(p); return '<div class="sv2-plato' + (q ? ' on' : '') + '">' +
        '<button type="button" class="sv2-plato-a" data-act="sv2-rsq" data-id="' + esc(p.id) + '" data-d="1" aria-label="Agregar ' + esc(p.n) + '"><span class="sv2-plato-f">' + (fotoP(p) ? '<img src="' + esc(fotoP(p)) + '" alt="" loading="lazy">' : I(p.i || 'olla')) + '</span><span class="sv2-plato-t"><b>' + esc(p.n) + '</b><small>' + esc(p.d || '') + '</small><b class="num">' + pesos(pr.p) + '</b></span></button>' +
        '<div class="sv2-step chico"><button type="button" data-act="sv2-rsq" data-id="' + esc(p.id) + '" data-d="-1" aria-label="Quitar uno de ' + esc(p.n) + '"' + (q ? '' : ' disabled') + '>−</button><span><b class="num">' + q + '</b></span><button type="button" class="mas" data-act="sv2-rsq" data-id="' + esc(p.id) + '" data-d="1" aria-label="Agregar uno de ' + esc(p.n) + '">+</button></div></div>'; }).join('') + '</div>';
      pie = '<div class="sv2-rs-tot"><span>' + cuenta + ' producto' + (cuenta === 1 ? '' : 's') + '</span><b class="num">' + pesos(tot) + '</b></div><div class="sv2-pie2">' + (paso > 0 ? '<button class="sv-btn gris" type="button" data-act="sv2-rsir" data-ix="' + (paso - 1) + '">Atrás</button>' : '') +
        '<button class="sv-btn teal xl" type="button" data-act="sv2-rsir" data-ix="' + (paso + 1) + '">' + (paso + 1 < n ? 'Siguiente: ' + esc(RS.cats[paso + 1]) : 'Ver el resumen') + '</button></div>';
    } else {
      if (!cuenta) cuerpo = '<p class="muted">Todavía no hay nada en el pedido. Vuelve a las categorías y toca los productos.</p>';
      else cuerpo = ticketH({ negocio: t, num: null, quien: RS.modo === 'mesa' ? 'Mesa ' + RS.mesa : (S().user.nombre || 'Cliente'), atiende: RS.modo === 'mesa' ? AT().nombreYo() : '', lineas: items().map(x => ({ n: x.p.n, q: x.q, p: LM.precio(x.p).p })), total: tot, borrador: true }) +
        (RS.modo === 'cliente' ? '<h4 class="sv2-h4">¿Cómo lo quieres?</h4><div class="sv2-seg">' + [['domicilio', 'Domicilio'], ['recoger', 'Paso a recoger'], ['alla', 'Como allá']].map(o => '<button type="button" class="' + (RS.entrega === o[0] ? 'on' : '') + '" data-act="sv2-rsent" data-v="' + o[0] + '" aria-pressed="' + (RS.entrega === o[0]) + '">' + o[1] + '</button>').join('') + '</div>' +
          (RS.entrega === 'domicilio' ? '<div class="campo"><label for="svRsDir">Dirección</label><input id="svRsDir" data-inp="sv2-rsdir" value="' + esc(RS.dir) + '" placeholder="Barrio, calle y una seña"></div>' : '') : '') +
        '<h4 class="sv2-h4">' + (RS.modo === 'mesa' ? '¿Cómo va a pagar el cliente?' : '¿Cómo pagas?') + '</h4>' + pagosRS(t) + detallePago(t, tot);
      pie = '<div class="sv2-pie2"><button class="sv-btn gris" type="button" data-act="sv2-rsir" data-ix="' + (n - 1) + '">Atrás</button>' + (cuenta ? '<button class="sv-btn teal xl" type="button" data-act="sv2-rsenviar">' + I('check') + (RS.modo === 'mesa' ? 'Enviar pedido' : 'Hacer pedido') + ' · ' + pesos(tot) + '</button>' : '') + '</div>';
    }
    sheet('<div class="sh-h"><div class="tt"><small>' + quien + '</small><h3>' + (RS.modo === 'mesa' ? 'Tomar el pedido' : 'Arma tu pedido') + '</h3></div><button class="x" type="button" data-act="sv2-rscerrar" aria-label="Cerrar">' + I('x') + '</button></div>' + barra + '<div class="sh-b stack sv2-wz">' + cuerpo + '</div><div class="sv2-sh-pie">' + pie + '</div>', 'sv2-sheet ancho');
    if (enRes && RS.pago === 'efectivo' && RS.recibe) calcVueltas('rs', RS.recibe);
  }
  const PAGOS_RS = [['efectivo', 'Efectivo', 'cash'], ['transferencia', 'Transferencia o QR', 'qr'], ['breb', 'Llave Bre-B', 'llave'], ['tarjeta', 'Tarjeta', 'card']];
  const pagosRS = t => '<div class="sv2-ops dos">' + PAGOS_RS.filter(p => RS.modo === 'mesa' || p[0] !== 'tarjeta' || (t.pagos || {}).tarjeta).map(p => '<button type="button" class="sv2-op fila' + (RS.pago === p[0] ? ' on' : '') + '" data-act="sv2-rspago" data-v="' + p[0] + '" aria-pressed="' + (RS.pago === p[0]) + '">' + I(p[2]) + '<span>' + p[1] + '</span></button>').join('') + '</div>';
  function detallePago(t, tot) {
    if (RS.pago === 'efectivo') return vueltasH(tot, 'rs');
    const cuenta = LM.CUENTA_PAGO ? (LM.CUENTA_PAGO(t, RS.pago === 'breb' ? 'breb' : 'nequi') || t.nequi || t.tel || '') : (t.nequi || '');
    if (RS.pago === 'tarjeta') return '<p class="sv2-nota">' + I('info') + 'Se cobra con el datáfono del negocio. La app no cobra tarjetas: solo deja anotado que pagó con tarjeta.</p>';
    return '<div class="sv2-pago-qr"><div class="sv2-qr-g">' + qr((RS.pago === 'breb' ? 'Llave Bre-B ' : 'Nequi ') + cuenta + ' · ' + t.n + ' · ' + pesos(tot), 140) + '</div><div><b>' + (RS.pago === 'breb' ? 'Llave Bre-B' : 'Nequi / transferencia') + ' de ' + esc(t.n) + '</b><span class="num">' + esc(cuenta || 'El negocio te la da') + '</span><small>' + (RS.modo === 'mesa' ? 'Muéstrale este QR al cliente. Al recibir el comprobante, márcalo como pagado en Caja.' : 'Envía el comprobante por el chat del pedido.') + '</small></div></div>';
  }
  A['sv2-rsq'] = el => { const id = el.dataset.id; RS.q[id] = Math.max(0, (RS.q[id] || 0) + +el.dataset.d); pintarRSconservar(); };
  A['sv2-rsir'] = el => { RS.paso = Math.max(0, Math.min(RS.cats.length, +el.dataset.ix)); pintarRS(); const b = document.querySelector('#sheet .sh-b'); if (b) b.scrollTop = 0; };
  A['sv2-rspago'] = el => { RS.pago = el.dataset.v; RS.recibe = 0; pintarRSconservar(); };
  A['sv2-rsent'] = el => { RS.entrega = el.dataset.v; pintarRSconservar(); };
  A['sv2-rscerrar'] = () => { RS.abierto = false; closeModal(); };
  document.addEventListener('input', e => { const el = e.target; if (el && el.dataset && el.dataset.inp === 'sv2-rsdir') RS.dir = el.value; });
  function pintarRSconservar() { const b = document.querySelector('#sheet .sh-b'), y = b ? b.scrollTop : 0; pintarRS(); const b2 = document.querySelector('#sheet .sh-b'); if (b2) b2.scrollTop = y; }
  A['sv2-pasos-mesa'] = el => SV.pasos(AT().tienda().id, { modo: 'mesa', mesa: +el.dataset.id });
  A['sv2-pasos-cli'] = el => SV.pasos(el.dataset.t, { modo: 'cliente' });

  A['sv2-rsenviar'] = () => {
    const t = LM.T(RS.tid), ls = items(), tot = totalRS();
    if (!ls.length) return;
    if (RS.pago === 'efectivo' && RS.recibe && RS.recibe < tot) { toast('Con ese billete faltan ' + pesos(tot - RS.recibe) + '.'); return; }
    if (RS.modo === 'cliente') {
      if (RS.entrega === 'domicilio' && !RS.dir.trim()) { toast('Escribe la dirección para el domicilio.'); return; }
      const pago = { efectivo: 'efectivo', transferencia: 'nequi', breb: 'breb', tarjeta: 'efectivo' }[RS.pago];
      const nota = (RS.pago === 'efectivo' && RS.recibe > tot ? 'Paga con ' + pesos(RS.recibe) + ' (vueltas ' + pesos(RS.recibe - tot) + ')' : '') + (RS.pago === 'tarjeta' ? 'Paga con tarjeta en el local' : '');
      RS.abierto = false; closeModal();
      LM.pedirDirecto(ls.map(x => ({ id: x.p.id, q: x.q })), { modo: RS.entrega, dir: RS.dir, pago, nota });
      return;
    }
    // Mesera: el pedido queda "por aprobar"; el dueño o la cajera lo envía a cocina o lo cancela
    const k = AT().re(), m = AT().mesaR(RS.mesa), num = (k.nTicket = (k.nTicket || 1000) + 1), cod = codigo6(), ts = Date.now();
    ls.forEach(x => m.items.push({ n: x.p.n, q: x.q, p: LM.precio(x.p).p, cocina: 'aprobar', tk: num, ts }));
    if (m.estado === 'libre') { m.estado = 'ocupada'; m.desde = ts; }
    const tk = { num, codigo: cod, mesa: m.id, por: AT().nombreYo(), ts, lineas: ls.map(x => ({ n: x.p.n, q: x.q, p: LM.precio(x.p).p })), total: tot, pago: RS.pago, recibe: RS.pago === 'efectivo' ? RS.recibe || 0 : 0, estado: 'por aprobar' };
    k.tickets = (k.tickets || []).concat([tk]).slice(-200);
    RS.abierto = false; AT().guardar(t);
    mostrarTicket(t, tk, true);
    LM.logN(t.id, 'Mesa ' + m.id + ': ' + AT().nombreYo() + ' tomó el pedido #' + num + ' (' + pesos(tot) + '), espera aprobación');
  };
  SV.restoPendH = t => {
    const k = AT().st(t), pend = (k.tickets || []).filter(x => x.estado === 'por aprobar');
    if (!pend.length) return '';
    const puede = ['dueno', 'cajero'].includes(ses().rol);
    return pend.map(tk => '<div class="sv-alerta lila sv2-aprob">' + I('receipt') + '<span><b>Mesa ' + tk.mesa + ' · pedido #' + tk.num + ' por aprobar</b>' + esc(tk.lineas.map(l => l.q + ' ' + l.n.toLowerCase()).join(', ')) + ' · ' + pesos(tk.total) + ' · tomó ' + esc(tk.por) + '</span>' +
      (puede ? '<span class="sv2-aprob-b"><button class="sv-btn teal" type="button" data-act="sv2-aprobar" data-n="' + tk.num + '">' + I('olla') + 'Enviar a cocina</button><button class="sv-btn gris" type="button" data-act="sv2-cancelar" data-n="' + tk.num + '">Cancelar</button></span>' : '<small>Esperando que el administrador lo apruebe.</small>') +
      '<button class="sv-btn borde chico" type="button" data-act="sv2-vertk" data-n="' + tk.num + '">Ticket</button></div>').join('');
  };
  A['sv2-aprobar'] = el => {
    const t = AT().tienda(), k = AT().re(), tk = (k.tickets || []).find(x => x.num === +el.dataset.n); if (!tk) return;
    const m = AT().mesaR(tk.mesa);
    m.items.forEach(i => { if (i.tk === tk.num && i.cocina === 'aprobar') { i.cocina = 'pend'; i.ts = Date.now(); } });
    m.estado = 'cocina'; m.desde = m.desde || Date.now(); tk.estado = 'en cocina';
    AT().guardar(t); LM.logN(t.id, 'Pedido #' + tk.num + ' de la mesa ' + tk.mesa + ' enviado a cocina'); LM.rerender(); toast('Pedido #' + tk.num + ' enviado a cocina.');
  };
  A['sv2-cancelar'] = el => {
    const t = AT().tienda(), k = AT().re(), tk = (k.tickets || []).find(x => x.num === +el.dataset.n); if (!tk) return;
    const m = AT().mesaR(tk.mesa);
    m.items = m.items.filter(i => i.tk !== tk.num || i.cocina !== 'aprobar');
    if (!m.items.length) Object.assign(m, { estado: 'libre', desde: null });
    tk.estado = 'cancelado';
    AT().guardar(t); LM.logN(t.id, 'Pedido #' + tk.num + ' de la mesa ' + tk.mesa + ' cancelado'); LM.rerender(); toast('Pedido #' + tk.num + ' cancelado.');
  };
  A['sv2-vertk'] = el => { const t = AT().tienda(), tk = (AT().re().tickets || []).find(x => x.num === +el.dataset.n); if (tk) mostrarTicket(t, tk, false); };

  /* ---------- el ticket (tipo factura, con QR) ---------- */
  const PAGO_TX = { efectivo: 'Efectivo', transferencia: 'Transferencia / QR', breb: 'Llave Bre-B', tarjeta: 'Tarjeta', nequi: 'Nequi', fiado: 'Fiado', daviplata: 'Daviplata', banco: 'Bancolombia', saldo: 'Saldo Mi Tienda' };
  function ticketH(o) {
    const t = o.negocio, f = new Date(o.ts || Date.now());
    return '<article class="sv2-tk' + (o.borrador ? ' borrador' : '') + '" aria-label="Ticket"><header><img src="' + esc(SV.lg(t)) + '" alt=""><div><b>' + esc(t.n) + '</b><small>' + esc(t.dir || '') + (t.tel ? ' · ' + esc(t.tel) : '') + '</small></div></header>' +
      '<dl class="sv2-tk-d"><div><dt>' + (o.borrador ? 'Resumen del pedido' : 'Ticket de venta') + '</dt><dd>' + (o.num ? '#' + o.num : '') + '</dd></div><div><dt>Fecha</dt><dd>' + f.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + '</dd></div><div><dt>Para</dt><dd>' + esc(o.quien) + '</dd></div>' + (o.atiende ? '<div><dt>Atiende</dt><dd>' + esc(o.atiende) + '</dd></div>' : '') + '</dl>' +
      '<table class="sv2-tk-t"><thead><tr><th>Cant.</th><th>Producto</th><th>Valor</th></tr></thead><tbody>' + o.lineas.map(l => '<tr><td class="num">' + l.q + '</td><td>' + esc(l.n) + '<small class="num">' + pesos(l.p) + ' c/u</small></td><td class="num">' + pesos(l.q * l.p) + '</td></tr>').join('') + '</tbody></table>' +
      '<div class="sv2-tk-tot"><span>Total</span><b class="num">' + pesos(o.total) + '</b></div>' +
      (o.pago ? '<dl class="sv2-tk-d"><div><dt>Forma de pago</dt><dd>' + esc(PAGO_TX[o.pago] || o.pago) + '</dd></div>' + (o.recibe ? '<div><dt>Recibido</dt><dd class="num">' + pesos(o.recibe) + '</dd></div><div><dt>Vueltas</dt><dd class="num">' + pesos(o.recibe - o.total) + '</dd></div>' : '') + (o.estado ? '<div><dt>Estado</dt><dd>' + esc(o.estado) + '</dd></div>' : '') + '</dl>' : '') +
      (o.qr ? '<div class="sv2-tk-qr">' + qr(o.qr, 132) + '<small>Escanéalo para guardar el ticket en tu celular.</small></div>' : '') +
      '<p class="sv2-tk-pie">Ticket de control interno. No es factura electrónica.</p></article>';
  }
  SV.ticketH = ticketH;
  const linkTicket = (tid, tk) => urlBase() + '#tk-' + tid + '-' + tk.num + '-' + tk.codigo;
  function mostrarTicket(t, tk, nuevo) {
    sheet('<div class="sh-h"><div class="tt"><small>Mesa ' + tk.mesa + '</small><h3>' + (nuevo ? 'Pedido enviado' : 'Ticket #' + tk.num) + '</h3></div>' + x() + '</div><div class="sh-b stack">' +
      (nuevo ? '<div class="sv2-ok">' + I('check') + '<div><b>Pedido #' + tk.num + ' enviado al administrador.</b><p>Cuando lo apruebe, pasa a la cocina. El cliente puede escanear el QR del ticket y verlo en su celular.</p></div></div>' : '') +
      ticketH({ negocio: t, num: tk.num, ts: tk.ts, quien: 'Mesa ' + tk.mesa, atiende: tk.por, lineas: tk.lineas, total: tk.total, pago: tk.pago, recibe: tk.recibe, estado: tk.estado, qr: linkTicket(t.id, tk) }) +
      '<div class="sv2-pie2"><button class="sv-btn gris" type="button" data-act="sv2-imprimir">' + I('print') + 'Imprimir</button><button class="sv-btn teal xl" type="button" data-act="cerrar-render">Listo</button></div></div>', 'sv2-sheet');
  }
  A['cerrar-render'] = () => { closeModal(); LM.rerender(); };
  A['sv2-imprimir'] = () => { document.body.classList.add('sv2-imprime'); setTimeout(() => { window.print(); document.body.classList.remove('sv2-imprime'); }, 50); };
  // El cliente abre el ticket con el QR (#tk-negocio-numero-codigo)
  const TKV = { k: '', d: null, err: '' };
  function vTicket(r) {
    const m = /^tk-([a-z0-9-]+?)-(\d+)-(\d{6})$/.exec(r); if (!m) return '';
    const [, tid, num, cod] = m, t = LM.T(tid) || { n: tid, logo: '' };
    if (esperarApi()) return '<div class="wrap sv2-tkv"><p class="muted">Buscando el ticket…</p></div>';
    if (TKV.k !== r) {
      TKV.k = r; TKV.d = null; TKV.err = '';
      if (API().disponible) API().get('/api/sv/' + tid + '/ticket/' + num + '?c=' + cod).then(d => { TKV.d = d.ticket; LM.rerender(); }).catch(e => { TKV.err = e.message; LM.rerender(); });
      else { const N = LM.NEG(tid), k = N && N.sv && N.sv.resto; TKV.d = k && (k.tickets || []).find(x => String(x.num) === num && x.codigo === cod); if (!TKV.d) TKV.err = 'No encontramos ese ticket.'; }
    }
    const tk = TKV.d;
    if (tk && ses() && ses().rol === 'cliente') { const g = S().sv02 = S().sv02 || {}; g.misTickets = g.misTickets || []; if (!g.misTickets.includes(r)) { g.misTickets.push(r); LM.save(); } }
    return '<div class="wrap sv2-tkv">' + (TKV.err ? '<p class="sv2-err">' + esc(TKV.err) + '</p>' : !tk ? '<p class="muted">Buscando el ticket…</p>' :
      ticketH({ negocio: t, num: tk.num, ts: tk.ts, quien: 'Mesa ' + tk.mesa, atiende: tk.por, lineas: tk.lineas, total: tk.total, pago: tk.pago, recibe: tk.recibe, estado: tk.estado }) + '<button class="sv-btn gris" type="button" data-act="sv2-imprimir">' + I('print') + 'Imprimir o guardar en PDF</button>') + '</div>';
  }
  // Ticket de un pedido hecho por la app (#tk-o-numero)
  function vTicketPedido(r) {
    const m = /^tk-o-(\d+)$/.exec(r); if (!m) return '';
    const o = S().orders.find(x => x.n === +m[1]); if (!o) return '<div class="wrap"><p class="sv2-err">No encontramos ese pedido en este celular.</p></div>';
    const t = LM.T(o.t);
    return '<div class="wrap sv2-tkv">' + ticketH({ negocio: t, num: o.n, ts: o.ts, quien: o.cliN || 'Cliente', lineas: o.items.map(i => ({ n: (LM.PR(i.id) || { n: i.id }).n, q: i.q, p: i.p })), total: o.total, pago: o.pago, estado: { domicilio: 'Domicilio', recoger: 'Para recoger', alla: 'Para comer allá' }[o.modo] || '', qr: urlBase() + '#tk-o-' + o.n }) +
      '<button class="sv-btn gris" type="button" data-act="sv2-imprimir">' + I('print') + 'Imprimir o guardar en PDF</button></div>';
  }

  /* ---------- botón "Arma tu pedido paso a paso" en la tienda de restaurantes ---------- */
  SV.botonPasos = t => ['comida', 'rapida'].includes(t.cat) && menuDe(t.id).length ? '<div class="sv2-pasos-cta"><div><b>Arma tu pedido paso a paso</b><small>Escoge por categorías, mira el resumen tipo factura y escoge cómo pagas.</small></div><button class="sv-btn lima" type="button" data-act="sv2-pasos-cli" data-t="' + esc(t.id) + '">' + I('olla') + 'Empezar</button></div>' : '';

  /* ---------- rutas ---------- */
  const _ruta = E.ruta;
  E.ruta = r => {
    const app = document.getElementById('app');
    if (!/^marcador-/.test(r)) document.body.classList.remove('sv2-modo-tv');
    if (/^marcador-/.test(r)) { app.innerHTML = vMarcador(r); LM.paint(app); return true; }
    if (/^billar-/.test(r)) { app.innerHTML = vUnirse(r); return true; }
    if (r === 'mis-partidas') { app.innerHTML = vMisPartidas(); return true; }
    if (/^tk-o-\d+$/.test(r)) { app.innerHTML = vTicketPedido(r); return true; }
    if (/^tk-/.test(r)) { app.innerHTML = vTicket(r); return true; }
    return _ruta(r);
  };
  // El escáner de la app abre también los QR de mesas, pantallas y tickets
  window.addEventListener('hashchange', () => { if (!/^marcador-/.test((location.hash || '').slice(1))) document.body.classList.remove('sv2-modo-tv'); });
})();
