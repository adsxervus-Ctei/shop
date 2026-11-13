/* Mi Tienda v9 · lo nuevo de las propuestas I y J
   1. La tienda abre de una, sin registrarse. El ingreso sale solo cuando la persona va a pedir,
      chatear o entrar: WhatsApp (código), Google, Facebook, registro con datos básicos o usuario y clave.
   2. Cada cuenta entra a lo suyo: cliente → tienda; dueño → elige negocio o comprar (una sola vez);
      cajero → punto de venta; mesero → mesas; cocina → pantalla de comandas; domiciliario de confianza → domicilios.
   3. Panel: equipo por roles con invitación por WhatsApp, pantalla de cocina, QR de asistencia,
      balance por día / semana / quincena / mes, PQR, más medios de pago y opciones de producto. */
(function () {
  'use strict';
  const LM = window.LM, E = LM.EXT, A = LM.A, F = LM.F;
  const { esc, ic, pesos, toast, sheet, closeModal, hora } = LM;
  const API = () => LM.api || { disponible: false };
  const S = () => LM.S;
  const ses = () => LM.S.session;
  const hoyISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const urlBase = () => location.origin + location.pathname.replace(/index\.html$/, '');
  const soloDig = v => String(v || '').replace(/\D/g, '');

  /* ======================= 0. datos de la versión 9 ======================= */
  function migrar() {
    const s = S(); if (s.v9) return;
    s.tiendas.forEach(t => {
      t.pagos = t.pagos || {};
      if (t.pagos.daviplata == null) t.pagos.daviplata = !!t.pagos.nequi;
      if (t.pagos.breb == null) t.pagos.breb = t.cat !== 'deposito';
      if (!t.daviplata) t.daviplata = t.nequi || '';
      if (!t.breb) t.breb = '@' + t.id;
      if (!t.banco) t.banco = 'Ahorros 000-' + String(100000 + t.id.length * 7919).slice(0, 6) + '-00';
    });
    s.v9 = { pref: {} };
    LM.save();
  }
  function empleadosDemo() {
    const N = LM.NEG('rancho');
    const add = (u, n, rol) => { if (!N.emp.some(e => e.u === u)) N.emp.push({ u, n, rol }); };
    const caj = N.emp.find(e => e.u === 'rancho-cajero'); if (caj && caj.n === 'Mesero de turno') caj.n = 'Karen Ruiz';
    add('rancho-mesera', 'Sofía Pérez', 'Mesero'); add('rancho-cocina', 'Rubén Díaz', 'Cocina'); add('rancho-domi', 'Danto Ruiz', 'Domiciliario');
  }

  /* ======================= 1. entrada sin bloqueo ======================= */
  E.sinGate = () => true; // nunca se tapa la tienda: se ve todo sin cuenta
  const _trasCargar = E.trasCargar || (() => {});
  E.trasCargar = () => {
    if (!S().municipio) { S().municipio = 'hatillo'; S().zona = S().zona || 'cabecera'; LM.save(); }
    try { _trasCargar(); } catch (e) {}
  };
  // Instalar: un aviso pequeño abajo, no una ventana que tape la tienda
  E.bannerInstalar = () => {
    let x = 0; try { x = +localStorage.getItem('mt-banner-x') || 0; } catch (e) {}
    if (Date.now() - x < 3 * 864e5 || document.getElementById('mtInst')) return;
    const b = document.createElement('div');
    b.id = 'mtInst'; b.className = 'mt-inst'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Instalar la app');
    b.innerHTML = '<img src="icons/icon-192.png" alt="" width="40" height="40"><div><b>Instala Mi Tienda</b><small>Ábrela como app, sin la barra del navegador.</small></div><button class="btn b-sm b-fucsia" type="button" data-act="mt-instalar">Instalar</button><button class="mt-inst-x" type="button" data-act="mt-inst-x" aria-label="Cerrar">' + ic('x') + '</button>';
    document.body.appendChild(b); LM.paint(b);
  };
  A['mt-instalar'] = () => { const b = document.getElementById('mtInst'); if (b) b.remove(); LM.instShow(true); };
  A['mt-inst-x'] = () => { const b = document.getElementById('mtInst'); if (b) b.remove(); try { localStorage.setItem('mt-banner-x', String(Date.now())); } catch (e) {} };

  /* ======================= 2. hoja de ingreso ======================= */
  const lg = { modo: 'inicio', tel: '', codigo: '', prueba: '', provs: null, err: '', cargando: false };
  async function proveedores() {
    if (lg.provs) return lg.provs;
    const cfg = window.HM_CONFIG || {};
    lg.provs = { google: !!cfg.googleClientId, google_client_id: cfg.googleClientId || '', facebook: false, facebook_app_id: '', whatsapp: false, servidor: false };
    try { if (API().listo) await API().listo; } catch (e) {}
    if (API().disponible) {
      try { const d = await API().get('/api/auth/proveedores'); lg.provs = Object.assign(lg.provs, d, { servidor: true, google: d.google || !!cfg.googleClientId, google_client_id: d.google_client_id || cfg.googleClientId || '' }); } catch (e) {}
    }
    return lg.provs;
  }
  E.login = err => {
    if (err) lg.err = err;
    if (lg.modo !== 'inicio' && !lg.abierto) lg.modo = 'inicio';
    lg.abierto = true;
    pintarLogin();
    if (!lg.provs) proveedores().then(() => { if (document.querySelector('.mt-login')) pintarLogin(); });
  };
  const titulo = { inicio: 'Para seguir, entra a Mi Tienda', wa: 'Entra con tu WhatsApp', 'wa-nombre': 'Ya casi: ¿cómo te llamas?', crear: 'Crea tu cuenta', usuario: 'Entra con tu correo o celular', recuperar: 'Recupera tu contraseña', 'rec-codigo': 'Escribe el código y tu clave nueva' };
  function pintarLogin() {
    const p = lg.provs || {};
    let cuerpo = '';
    const errH = lg.err ? '<p class="err" role="alert">' + lg.err + '</p>' : '';
    const atras = '<button class="b-ghost btn" type="button" data-act="mt-lmodo" data-m="inicio">' + ic('chevl') + 'Otras formas de entrar</button>';
    if (lg.modo === 'inicio') {
      cuerpo = '<p class="muted" style="margin:0">Mira todo lo que quieras sin cuenta. Para pedir, chatear o seguir tu domicilio, entra con una de estas opciones. Tu carrito queda guardado.</p>' + errH +
        '<div class="mt-provs">' +
        (p.google ? '<div id="mtGoogle" class="mt-gwrap"><button class="btn mt-prov" type="button" data-act="mt-google">' + LOGOS.g + '<span>Continuar con Google</span></button></div>' : '<button class="btn mt-prov" type="button" data-act="mt-prov-off" data-p="Google">' + LOGOS.g + '<span>Continuar con Google</span></button>') +
        (p.facebook ? '<button class="btn mt-prov" type="button" data-act="mt-facebook">' + LOGOS.f + '<span>Continuar con Facebook</span></button>' : '<button class="btn mt-prov" type="button" data-act="mt-prov-off" data-p="Facebook">' + LOGOS.f + '<span>Continuar con Facebook</span></button>') +
        '<button class="btn mt-prov" type="button" data-act="mt-lmodo" data-m="wa">' + LOGOS.w + '<span>Continuar con WhatsApp</span></button>' +
        '</div>' +
        '<div class="mt-o"><span>o</span></div>' +
        '<button class="btn b-fucsia b-lg" type="button" data-act="mt-lmodo" data-m="crear">' + ic('user') + 'Registrarme con mis datos</button>' +
        '<p class="mt-ya">¿Ya tienes cuenta con correo? <button class="link" type="button" data-act="mt-lmodo" data-m="usuario">Ingresar</button></p>' +
        '<details class="mt-demo"><summary>Cuentas de demostración (clave 1234)</summary><div class="demo-l">' +
        [['maria', 'Cliente · María de Chimí'], ['rancho', 'Dueño · Rancho Costeño'], ['rancho-cajero', 'Cajera · Karen (Rancho)'], ['rancho-mesera', 'Mesera · Sofía (Rancho)'], ['rancho-cocina', 'Cocina · Rubén (Rancho)'], ['rancho-domi', 'Domiciliario de confianza · Danto (Rancho)'], ['drogueria', 'Dueña · Droguería'], ['billar', 'Dueño · Billar'], ['barberia', 'Dueño · Barbería'], ['taller', 'Dueño · Taller'], ['ropa', 'Dueña · Ropa'], ['agro', 'Dueña · Agro'], ['granero', 'Dueña · Granero por mayor'], ['ferreteria', 'Dueño · Ferretería'], ['pescadores', 'Asociación de pescadores'], ['quesera', 'Dueña · Quesera'], ['distribuidora', 'Dueña · Distribuidora'], ['granja', 'Dueña · Granja']]
          .map(d => '<button type="button" data-act="mt-demo" data-u="' + d[0] + '">' + esc(d[1]) + '</button>').join('') + '</div></details>' +
        '<p class="muted mt-legal">Al continuar aceptas los <a href="privacidad.html" target="_blank" rel="noopener">términos y la política de tratamiento de datos</a>.</p>' +
        (E.loginExtra ? E.loginExtra(false) : '');
    } else if (lg.modo === 'wa') {
      cuerpo = (!lg.codigo && !lg.enviado ?
        '<form class="stack" data-form="mt-wa-tel"><p class="muted" style="margin:0">Te enviamos un código de 6 números por WhatsApp. No necesitas clave.</p><div class="campo"><label for="mtWaT">Tu número de WhatsApp</label><div class="inline"><span class="mt-57">+57</span><input id="mtWaT" name="t" inputmode="tel" autocomplete="tel" required placeholder="300 000 0000" value="' + esc(lg.tel) + '"></div></div>' + errH +
        '<button class="btn b-fucsia b-lg" type="submit"' + (lg.cargando ? ' disabled' : '') + '>' + LOGOS.w + 'Enviarme el código</button></form>'
        :
        '<form class="stack" data-form="mt-wa-cod"><div class="aviso ok">' + ic('check') + '<span>Código enviado al ' + esc(lg.tel.replace(/(\d{3})(\d{3})(\d{4})/, '$1 ••• $3')) + '.</span></div>' +
        (lg.prueba ? '<div class="aviso warn">' + ic('alert') + '<span><b>Modo de prueba:</b> el servidor todavía no está conectado a WhatsApp, así que el código sale aquí: <b class="num" id="mtCodPrueba">' + esc(lg.prueba) + '</b>. En producción llega por WhatsApp.</span></div>' : '') +
        '<div class="campo"><label for="mtWaC">Escribe el código</label><input id="mtWaC" name="c" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required class="mt-codigo" placeholder="••••••"></div>' + errH +
        '<button class="btn b-fucsia b-lg" type="submit"' + (lg.cargando ? ' disabled' : '') + '>Entrar</button><button class="b-ghost btn" type="button" data-act="mt-wa-otro">Cambiar el número</button></form>') + atras;
    } else if (lg.modo === 'wa-nombre') {
      cuerpo = '<form class="stack" data-form="mt-wa-nombre"><p class="muted" style="margin:0">Es la primera vez que entras con el ' + esc(lg.tel) + '. Solo falta tu nombre.</p>' +
        '<div class="campo"><label for="mtWaN">Nombre y apellido</label><input id="mtWaN" name="n" required autocomplete="name"></div>' +
        '<div class="campo"><label for="mtWaE">Correo (opcional)</label><input id="mtWaE" name="e" type="email" autocomplete="email"></div>' +
        '<label class="mt-ck"><input type="checkbox" name="h" required> Acepto los términos y autorizo el tratamiento de mis datos (Ley 1581 de 2012).</label>' + errH +
        '<button class="btn b-fucsia b-lg" type="submit"' + (lg.cargando ? ' disabled' : '') + '>Crear mi cuenta y entrar</button></form>';
    } else if (lg.modo === 'crear') {
      cuerpo = '<form class="stack" data-form="mt-crear"><p class="muted" style="margin:0">Solo lo necesario para que el negocio y el domiciliario te encuentren.</p>' +
        '<div class="campo"><label for="mtCn">Nombre y apellido</label><input id="mtCn" name="n" required autocomplete="name" placeholder="Como te dicen en el pueblo"></div>' +
        '<div class="campo"><label for="mtCc">Celular (WhatsApp)</label><input id="mtCc" name="c" inputmode="tel" required autocomplete="tel" placeholder="300 000 0000"></div>' +
        '<div class="campo"><label for="mtCe">Correo (opcional)</label><input id="mtCe" name="e" type="email" autocomplete="email"></div>' +
        '<div class="campo"><label for="mtCd">Dirección de entrega</label><input id="mtCd" name="d" placeholder="Barrio, calle, referencia"></div>' +
        '<div class="campo"><label for="mtCz">Zona</label><select id="mtCz" name="z"><option value="cabecera">Hatillo cabecera</option><option value="chimi">Chimí</option><option value="sanmartin">San Martín de Loba</option><option value="barranco">Barranco de Loba</option></select></div>' +
        '<div class="campo"><label for="mtCp">Crea una clave (mínimo 4)</label><input id="mtCp" name="p" type="password" minlength="4" required autocomplete="new-password"></div>' +
        '<label class="mt-ck"><input type="checkbox" name="h" required> Acepto los términos y autorizo el tratamiento de mis datos (Ley 1581 de 2012).</label>' + errH +
        '<button class="btn b-fucsia b-lg" type="submit"' + (lg.cargando ? ' disabled' : '') + '>Crear mi cuenta</button></form>' + atras;
    } else {
      cuerpo = '<form class="stack" data-form="mt-usuario"><div class="campo"><label for="mtUu">Usuario, celular o correo</label><input id="mtUu" name="u" required autocomplete="username"></div>' +
        '<div class="campo"><label for="mtUp">Clave</label><input id="mtUp" name="p" type="password" required autocomplete="current-password"></div>' + errH +
        '<button class="btn b-fucsia b-lg" type="submit"' + (lg.cargando ? ' disabled' : '') + '>' + ic('lock') + 'Entrar</button>' +
        '<button class="link mt-olvide" type="button" data-act="mt-lmodo" data-m="recuperar">¿Olvidaste tu contraseña?</button>' +
        '<p class="muted" style="margin:0;font-size:13px">Clientes, dueños, cajeros, meseros, cocina y domiciliarios entran por aquí: Mi Tienda reconoce la cuenta y abre lo que le toca.</p></form>' + atras;
    }
    if (lg.modo === 'recuperar') {
      cuerpo = '<form class="stack" data-form="mt-rec-pedir"><p class="muted" style="margin:0">Escribe el correo o el celular con el que te registraste. Te mandamos un código de 6 números para que crees una clave nueva.</p>' +
        '<div class="campo"><label for="mtRd">Correo o celular</label><input id="mtRd" name="d" required autocomplete="username" value="' + esc(lg.recDato || '') + '" placeholder="tucorreo@gmail.com o 300 000 0000"></div>' +
        '<fieldset class="fs"><legend>¿Por dónde te lo enviamos?</legend><div class="mt-canal">' +
        '<label><input type="radio" name="c" value="correo"' + (lg.recCanal !== 'whatsapp' ? ' checked' : '') + '><span>' + LOGOS.m + '<b>Al correo</b><small>El que registraste</small></span></label>' +
        '<label><input type="radio" name="c" value="whatsapp"' + (lg.recCanal === 'whatsapp' ? ' checked' : '') + '><span>' + LOGOS.w + '<b>Al WhatsApp</b><small>Al celular registrado</small></span></label></div></fieldset>' + errH +
        '<button class="btn b-fucsia b-lg" type="submit"' + (lg.cargando ? ' disabled' : '') + '>Enviarme el código</button></form>' +
        '<button class="b-ghost btn" type="button" data-act="mt-lmodo" data-m="usuario">' + ic('chevl') + 'Volver a ingresar</button>';
    } else if (lg.modo === 'rec-codigo') {
      cuerpo = '<form class="stack" data-form="mt-rec-cambiar"><div class="aviso ok">' + ic('check') + '<span>Si hay una cuenta con ese dato, enviamos el código ' + (lg.recCanal === 'whatsapp' ? 'al WhatsApp registrado' : 'al correo registrado') + (lg.recA ? ' (' + esc(lg.recA) + ')' : '') + '. Vence en 10 minutos.</span></div>' +
        (lg.prueba ? '<div class="aviso warn">' + ic('alert') + '<span><b>Modo de prueba:</b> el servidor todavía no tiene conectado el ' + (lg.recCanal === 'whatsapp' ? 'WhatsApp' : 'correo') + ', así que el código sale aquí: <b class="num" id="mtRecPrueba">' + esc(lg.prueba) + '</b>.</span></div>' : '') +
        '<div class="campo"><label for="mtRc">Código</label><input id="mtRc" name="c" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required class="mt-codigo" placeholder="••••••"></div>' +
        '<div class="campo"><label for="mtRp">Clave nueva (mínimo 4)</label><input id="mtRp" name="p" type="password" minlength="4" required autocomplete="new-password"></div>' + errH +
        '<button class="btn b-fucsia b-lg" type="submit"' + (lg.cargando ? ' disabled' : '') + '>Guardar la clave y entrar</button></form>' +
        '<button class="b-ghost btn" type="button" data-act="mt-lmodo" data-m="recuperar">' + ic('chevl') + 'Pedir otro código</button>';
    }
    sheet('<div class="sh-h"><div class="tt"><small>Mi Tienda</small><h3>' + titulo[lg.modo] + '</h3></div><button class="x" type="button" data-act="mt-lcerrar" aria-label="Cerrar">' + ic('x') + '</button></div><div class="sh-b stack mt-login">' + cuerpo + '</div>', '', 'login');
    if (lg.modo === 'inicio' && lg.provs && lg.provs.google && lg.provs.google_client_id) montarGoogle();
    const f = document.querySelector('.mt-login input'); if (f && lg.modo !== 'inicio') f.focus();
  }
  const LOGOS = {
    g: '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2.1 5-4.4 6.6v5.5h7.1C42.6 36.7 45 31.1 45 24.5z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.5 46 24 46z"/><path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.7H4.5A22 22 0 0 0 2 24c0 3.5.8 6.9 2.5 9.9z"/><path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.5 2 8.1 6.9 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9 12.2-9z"/></svg>',
    f: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path d="M13.4 19.5v-6h2l.3-2.4h-2.3V9.6c0-.7.2-1.2 1.2-1.2h1.2V6.3c-.2 0-1-.1-1.8-.1-1.8 0-3 1.1-3 3.1v1.8H9v2.4h2v6z" fill="#fff"/></svg>',
    m: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="3" fill="#0D5C63"/><path d="m2.5 6.5 9.5 7 9.5-7" fill="none" stroke="#fff" stroke-width="1.8"/></svg>',
    w: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#25D366"/><path d="M12 5.2a6.7 6.7 0 0 0-5.8 10.1L5.3 18.7l3.5-.9A6.7 6.7 0 1 0 12 5.2z" fill="#fff"/><path d="M9.6 8.6c.2-.1.4-.1.5.1l.7 1.5c.1.2 0 .4-.1.5l-.4.5c.4.9 1.2 1.7 2.2 2.2l.5-.5c.1-.1.3-.2.5-.1l1.5.7c.2.1.2.3.2.5-.1.8-.8 1.4-1.6 1.4-2.4-.2-4.6-2.4-4.8-4.8 0-.6.4-1.3.8-2z" fill="#25D366"/></svg>'
  };
  const modo = m => { lg.modo = m; lg.err = ''; pintarLogin(); };
  A['mt-lmodo'] = el => { if (el.dataset.m === 'wa') { lg.enviado = false; lg.codigo = ''; lg.prueba = ''; } modo(el.dataset.m); };
  A['mt-lcerrar'] = () => { lg.abierto = false; lg.modo = 'inicio'; lg.err = ''; closeModal(); };
  A['mt-wa-otro'] = () => { lg.enviado = false; lg.prueba = ''; modo('wa'); };
  A['mt-demo'] = el => { entrarConClave(el.dataset.u, '1234'); };
  A['mt-prov-off'] = el => { lg.err = 'El ingreso con ' + esc(el.dataset.p) + ' se activa cuando el administrador lo configure (ver CONFIGURACION-PLATAFORMAS.md). Mientras tanto entra con WhatsApp, con tus datos o con tu correo.'; pintarLogin(); };
  // --- recuperar la contraseña: código al correo o al WhatsApp registrado ---
  F['mt-rec-pedir'] = async (f, d) => {
    lg.recDato = String(d.get('d') || '').trim(); lg.recCanal = d.get('c') === 'whatsapp' ? 'whatsapp' : 'correo';
    if (lg.recDato.length < 5) { lg.err = 'Escribe tu correo o tu celular.'; pintarLogin(); return; }
    if (!API().disponible) { lg.err = 'Recuperar la contraseña necesita el servidor de Mi Tienda. En la demostración la clave de todas las cuentas es 1234.'; pintarLogin(); return; }
    lg.cargando = true; lg.err = ''; pintarLogin();
    try { const r = await API().post('/api/auth/recuperar/pedir', { dato: lg.recDato, canal: lg.recCanal }); lg.prueba = r.prueba ? r.codigo : ''; lg.recA = r.a || ''; lg.cargando = false; modo('rec-codigo'); }
    catch (e) { lg.cargando = false; lg.err = esc(e.message); pintarLogin(); }
  };
  F['mt-rec-cambiar'] = async (f, d) => {
    lg.cargando = true; lg.err = ''; pintarLogin();
    try { const r = await API().post('/api/auth/recuperar/cambiar', { dato: lg.recDato, codigo: soloDig(d.get('c')), clave: String(d.get('p') || '') }); lg.cargando = false; lg.prueba = ''; toast('Listo: tu clave quedó cambiada.'); entrarPorServidor(r.usuario, ''); }
    catch (e) { lg.cargando = false; lg.err = esc(e.message); pintarLogin(); }
  };

  // --- WhatsApp ---
  F['mt-wa-tel'] = async (f, d) => {
    const tel = soloDig(d.get('t')).replace(/^57(?=3\d{9}$)/, '');
    if (!/^3\d{9}$/.test(tel)) { lg.err = 'El celular debe tener 10 números y empezar por 3.'; pintarLogin(); return; }
    lg.tel = tel;
    if (!API().disponible) { lg.err = 'Entrar con WhatsApp necesita el servidor de Mi Tienda. Cuando la app esté publicada con su servidor, funciona.'; pintarLogin(); return; }
    lg.cargando = true; pintarLogin();
    try { const r = await API().post('/api/auth/whatsapp/codigo', { telefono: tel }); lg.enviado = true; lg.prueba = r.prueba ? r.codigo : ''; lg.err = ''; }
    catch (e) { lg.err = esc(e.message); }
    lg.cargando = false; pintarLogin();
  };
  F['mt-wa-cod'] = async (f, d) => {
    lg.codigo = soloDig(d.get('c')); lg.cargando = true; lg.err = ''; pintarLogin();
    try {
      const r = await API().post('/api/auth/whatsapp/verificar', { telefono: lg.tel, codigo: lg.codigo });
      lg.cargando = false;
      if (r.nuevo) { modo('wa-nombre'); return; }
      entrarPorServidor(r.usuario, 'WhatsApp');
    } catch (e) { lg.cargando = false; lg.codigo = ''; lg.err = esc(e.message); pintarLogin(); }
  };
  F['mt-wa-nombre'] = async (f, d) => {
    lg.cargando = true; pintarLogin();
    try {
      const r = await API().post('/api/auth/whatsapp/verificar', { telefono: lg.tel, codigo: lg.codigo, nombre: String(d.get('n') || '').trim(), correo: String(d.get('e') || '').trim(), acepta_datos: !!d.get('h') });
      lg.cargando = false; entrarPorServidor(r.usuario, 'WhatsApp');
    } catch (e) { lg.cargando = false; lg.err = esc(e.message); pintarLogin(); }
  };

  // --- Google (Google Identity Services) ---
  function montarGoogle() {
    const w = document.getElementById('mtGoogle'); if (!w || w.dataset.ok) return;
    const run = () => {
      try {
        google.accounts.id.initialize({ client_id: lg.provs.google_client_id, callback: r => credGoogle(r.credential) });
        w.innerHTML = ''; google.accounts.id.renderButton(w, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: Math.min(360, w.clientWidth || 320), locale: 'es' }); w.dataset.ok = 1;
      } catch (e) {}
    };
    if (window.google && google.accounts) run();
    else if (!document.getElementById('gsiScript')) { const sc = document.createElement('script'); sc.id = 'gsiScript'; sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true; sc.onload = run; document.head.appendChild(sc); }
  }
  A['mt-google'] = () => { lg.err = 'El botón de Google está cargando. Si no aparece, revisa tu conexión.'; pintarLogin(); };
  async function credGoogle(jwt) {
    if (lg.provs.servidor) {
      try { const r = await API().post('/api/auth/google', { credential: jwt }); entrarPorServidor(r.usuario, 'Google'); }
      catch (e) { lg.err = esc(e.message); pintarLogin(); }
      return;
    }
    // Sin servidor (solo demostración): se lee el nombre del token sin comprobarlo
    try { const p = JSON.parse(decodeURIComponent(escape(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))); LM.entrarCliente({ usuario: String(p.email).toLowerCase(), nombre: p.name || p.email, correo: p.email, foto: p.picture || '', via: 'Google' }); }
    catch (e) { lg.err = 'No se pudo leer la cuenta de Google.'; pintarLogin(); }
  }

  // --- Facebook (SDK de JavaScript) ---
  A['mt-facebook'] = () => {
    const ir = () => FB.login(r => {
      if (!r.authResponse) { lg.err = 'No terminaste de entrar con Facebook.'; pintarLogin(); return; }
      API().post('/api/auth/facebook', { accessToken: r.authResponse.accessToken }).then(d => entrarPorServidor(d.usuario, 'Facebook')).catch(e => { lg.err = esc(e.message); pintarLogin(); });
    }, { scope: 'public_profile,email' });
    if (window.FB) { ir(); return; }
    window.fbAsyncInit = () => { FB.init({ appId: lg.provs.facebook_app_id, cookie: false, xfbml: false, version: 'v21.0' }); ir(); };
    const sc = document.createElement('script'); sc.src = 'https://connect.facebook.net/es_LA/sdk.js'; sc.async = true; sc.crossOrigin = 'anonymous'; document.head.appendChild(sc);
  };

  // --- registro con datos básicos ---
  F['mt-crear'] = async (f, d) => {
    const nombre = String(d.get('n') || '').trim(), cel = soloDig(d.get('c')), clave = String(d.get('p') || '');
    if (nombre.length < 3) { lg.err = 'Escribe tu nombre completo.'; pintarLogin(); return; }
    if (!/^3\d{9}$/.test(cel)) { lg.err = 'El celular debe tener 10 números y empezar por 3.'; pintarLogin(); return; }
    const dirs = d.get('d') ? [{ n: 'Casa', d: String(d.get('d')), z: d.get('z') }] : [];
    if (API().disponible) {
      lg.cargando = true; pintarLogin();
      try {
        const r = await API().post('/api/auth/registro', { nombre, telefono: cel, clave, correo: String(d.get('e') || '').trim(), acepta_datos: true });
        API().yo = r.usuario; lg.cargando = false;
        LM.entrarCliente({ usuario: cel, nombre, cel: d.get('c'), correo: String(d.get('e') || ''), dirs, via: 'registro' });
      } catch (e) { lg.cargando = false; lg.err = esc(e.message); pintarLogin(); }
      return;
    }
    LM.entrarCliente({ usuario: cel, nombre, cel: d.get('c'), correo: String(d.get('e') || ''), dirs, via: 'registro' });
  };

  // --- usuario y clave: la app reconoce si es cliente, negocio o repartidor ---
  F['mt-usuario'] = (f, d) => entrarConClave(String(d.get('u') || ''), String(d.get('p') || ''));
  function negocioLocal(u) {
    u = String(u || '').trim().toLowerCase();
    const tid = u.replace(/-(cajer[oa]|meser[oa]|cocina|domi|atencion)\d*$/, '');
    const t = LM.T(tid); if (!t) return null;
    return LM.NEG(tid).emp.find(e => e.u === u) ? tid : null;
  }
  async function entrarConClave(u, p) {
    const ul = String(u || '').trim().toLowerCase();
    lg.modo = 'usuario';
    if (negocioLocal(ul) && p === '1234') { LM.loginNeg(ul, p); return; }
    const yo = S().user || {};
    if ((ul === String(yo.usuario || '').toLowerCase() || ul === soloDig(yo.cel)) && p === '1234') { LM.loginCli(ul, p); return; }
    if (API().disponible) {
      lg.abierto = true; lg.cargando = true; pintarLogin();
      try { const yoS = await API().entrar(ul, p); lg.cargando = false; entrarPorServidor(yoS, null); return; }
      catch (e) { lg.cargando = false; lg.err = esc(e.message); pintarLogin(); return; }
    }
    // Sin servidor: si parece un usuario de negocio, el mensaje lo da la entrada de negocios (p. ej. "fue eliminado")
    const tid = ul.replace(/-(cajer[oa]|meser[oa]|cocina|domi|atencion)\d*$/, '');
    if (LM.T(tid)) { lg.abierto = true; LM.loginNeg(ul, p); return; }
    lg.abierto = true; lg.err = 'Usuario o clave incorrectos. Prueba con una cuenta de demostración.'; pintarLogin();
  }

  // Al entrar (por cualquier camino) la hoja de ingreso vuelve a empezar desde el inicio
  const reiniciarLg = () => { lg.abierto = false; lg.modo = 'inicio'; lg.err = ''; lg.enviado = false; lg.prueba = ''; lg.codigo = ''; };
  const _trasLogin = E.trasLogin; E.trasLogin = (...a) => { reiniciarLg(); return _trasLogin(...a); };
  const _entrarCliente = LM.entrarCliente; LM.entrarCliente = o => { reiniciarLg(); return _entrarCliente(o); };
  // Entró por el servidor: según su perfil va a su negocio, al modo repartidor o a la tienda
  const ROL_SRV = { dueno: 'dueno', cajero: 'cajero', mesero: 'mesero', cocina: 'cocina', domiciliario: 'domi', atencion: 'atencion' };
  function entrarPorServidor(yo, via) {
    lg.abierto = false; lg.modo = 'inicio'; lg.err = '';
    if (API()) API().yo = yo;
    const negs = (yo.negocios || []).filter(n => LM.T(n.id));
    if (negs.length) {
      const n = negs[0];
      S().session = { rol: ROL_SRV[n.rol] || 'cajero', t: n.id, u: yo.usuario || yo.telefono || ('u' + yo.id), nombre: yo.nombre, cargo: n.cargo || '' };
      S().manual[n.id] = true; LM.save(); closeModal(); E.irSegunRol(); toast('Hola, ' + String(yo.nombre).split(' ')[0]); return;
    }
    if (yo.repartidor && yo.repartidor.estado_aprobacion === 'aprobado' && yo.repartidor.modo_actual === 'trabajo') { closeModal(); LM.go('rep'); return; }
    LM.entrarCliente({ usuario: yo.usuario || yo.telefono || ('u' + yo.id), nombre: yo.nombre, cel: yo.telefono || '', via: via || '' });
  }

  /* ======================= 3. cada rol a lo suyo ======================= */
  E.rolDe = r => ({ 'Dueño': 'dueno', Cajero: 'cajero', Mesero: 'mesero', Cocina: 'cocina', Domiciliario: 'domi', 'Atención': 'atencion' })[r] || 'cajero';
  E.rolNombre = r => ({ dueno: 'Dueño', cajero: 'Cajero(a)', mesero: 'Mesero(a)', cocina: 'Cocina', domi: 'Domiciliario de confianza', admin: 'Administración' })[r] || 'Equipo';
  E.permitidas = (rol, t, extra) => {
    const h = (LM.TIPOS[t.cat] || {}).herramienta, herr = h ? [h[0]] : [];
    const m = {
      cajero: ['pos', 'caja', 'pedidos', 'gastos', 'domicilios', 'asistencia'].concat(extra),
      mesero: (EXT_MESAS(t) ? ['mesas'] : []).concat(herr.filter(k => k !== 'mesas'), ['pedidos', 'asistencia']),
      cocina: ['cocina', 'asistencia'],
      domi: ['domicilios', 'asistencia']
    };
    return m[rol] || ['pedidos', 'caja'].concat(extra);
  };
  const EXT_MESAS = t => !!E.panelFn.mesas && ['comida', 'rapida', 'billar'].includes(t.cat);
  E.irSegunRol = () => {
    const s = ses(); if (!s) return;
    if (s.rol === 'dueno') {
      const pref = (S().v9 && S().v9.pref || {})[s.t];
      if (!pref) { selectorDueno(); return; }
      LM.go(pref === 'comprar' ? 'inicio' : 'panel'); return;
    }
    const t = LM.T(s.t), dest = { cajero: 'panel-pos', mesero: EXT_MESAS(t) ? 'panel-mesas' : 'panel-pedidos', cocina: 'panel-cocina', domi: 'panel-domicilios' }[s.rol] || 'panel-pedidos';
    LM.go(dest);
  };
  function selectorDueno() {
    const s = ses(), t = LM.T(s.t);
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(t.n) + '</small><h3>¿A dónde entras?</h3></div></div><div class="sh-b stack">' +
      '<button class="mt-elige on" type="button" data-act="mt-pref" data-p="negocio"><span class="av">' + LM.logoH(t) + '</span><span><b>' + esc(t.n) + '</b><small>Mi negocio · tablero de hoy</small></span></button>' +
      '<button class="mt-elige" type="button" data-act="mt-pref" data-p="comprar"><span class="av">' + ic('bolsa') + '</span><span><b>Comprar en Mi Tienda</b><small>Como cualquier cliente</small></span></button>' +
      '<p class="muted" style="margin:0;font-size:13px">Esta pregunta sale una sola vez. Después la app abre directo donde escogiste; lo cambias desde "Mi cuenta" o el panel.</p></div>', '', 'pref');
  }
  A['mt-pref'] = el => {
    const s = ses(); S().v9.pref[s.t] = el.dataset.p; LM.save(); closeModal();
    if (el.dataset.p === 'comprar') { comoCliente(); return; }
    LM.go('panel');
  };
  // El dueño compra como cliente sin perder su negocio: un toque para volver
  function comoCliente() {
    const s = ses(); const t = s.t;
    S().session = { rol: 'cliente', u: s.u, negocioDe: t, rolNeg: s.rol };
    if (!S().user || S().user.usuario !== s.u) S().user = Object.assign({ usuario: s.u, nombre: s.nombre || LM.NEG(t).emp[0].n, cel: '', dirs: [], favT: [], favP: [], fiados: [] }, {});
    LM.save(); LM.updHeader(); LM.go('inicio'); toast('Estás comprando como cliente. Vuelve a tu negocio con el botón de abajo.');
  }
  A['mt-a-comprar'] = () => { comoCliente(); };
  A['mt-volver-neg'] = () => { const s = ses(); if (!s || !s.negocioDe) return; S().session = { rol: s.rolNeg || 'dueno', t: s.negocioDe, u: s.u }; LM.save(); LM.go('panel'); };
  function chipVolver() {
    let c = document.getElementById('mtVolver'); const s = ses();
    if (!s || !s.negocioDe) { if (c) c.remove(); return; }
    if (!c) { c = document.createElement('button'); c.id = 'mtVolver'; c.type = 'button'; c.className = 'mt-volver'; c.dataset.act = 'mt-volver-neg'; document.body.appendChild(c); }
    c.innerHTML = ic('tienda') + 'Volver a ' + esc(LM.T(s.negocioDe).n); LM.paint(c);
  }

  /* ======================= 4. menú del panel ======================= */
  const _items = E.panelItems;
  E.panelItems = (items, t, caj) => {
    items = _items(items, t, caj);
    const N = LM.NEG(t.id), i = items.findIndex(x => x[0] === 'empleados');
    items.splice(i >= 0 ? i + 1 : items.length, 0, ['asistencia', 'qr', caj ? 'Marcar asistencia' : 'QR y asistencia']);
    const ir = items.findIndex(x => x[0] === 'resenas');
    items.splice(ir >= 0 ? ir + 1 : items.length, 0, ['pqr', 'chat', 'PQR', (N.pqr || []).filter(p => p.estado === 'abierta').length || undefined]);
    if (['comida', 'rapida'].includes(t.cat)) { const ip = items.findIndex(x => x[0] === 'pedidos'); items.splice(ip + 1, 0, ['cocina', 'olla', 'Pantalla de cocina', cocinaPend(t).length || undefined]); }
    return items;
  };

  /* ======================= 5. pantalla de cocina ======================= */
  const K = { srv: {}, cargando: {}, t: 0 };
  const minDe = ts => Math.max(0, Math.floor((Date.now() - ts) / 60000));
  function cocinaPend(t) {
    const N = LM.NEG(t.id); N.cocina = N.cocina || {};
    const out = [];
    LM.S.orders.filter(o => o.t === t.id && !o.rech && !o.cola && o.e >= 1 && o.e < LM.fin(o) && !(N.cocina['o' + o.n] && N.cocina['o' + o.n].listo)).forEach(o => {
      out.push({ k: 'o' + o.n, origen: o.modo === 'domicilio' ? '#' + o.n + ' Domicilio' : o.modo === 'alla' ? '#' + o.n + ' En el local' : '#' + o.n + ' Para recoger', tipo: o.modo === 'domicilio' ? 'dom' : 'loc',
        items: o.items.map(i => ({ q: i.q, n: (LM.PR(i.id) || {}).n || i.id, nota: o.nota || '' })), quien: o.cliN || o.cli, ts: o.te || o.ts });
    });
    (K.srv[t.id] || []).forEach(m => m.eventos.filter(e => e.cocina === 'en_cocina' && e.estado === 'ok').forEach(e => {
      out.push({ k: 'm' + e.id, origen: m.mesa, tipo: 'mesa', items: [{ q: '', n: e.texto, nota: '' }], quien: e.pedido_por ? 'Pidió ' + e.pedido_por + ' (QR)' : 'Mesera', ts: Date.parse(e.creado), mesa: m.id, ev: e.id }); }));
    return out.sort((a, b) => a.ts - b.ts);
  }
  async function cargarCocina(t) {
    if (!(API().disponible && API().yo && API().esDeNegocio(t.id)) || K.cargando[t.id]) return;
    K.cargando[t.id] = true;
    try { const d = await API().get('/api/negocio/' + t.id + '/mesas'); K.srv[t.id] = (d.mesas || []).filter(m => m.tipo === 'restaurante' && m.estado === 'abierta'); } catch (e) {}
    K.cargando[t.id] = false;
    if (/^panel-cocina/.test(location.hash.slice(1))) LM.rerender();
  }
  function pCocina(t, N) {
    N.cocina = N.cocina || {}; N.minAtraso = N.minAtraso || 10;
    if (Date.now() - K.t > 15000) { K.t = Date.now(); cargarCocina(t); }
    const ls = cocinaPend(t);
    const estado = c => { const st = N.cocina[c.k] || {}; if (minDe(c.ts) >= N.minAtraso) return 'atrasado'; return st.prep ? 'prep' : 'nuevo'; };
    const atras = ls.filter(c => estado(c) === 'atrasado').length;
    return '<div class="mt-kds">' + LM.head('Cocina · ' + esc(t.n), ls.length + ' comandas' + (atras ? ' · <b style="color:var(--rojo)">' + atras + ' atrasada' + (atras > 1 ? 's' : '') + '</b>' : '') + '. Toca una comanda para empezarla; al terminar, LISTO.',
      '<button class="btn b-sm" type="button" data-act="mt-kds-full">' + ic('grid') + 'Pantalla completa</button>') +
      (ls.length ? '<div class="mt-kds-grid">' + ls.map(c => {
        const e = estado(c);
        return '<article class="mt-cmd ' + e + '" data-act="mt-kds-prep" data-k="' + c.k + '" tabindex="0"><header><b>' + esc(c.origen) + '</b><span class="num">' + ic('clock') + minDe(c.ts) + ' min</span></header><ul>' +
          c.items.map(i => '<li><b>' + (i.q ? esc(i.q) + '×' : '') + '</b> ' + esc(i.n) + (i.nota ? '<small>' + esc(i.nota) + '</small>' : '') + '</li>').join('') + '</ul><footer><small>' + esc(c.quien || '') + '</small>' +
          '<button class="btn b-sm b-monte" type="button" data-act="mt-kds-listo" data-k="' + c.k + '"' + (c.mesa ? ' data-m="' + c.mesa + '" data-e="' + c.ev + '"' : '') + '>' + ic('check') + 'LISTO</button></footer></article>';
      }).join('') + '</div>' : '<div class="vacio">' + ic('olla') + ' No hay comandas pendientes. Lo que pidan las mesas y los pedidos aceptados aparece aquí.</div>') +
      '<p class="mt-kds-ley"><i class="nuevo"></i>Recién llegada <i class="prep"></i>Preparando <i class="atrasado"></i>Atrasada (más de ' + N.minAtraso + ' min)</p>' +
      (ses().rol === 'dueno' ? '<form class="box inline" data-form="mt-kds-min"><label>Una comanda se pone roja a los <input name="m" type="number" min="3" max="90" value="' + N.minAtraso + '" style="max-width:80px"> minutos</label><button class="btn b-sm" type="submit">Guardar</button></form>' : '') + '</div>';
  }
  pCocina.v9 = true; pCocina.cajero = true;
  E.panelFn.cocina = pCocina;
  A['mt-kds-prep'] = (el, ev) => { if (ev && ev.target && ev.target.closest('[data-act="mt-kds-listo"]')) return; const N = LM.NEG(ses().t); N.cocina = N.cocina || {}; const st = N.cocina[el.dataset.k] = N.cocina[el.dataset.k] || {}; st.prep = !st.prep; LM.save(); LM.rerender(); };
  A['mt-kds-listo'] = async el => {
    const t = LM.T(ses().t), N = LM.NEG(t.id), k = el.dataset.k;
    if (el.dataset.m) {
      try { await API().post('/api/negocio/' + t.id + '/mesas/' + el.dataset.m + '/eventos/' + el.dataset.e + '/servido'); K.t = 0; } catch (e) { toast(e.message); return; }
    }
    N.cocina[k] = Object.assign(N.cocina[k] || {}, { listo: Date.now() });
    LM.logN(t.id, 'Cocina marcó LISTO: ' + k.replace(/^o/, 'pedido #'));
    LM.save(); LM.rerender(); toast('Listo. Le avisamos a quien lo lleva.');
  };
  F['mt-kds-min'] = (f, d) => { const N = LM.NEG(ses().t); N.minAtraso = Math.max(3, +d.get('m') || 10); LM.save(); LM.rerender(); toast('Guardado'); };
  A['mt-kds-full'] = () => { document.body.classList.toggle('mt-kds-on'); try { if (document.body.classList.contains('mt-kds-on')) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch (e) {} };
  setInterval(() => { if (/^panel-cocina/.test((location.hash || '').slice(1)) && !document.querySelector('#modal:not([hidden])')) { const y = scrollY; LM.render(); scrollTo(0, y); } }, 20000);

  /* ======================= 6. asistencia con QR ======================= */
  function pAsistencia(t, N) {
    N.asist = N.asist || [];
    const s = ses(), dueno = s.rol === 'dueno', url = urlBase() + '#asistencia-' + t.id;
    const hoy = N.asist.filter(a => a.f === hoyISO());
    if (!dueno) {
      const mios = hoy.filter(a => a.u === s.u), ult = mios[mios.length - 1];
      return LM.head('Marcar asistencia', 'Al llegar y al salir, escanea con la cámara del celular el QR de asistencia que está en la caja.') +
        '<div class="box mt-asis-yo">' + ic('scan') + '<div><b>' + (ult ? 'Último registro: ' + esc(ult.tipo) + ' a las ' + esc(ult.h) : 'Hoy no has marcado') + '</b><p class="muted">El QR abre Mi Tienda y deja la hora de entrada o de salida. Si llegas tarde, queda la hora real.</p></div></div>' +
        tablaAsis(mios, false);
    }
    if (API().disponible && !API().yo && !window.__mtEsperaYo) { window.__mtEsperaYo = setTimeout(() => { window.__mtEsperaYo = 0; LM.rerender(); }, 1200); } // Servus 0.1: la sesión del servidor aún no cargaba
    if (Date.now() - (N.asistSrvT || 0) > 30000 && API().disponible && API().yo && API().esDeNegocio(t.id)) {
      N.asistSrvT = Date.now(); API().get('/api/negocio/' + t.id + '/asistencia').then(d => { N.asistSrv = d.registros; LM.rerender(); }).catch(() => {});
    }
    const srv = (N.asistSrv || []).map(r => ({ n: r.nombre, rol: r.rol, tipo: r.tipo, h: hora(r.en), f: (d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))(new Date(r.en)) /* día local, no UTC (después de las 7 p. m. en Colombia ya es otro día en UTC) */ }));
    return LM.head('QR y asistencia', 'Imprime este código y pégalo en la caja. Cada persona del equipo lo escanea al llegar y al salir.', '<button class="btn b-sm" type="button" data-act="mt-asis-imp">' + ic('printer') + 'Imprimir QR</button>') +
      '<div class="g2"><div class="box lm-centro mt-asis-qr" id="mtAsisQR">' + (LM.qrSVG ? LM.qrSVG(url, 220) : '') + '<b>Asistencia · ' + esc(t.n) + '</b><small class="muted">Escanéalo al llegar y al salir</small></div>' +
      '<div class="box"><h3>Hoy</h3>' + tablaAsis(hoy.concat(srv.filter(r => r.f === hoyISO())), true) + '<p class="muted" style="font-size:13px">Las horas de la quincena salen de estos registros. Para cambiar el horario de alguien, ve a Empleados.</p></div></div>';
  }
  pAsistencia.v9 = true; pAsistencia.cajero = true;
  E.panelFn.asistencia = pAsistencia;
  const tablaAsis = (ls, quien) => ls.length ? '<div class="tbl-w"><table class="tbl"><thead><tr>' + (quien ? '<th>Persona</th>' : '') + '<th>Registro</th><th class="r">Hora</th></tr></thead><tbody>' +
    ls.slice().reverse().map(a => '<tr>' + (quien ? '<td>' + esc(a.n) + ' <span class="muted">· ' + esc(E.rolNombre(({ dueno: 'dueno', cajero: 'cajero', mesero: 'mesero', cocina: 'cocina', domiciliario: 'domi', atencion: 'atencion' })[a.rol] || LM.EXT.rolDe(a.rol) || a.rol)) + '</span></td>' : '') + '<td><span class="pill ' + (a.tipo === 'entrada' ? 'p-ok' : 'p-gris') + '">' + esc(a.tipo) + '</span></td><td class="r num">' + esc(a.h) + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">Sin registros hoy.</p>';
  A['mt-asis-imp'] = () => { const q = document.getElementById('mtAsisQR'); if (!q) return; const w = document.createElement('div'); w.className = 'lm-print'; w.innerHTML = q.innerHTML; document.body.appendChild(w); window.print(); setTimeout(() => w.remove(), 500); };
  // Lo que pasa al escanear el QR (la cámara del celular abre esta dirección)
  LM.rutaExt(r => /^asistencia-/.test(r), r => {
    const tid = r.slice(11), t = LM.T(tid), app = document.getElementById('app'), s = ses();
    if (!t) { app.innerHTML = '<div class="lm-wrap"><div class="lm-card lm-centro"><h1>Ese QR no es de un negocio de Mi Tienda</h1></div></div>'; return; }
    if (!s || s.t !== tid || s.rol === 'cliente') {
      app.innerHTML = '<div class="lm-wrap"><div class="lm-card lm-centro">' + LM.logoH(t) + '<h1>Asistencia · ' + esc(t.n) + '</h1><p>Entra con tu cuenta del equipo para marcar la hora.</p><button class="btn b-fucsia b-lg" type="button" data-act="login" data-tab="negocio">Entrar</button></div></div>';
      LM.paint(app); return;
    }
    const N = LM.NEG(tid); N.asist = N.asist || [];
    const mios = N.asist.filter(a => a.u === s.u && a.f === hoyISO()), ult = mios[mios.length - 1];
    if (!ult || Date.now() - ult.ts > 60000) {
      const emp = N.emp.find(e => e.u === s.u) || { n: s.nombre || s.u, rol: E.rolNombre(s.rol) };
      N.asist.push({ u: s.u, n: emp.n, rol: emp.rol, tipo: ult && ult.tipo === 'entrada' ? 'salida' : 'entrada', h: hora(), f: hoyISO(), ts: Date.now() });
      LM.save();
      // Servus 0.1: si la sesión del servidor todavía está cargando (recién abierto el QR), se espera hasta 8 s
      const enviar = (n) => { if (API().disponible && API().yo) { if (API().esDeNegocio(tid)) API().post('/api/negocio/' + tid + '/asistencia', {}).catch(() => {}); } else if (API().disponible !== false && n < 16) setTimeout(() => enviar(n + 1), 500); };
      enviar(0);
    }
    const a = N.asist.filter(x => x.u === s.u && x.f === hoyISO()).slice(-1)[0];
    app.innerHTML = '<div class="lm-wrap"><div class="lm-card lm-centro mt-asis-ok">' + ic('check') + '<h1>' + (a.tipo === 'entrada' ? 'Entrada marcada' : 'Salida marcada') + '</h1><p class="num" style="font-size:20px"><b>' + esc(a.h) + '</b></p><p>' + esc(a.n) + ' · ' + esc(t.n) + '</p><button class="btn b-lg" type="button" data-act="mt-ir-rol">Seguir</button></div></div>';
    LM.paint(app);
  });
  A['mt-ir-rol'] = () => E.irSegunRol();

  /* ======================= 7. empleados por rol ======================= */
  const ROLES = [['Cajero', 'Caja, punto de venta, cobros por confirmar, gastos del día y domicilios'], ['Mesero', 'Mesas, comandas, pedidos por QR de las mesas y asistencia'], ['Cocina', 'Solo la pantalla de comandas'], ['Domiciliario', 'Solo los domicilios de este negocio (domiciliario de confianza)']];
  const ROL_SRV_DE = { Cajero: 'cajero', Mesero: 'mesero', Cocina: 'cocina', Domiciliario: 'domiciliario' };
  const SUF = { Cajero: 'cajero', Mesero: 'mesera', Cocina: 'cocina', Domiciliario: 'domi' };
  function pEmpleados(t, N) {
    const srv = API().disponible && API().yo && API().esDeNegocio(t.id);
    if (srv && !N.equipoT) { N.equipoT = 1; API().get('/api/negocio/' + t.id + '/equipo').then(d => { N.equipoSrv = d.equipo; LM.rerender(); }).catch(() => {}); }
    const puede = r => ({ 'Dueño': 'Todo', Cajero: ROLES[0][1], Mesero: ROLES[1][1], Cocina: ROLES[2][1], Domiciliario: ROLES[3][1] })[r] || '';
    return LM.head('Empleados y roles', 'Cada persona entra con su cuenta y solo ve lo de su trabajo. El dueño ve todo.') +
      '<div class="box"><div class="tbl-w"><table class="tbl"><thead><tr><th>Persona</th><th>Rol</th><th>Puede</th><th></th></tr></thead><tbody>' +
      N.emp.map((e, k) => '<tr><td><b>' + esc(e.n) + '</b><div class="muted num" style="font-size:12px">' + esc(e.u) + '</div></td><td><span class="pill ' + (e.rol === 'Dueño' ? 'p-curso' : 'p-gris') + '">' + esc(E.rolNombre(E.rolDe(e.rol))) + '</span></td><td class="muted" style="font-size:13px">' + esc(puede(e.rol)) + '</td><td>' +
        (e.rol === 'Dueño' ? '' : '<button class="btn b-sm b-rojo" type="button" data-act="emp-del" data-k="' + k + '">' + ic('trash') + 'Quitar</button>') + '</td></tr>').join('') +
      (N.equipoSrv || []).filter(x => x.rol !== 'dueno').map(x => '<tr><td><b>' + esc(x.nombre) + '</b><div class="muted num" style="font-size:12px">' + esc(x.telefono || '') + ' · en el servidor</div></td><td><span class="pill p-gris">' + esc(E.rolNombre(ROL_SRV[x.rol])) + '</span></td><td></td><td><button class="btn b-sm b-rojo" type="button" data-act="mt-eq-quitar" data-id="' + x.id + '">' + ic('trash') + 'Quitar</button></td></tr>').join('') +
      '</tbody></table></div></div>' +
      '<form class="box stack" data-form="mt-emp" style="max-width:680px"><h3 style="margin:0">Invitar a alguien al equipo</h3><div class="row2"><div class="campo"><label for="meN">Nombre</label><input id="meN" name="n" required></div><div class="campo"><label for="meC">Celular (WhatsApp)</label><input id="meC" name="c" inputmode="tel" required placeholder="300 000 0000"></div></div>' +
      '<fieldset class="fs"><legend>Rol</legend><div class="mt-roles">' + ROLES.map((r, i) => '<label class="mt-rol"><input type="radio" name="r" value="' + r[0] + '"' + (i === 1 ? ' checked' : '') + '><span><b>' + esc(E.rolNombre(E.rolDe(r[0]))) + '</b><small>' + esc(r[1]) + '</small></span></label>').join('') + '</div></fieldset>' +
      '<div class="campo"><label for="meH">Horario (opcional)</label><input id="meH" name="h" placeholder="Viernes a domingo · 5 p. m. a 11 p. m."></div>' +
      '<button class="btn b-sol" type="submit">' + ic('send') + 'Crear y enviar invitación por WhatsApp</button><small class="muted">Puedes cambiarle el rol o quitarle el acceso cuando quieras. Al quitarlo, se le cierra la sesión en todos sus aparatos.</small></form>';
  }
  pEmpleados.v9 = true;
  E.panelFn.empleados = pEmpleados;
  F['mt-emp'] = async (f, d) => {
    const t = LM.T(ses().t), N = LM.NEG(t.id), rol = String(d.get('r')), nombre = String(d.get('n')).trim(), cel = soloDig(d.get('c'));
    if (!/^3\d{9}$/.test(cel)) { toast('El celular debe tener 10 números y empezar por 3.'); return; }
    let clave = '1234', usuario = '';
    if (API().disponible && API().yo && API().esDeNegocio(t.id)) {
      try { const r = await API().post('/api/negocio/' + t.id + '/equipo', { nombre, telefono: cel, rol: ROL_SRV_DE[rol] }); clave = r.clave_temporal; usuario = cel; N.equipoT = 0; }
      catch (e) { toast(e.message); return; }
    } else {
      let n = 1; usuario = t.id + '-' + SUF[rol]; while (N.emp.some(e => e.u === usuario)) usuario = t.id + '-' + SUF[rol] + (++n);
      N.emp.push({ u: usuario, n: nombre, rol, cel, h: String(d.get('h') || '') });
    }
    LM.logN(t.id, 'Invitó a ' + nombre + ' como ' + E.rolNombre(E.rolDe(rol)));
    LM.save(); LM.rerender();
    const msg = 'Hola, ' + nombre.split(' ')[0] + '. ' + LM.NEG(t.id).emp[0].n + ' te invitó al equipo de ' + t.n + ' en Mi Tienda como ' + E.rolNombre(E.rolDe(rol)).toLowerCase() + '. Entra aquí: ' + urlBase() + ' · Usuario: ' + usuario + (clave ? ' · Clave temporal: ' + clave : ' · Entra con tu WhatsApp') + '. Cámbiala al entrar.';
    sheet('<div class="sh-h"><div class="tt"><small>Equipo</small><h3>' + esc(nombre) + ' ya está en el equipo</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + ic('x') + '</button></div><div class="sh-b stack">' +
      '<div class="kv"><span>Usuario</span><b class="num">' + esc(usuario) + '</b></div>' + (clave ? '<div class="kv"><span>Clave temporal</span><b class="num">' + esc(clave) + '</b></div>' : '') +
      '<a class="btn b-monte b-lg" target="_blank" rel="noopener" href="https://wa.me/57' + cel + '?text=' + encodeURIComponent(msg) + '">' + LOGOS.w + 'Enviarle la invitación por WhatsApp</a><p class="muted" style="margin:0;font-size:13px">También puede entrar con el código de WhatsApp a su celular, sin clave.</p></div>');
  };
  A['mt-eq-quitar'] = async el => { const t = LM.T(ses().t); try { await API().post('/api/negocio/' + t.id + '/equipo/' + el.dataset.id + '/quitar'); LM.NEG(t.id).equipoT = 0; LM.rerender(); toast('Se le quitó el acceso.'); } catch (e) { toast(e.message); } };

  /* ======================= 8. balance por día, semana, quincena y mes ======================= */
  let periodo = 'semana';
  function historia(t, N) {
    // Días anteriores: ejemplo armado con la semana de muestra; hoy: ventas y gastos reales del día
    if (!N.dias) {
      N.dias = {}; const base = N.semana && N.semana.length ? N.semana : [['Lun', 150000, 90000]];
      for (let i = 1; i <= 62; i++) { const d = new Date(); d.setDate(d.getDate() - i); const b = base[(d.getDay() + 6) % 7] || base[0]; const k = (i * 7919 % 17 - 8) / 100; N.dias[(x => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'))(d)] = [Math.round(b[1] * (1 + k) / 500) * 500, Math.round(b[2] * (1 - k / 2) / 500) * 500]; }
    }
    const hoyIn = LM.sumV(N), hoyOut = N.gastos.reduce((a, x) => a + x.v, 0);
    return Object.assign({}, N.dias, { [hoyISO()]: [hoyIn, hoyOut] });
  }
  function rango(p) {
    const d = new Date(), y = d.getFullYear(), m = d.getMonth(), dia = d.getDate(), iso = (x => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')); // día local (Servus 0.1: antes UTC)
    if (p === 'dia') return [hoyISO(), hoyISO(), 'Hoy'];
    if (p === 'semana') { const ini = new Date(d); ini.setDate(dia - ((d.getDay() + 6) % 7)); return [iso(ini), hoyISO(), 'Esta semana']; }
    if (p === 'quincena') return dia <= 15 ? [iso(new Date(y, m, 1, 12)), hoyISO(), 'Quincena del 1 al 15'] : [iso(new Date(y, m, 16, 12)), hoyISO(), 'Quincena del 16 al fin de mes'];
    return [iso(new Date(y, m, 1, 12)), hoyISO(), 'Este mes'];
  }
  function pBalance(t, N) {
    const H = historia(t, N), [ini, fin, nom] = rango(periodo);
    const dias = Object.keys(H).filter(k => k >= ini && k <= fin).sort();
    const ein = dias.reduce((a, k) => a + H[k][0], 0), eout = dias.reduce((a, k) => a + H[k][1], 0);
    const max = Math.max(1, ...dias.map(k => Math.max(H[k][0], H[k][1])));
    const best = dias.reduce((a, k) => !a || H[k][0] > H[a][0] ? k : a, '');
    const ps = LM.S.prods.filter(p => p.t === t.id).slice().sort((a, b) => b.v - a.v);
    const pagos = {}; N.ventas.forEach(v => { pagos[v.m] = (pagos[v.m] || 0) + v.v; });
    const k = v => v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + ' M' : Math.round(v / 1000) + ' mil';
    const etiqueta = iso => { const d = new Date(iso + 'T12:00'); return periodo === 'semana' ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()] : String(d.getDate()); };
    return LM.head('Balance', 'Lo que entró, lo que salió y lo que te quedó.') +
      '<div class="mt-tabs" role="tablist">' + [['dia', 'Día'], ['semana', 'Semana'], ['quincena', 'Quincena'], ['mes', 'Mes']].map(x => '<button type="button" role="tab" aria-selected="' + (periodo === x[0]) + '" data-act="mt-per" data-p="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>' +
      '<div class="g3 num"><div class="kpi"><small>Entró · ' + esc(nom) + '</small><b>' + pesos(ein) + '</b><span>Ventas de la app y del mostrador</span></div><div class="kpi"><small>Salió</small><b>' + pesos(eout) + '</b><span>Gastos anotados</span></div><div class="kpi gan"><small>Te quedó</small><b>' + pesos(ein - eout) + '</b><span>' + (ein ? Math.round((ein - eout) / ein * 100) + ' % de lo que entró' : '') + '</span></div></div>' +
      (dias.length > 1 ? '<div class="box"><h3>Por día<span class="legend"><span><i style="background:var(--rio)"></i>Entró</span><span><i style="background:var(--fucsia)"></i>Salió</span></span></h3><div class="bars mt-bars">' + dias.map(d => '<div class="col' + (d === best ? ' best' : '') + '"><span class="v num">' + k(H[d][0]) + '</span><div class="pair"><i class="in" style="height:' + (H[d][0] / max * 100) + '%"></i><i class="out" style="height:' + (H[d][1] / max * 100) + '%"></i></div><small>' + etiqueta(d) + '</small></div>').join('') + '</div></div>' : '') +
      (periodo === 'dia' ? '<div class="box"><h3>Hoy por forma de pago</h3>' + (Object.keys(pagos).length ? Object.keys(pagos).map(m => '<div class="kv"><span>' + esc(LM.PAGO[m] || m) + '</span><b class="num">' + pesos(pagos[m]) + '</b></div>').join('') : '<p class="muted">Sin ventas hoy.</p>') + '</div>' : '') +
      '<div class="box"><h3>Lo más vendido</h3><div class="tbl-w"><table class="tbl"><thead><tr><th>Producto</th><th class="r">Vendidos</th><th class="r">Precio</th></tr></thead><tbody>' + ps.slice(0, 8).map(p => '<tr><td>' + esc(p.n) + '</td><td class="r num">' + p.v + '</td><td class="r num">' + pesos(p.p) + '</td></tr>').join('') + '</tbody></table></div></div>' +
      '<p class="muted" style="font-size:13px">Los días anteriores de este negocio de ejemplo son datos de muestra. En tu negocio salen de las ventas y gastos que anotes cada día.</p>';
  }
  pBalance.v9 = true;
  E.panelFn.balance = pBalance;
  A['mt-per'] = el => { periodo = el.dataset.p; LM.rerender(); };

  /* ======================= 9. PQR ======================= */
  const TIPO_PQR = { peticion: 'Petición', queja: 'Queja', reclamo: 'Reclamo', sugerencia: 'Sugerencia' };
  function diasHabiles(desde) { let n = 0; const d = new Date(desde), h = new Date(); while (d < h) { d.setDate(d.getDate() + 1); if (d.getDay() % 6 !== 0 && d <= h) n++; } return n; }
  function pPqr(t, N) {
    N.pqr = N.pqr || (t.id === 'rancho' ? [{ id: 1, tipo: 'reclamo', nombre: 'Luis Ortega', texto: 'El pedido #118 llegó frío y sin la gaseosa.', ts: Date.now() - 2 * 864e5, estado: 'abierta' }, { id: 2, tipo: 'sugerencia', nombre: 'Carmen Ruiz', texto: 'Pongan jugo de corozo sin azúcar.', ts: Date.now() - 6 * 864e5, estado: 'respondida', resp: 'Ya lo tenemos. ¡Gracias!' }] : []);
    if (API().disponible && !API().yo && !window.__mtEsperaYo) { window.__mtEsperaYo = setTimeout(() => { window.__mtEsperaYo = 0; LM.rerender(); }, 1200); }
    if (API().disponible && API().yo && API().esDeNegocio(t.id) && Date.now() - (N.pqrT || 0) > 30000) { N.pqrT = Date.now(); API().get('/api/negocio/' + t.id + '/pqr').then(d => { N.pqrSrv = d.pqr; LM.rerender(); }).catch(() => {}); }
    const todas = N.pqr.map(p => Object.assign({ local: true }, p)).concat((N.pqrSrv || []).map(p => ({ id: p.id, tipo: p.tipo, nombre: p.nombre, texto: p.texto, ts: Date.parse(p.creado), estado: p.estado, resp: p.respuesta, srv: true })));
    return LM.head('PQR · peticiones, quejas, reclamos y sugerencias', 'Responde cada una. Como guía, el plazo general para responder es de 15 días hábiles (confírmalo con tu asesor).') +
      (todas.length ? todas.map(p => {
        const usados = diasHabiles(p.ts), quedan = 15 - usados;
        return '<div class="box mt-pqr ' + p.estado + '"><div class="mt-pqr-h"><span class="pill ' + (p.tipo === 'reclamo' || p.tipo === 'queja' ? 'p-warn' : 'p-gris') + '">' + TIPO_PQR[p.tipo] + '</span><b>PQR-' + String(p.id).padStart(5, '0') + '</b><span class="muted">' + esc(p.nombre) + '</span>' +
          (p.estado === 'abierta' ? '<span class="pill ' + (quedan <= 3 ? 'p-no' : 'p-curso') + '">' + (quedan > 0 ? 'Quedan ' + quedan + ' días hábiles' : 'Vencida') + '</span>' : '<span class="pill p-ok">' + ic('check') + 'Respondida</span>') + '</div><p>' + esc(p.texto) + '</p>' +
          (p.estado === 'abierta' ? '<form class="inline" data-form="mt-pqr-resp" data-id="' + p.id + '" data-srv="' + (p.srv ? 1 : '') + '"><input name="r" required placeholder="Escribe la respuesta" style="flex:1"><button class="btn b-sm b-sol" type="submit">' + ic('send') + 'Responder</button></form>' : '<div class="resp"><b>Respuesta:</b> ' + esc(p.resp || '') + '</div>') + '</div>';
      }).join('') : '<div class="vacio">No hay PQR. Los clientes las envían desde "Mi cuenta" o desde el enlace del pie de página.</div>');
  }
  pPqr.v9 = true;
  E.panelFn.pqr = pPqr;
  F['mt-pqr-resp'] = async (f, d) => {
    const t = LM.T(ses().t), N = LM.NEG(t.id), r = String(d.get('r') || '').trim();
    if (f.dataset.srv) { try { await API().post('/api/negocio/' + t.id + '/pqr/' + f.dataset.id + '/responder', { respuesta: r }); N.pqrT = 0; } catch (e) { toast(e.message); return; } }
    else { const p = N.pqr.find(x => x.id === +f.dataset.id); p.estado = 'respondida'; p.resp = r; LM.save(); }
    LM.rerender(); toast('Respuesta enviada');
  };
  // El cliente envía una PQR
  LM.rutaExt(r => r === 'pqr', () => {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="wrap pp"><div class="panel-h"><div><h1>Peticiones, quejas, reclamos y sugerencias</h1><p>Le llega al negocio y te responde por aquí.</p></div></div>' +
      '<form class="box stack" data-form="mt-pqr-env" style="max-width:640px"><div class="campo"><label for="pqN">Negocio</label><select id="pqN" name="t">' + LM.S.tiendas.map(t => '<option value="' + t.id + '">' + esc(t.n) + '</option>').join('') + '</select></div>' +
      '<div class="campo"><label for="pqT">Tipo</label><select id="pqT" name="tipo">' + Object.keys(TIPO_PQR).map(k => '<option value="' + k + '">' + TIPO_PQR[k] + '</option>').join('') + '</select></div>' +
      '<div class="campo"><label for="pqX">Cuéntanos</label><textarea id="pqX" name="x" required minlength="10"></textarea></div><button class="btn b-fucsia b-lg" type="submit">' + ic('send') + 'Enviar</button></form></div>';
    LM.paint(app);
  });
  F['mt-pqr-env'] = (f, d) => LM.needCli ? LM.needCli(() => enviarPqr(d)) : enviarPqr(d);
  async function enviarPqr(d) {
    const tid = d.get('t'), tipo = d.get('tipo'), texto = String(d.get('x') || '').trim();
    if (API().disponible && API().yo) {
      try { const r = await API().post('/api/negocio/' + tid + '/pqr', { tipo, texto }); toast('Enviada. Radicado ' + r.radicado); LM.go('cuenta'); return; } catch (e) { if (e.status !== 404) { toast(e.message); return; } }
    }
    const N = LM.NEG(tid); N.pqr = N.pqr || []; const id = Math.max(0, ...N.pqr.map(p => p.id)) + 1;
    N.pqr.push({ id, tipo, nombre: (S().user || {}).nombre || 'Cliente', texto, ts: Date.now(), estado: 'abierta' }); LM.save();
    toast('Enviada. Radicado PQR-' + String(id).padStart(5, '0')); LM.go('cuenta');
  }

  /* ======================= 10. opciones de producto (sabor, frío, en leche…) ======================= */
  E.elegirOpciones = (p, cb) => {
    sheet('<div class="sh-h"><div class="tt"><small>' + esc(p.n) + ' · ' + pesos(LM.precio(p).p) + '</small><h3>Escoge</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + ic('x') + '</button></div><form class="sh-b stack" data-form="mt-ops">' +
      p.ops.map((g, gi) => '<fieldset class="fs"><legend>' + esc(g.n) + '</legend><div class="mt-ops">' + g.v.map((v, vi) => { const n = typeof v === 'object' ? v.n : v; return '<label class="mt-op"><input type="radio" name="g' + gi + '" value="' + vi + '"' + (vi ? '' : ' checked') + '><span>' + esc(n) + (typeof v === 'object' && v.p ? '<b class="num">' + pesos(v.p) + '</b>' : '') + '</span></label>'; }).join('') + '</div></fieldset>').join('') +
      '<button class="btn b-fucsia b-lg" type="submit">' + ic('plus') + 'Agregar</button></form>');
    // Una opción puede traer su propio precio (presentación de la droguería: tableta, blíster, caja)
    F['mt-ops'] = (f, d) => { let pr = 0; const o = p.ops.map((g, gi) => { const v = g.v[+d.get('g' + gi)]; if (v && typeof v === 'object' && v.p) pr = v.p; return v == null ? '' : (typeof v === 'object' ? v.n : v); }).filter(Boolean).join(', '); closeModal(); cb(o, pr); };
  };

  /* ======================= 11. ganchos generales ======================= */
  const _trasRender = E.trasRender;
  E.trasRender = r => { _trasRender(r); chipVolver(); document.body.classList.toggle('mt-rol-cocina', !!(ses() && ses().rol === 'cocina')); };
  LM.trasRender && LM.trasRender(() => {
    // "Mi cuenta": enlace a PQR y, para dueños, volver al negocio o cambiar a dónde abre la app
    const c = document.querySelector('.cuenta-side, .acc-side, .cuenta');
    if (c && !c.querySelector('.mt-cuenta-pqr') && /^cuenta/.test((location.hash || '').slice(1))) {
      const d = document.createElement('div'); d.className = 'mt-cuenta-pqr box';
      d.innerHTML = '<b>' + ic('chat') + 'Peticiones, quejas y reclamos</b><p class="muted" style="margin:4px 0 8px">¿Algo salió mal con un pedido? Cuéntaselo al negocio.</p><button class="btn b-sm" type="button" data-act="go" data-h="pqr">Enviar una PQR</button>';
      c.appendChild(d); LM.paint(d);
    }
  });
  // El pie de página lleva a PQR
  const pie = document.querySelector('.ft');
  if (pie && !pie.querySelector('.mt-pie-pqr')) { const a = document.createElement('p'); a.className = 'mt-pie-pqr'; a.innerHTML = '<button type="button" class="b-ghost" data-act="go" data-h="pqr" style="color:#fff">Peticiones, quejas y reclamos (PQR)</button>'; pie.appendChild(a); }

  migrar();
  empleadosDemo();
  LM.save();
  LM.v9 = { entrarPorServidor, entrarConClave, cocinaPend, lg };
})();
