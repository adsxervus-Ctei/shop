/* Mi Tienda v9 · cómo atiende cada tipo de negocio (Propuesta K)
   Lo común (caja, inventario, balance, gastos, pedidos, domicilios, equipo, reseñas) es igual para todos.
   Aquí va solo lo que cambia: la pantalla de atención de cada modelo de negocio.
   Negocios nuevos de ejemplo: Granero Central (por mayor), Ferretería El Tornillo, Asociación de Pescadores,
   Quesera El Playón, Distribuidora Loba y Granja Chimí. */
(function () {
  'use strict';
  const LM = window.LM, A = LM.A, F = LM.F;
  const { esc, ic, pesos, toast, sheet, closeModal, hora } = LM;
  const ses = () => LM.S.session;
  const tienda = () => LM.T(ses().t);
  const hoyISO = () => new Date().toISOString().slice(0, 10);
  const enDias = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const r500 = v => Math.round(v / 500) * 500;
  const vender = (t, desc, v, m) => { const N = LM.NEG(t.id); N.ventas.push({ h: hora(), d: desc, v, m: m || 'efectivo', o: 'mostrador', por: ses().u }); LM.logN(t.id, 'Anotó venta: ' + desc + ' ' + pesos(v)); };
  const gastar = (t, d, v) => { const N = LM.NEG(t.id); N.gastos.push({ h: hora(), d, v }); LM.logN(t.id, 'Anotó gasto: ' + d + ' ' + pesos(v)); };
  const OPC_PAGO = '<option value="efectivo">Efectivo</option><option value="nequi">Nequi</option><option value="daviplata">Daviplata</option><option value="breb">Bre-B</option><option value="banco">Bancolombia</option><option value="fiado">Fiado</option>';
  const num = v => (Math.round(v * 100) / 100).toLocaleString('es-CO');
  const box = (h, cuerpo, extra) => '<div class="box' + (extra ? ' ' + extra : '') + '"><h3>' + h + '</h3>' + cuerpo + '</div>';
  const vacio = t => '<p class="muted">' + t + '</p>';

  /* ---------------- categorías y negocios de ejemplo nuevos ---------------- */
  const CATS9 = [
    { id: 'mayorista', n: 'Granos y víveres por mayor', c: 'var(--mango)', i: 'saco', subs: ['Granos', 'Víveres'] },
    { id: 'pesca', n: 'Pescado fresco', c: 'var(--rio)', i: 'pescado', subs: ['Pescado'] },
    { id: 'lacteos', n: 'Quesos y lácteos', c: 'var(--sol)', i: 'botella', claro: 1, subs: ['Quesos', 'Suero y leche'] },
    { id: 'distribuidora', n: 'Distribuidoras', c: 'var(--tinta)', i: 'box', subs: ['Bebidas', 'Abarrotes'] },
    { id: 'granja', n: 'Granjas', c: 'var(--lima)', i: 'pollo', claro: 1, subs: ['Huevos', 'Pollo y gallina'] }
  ];
  CATS9.forEach(c => { if (!LM.CAT[c.id]) { LM.CATS.push(c); LM.CAT[c.id] = c; } });
  const base = (id, n, cat, ini, color, dir, horario, desc, extra) => Object.assign({ id, n, cat, ini, color, r: 4.7, dir, horario, min: 40, desc, abierto: true, tel: '300 ' + (500 + id.length * 11) + ' ' + (6000 + id.length * 37), nequi: '310 ' + (700 + id.length * 3) + ' ' + (4100 + id.length * 13),
    zonas: { cabecera: 5000, chimi: 9000, sanmartin: null, barranco: null }, pagos: { efectivo: true, nequi: true, daviplata: true, breb: true, banco: true, fiado: true }, logo: 'img/logos/' + id + '.png', nuevo9: true }, extra || {});
  const TIENDAS9 = [
    base('granero', 'Granero Central', 'mayorista', 'GC', 'mango', 'Calle del Comercio, Hatillo', '6:00 a. m. – 6:00 p. m.', 'Arroz, azúcar, fríjol y aceite por libra, arroba o bulto. Precio especial para tenderos.', { zonas: { cabecera: 8000, chimi: 15000, sanmartin: 25000, barranco: null } }),
    base('ferreteria', 'Ferretería El Tornillo', 'deposito', 'ET', 'rojo', 'Salida a San Martín, Hatillo', '7:00 a. m. – 6:00 p. m.', 'Cable por metro, puntillas por kilo, cemento, tubería y pintura. Cotizaciones para obra.', { zonas: { cabecera: 10000, chimi: 20000, sanmartin: null, barranco: null } }),
    base('pescadores', 'Asociación de Pescadores', 'pesca', 'AP', 'rio', 'El muelle, Hatillo', '5:00 a. m. – 2:00 p. m.', 'Bocachico, bagre y mojarra de la ciénaga, frescos del día. Precio por libra.'),
    base('quesera', 'Quesera El Playón', 'lacteos', 'QP', 'sol', 'Vereda El Playón', '6:00 a. m. – 5:00 p. m.', 'Queso costeño, queso duro y suero de leche de las fincas de la zona. Se reciben encargos.'),
    base('distribuidora', 'Distribuidora Loba', 'distribuidora', 'DL', 'monte', 'Bodega vía principal, Hatillo', '7:00 a. m. – 5:00 p. m.', 'Distribuidora para tiendas: bebidas y abarrotes por caja o paca. Preventa martes y viernes.'),
    base('granja', 'Granja Chimí', 'granja', 'GC', 'lima', 'Chimí, a la entrada', '6:00 a. m. – 6:00 p. m.', 'Huevos criollos y pollo campesino. Encargos con fecha de entrega.')
  ];
  const pr = (id, n, t, sub, i, p, stock, d, extra) => Object.assign({ id, n, t, sub, i, p, r: 4.7, rc: 20, v: 30, stock, nuevo: true, d, disp: true }, extra || {});
  const PRODS9 = [
    pr('arroz-mayor', 'Arroz blanco', 'granero', 'Granos', 'saco', 2200, 9300, 'Por libra, arroba (12,5 kg) o bulto de 50 kg.', { unidades: [['Libra', 0.5, 2200, 2000], ['Arroba', 12.5, 50000, 47000], ['Bulto 50 kg', 50, 175000, 168000]] }),
    pr('azucar-mayor', 'Azúcar', 'granero', 'Granos', 'saco', 2500, 3700, 'Por libra, arroba o bulto.', { unidades: [['Libra', 0.5, 2500, 2300], ['Arroba', 12.5, 57000, 54000], ['Bulto 50 kg', 50, 180000, 172000]] }),
    pr('frijol-mayor', 'Fríjol rojo', 'granero', 'Granos', 'saco', 5500, 275, 'Por libra o arroba.', { unidades: [['Libra', 0.5, 5500, 5200], ['Arroba', 12.5, 128000, 122000]] }),
    pr('aceite-mayor', 'Aceite 1 litro', 'granero', 'Víveres', 'botella', 11500, 480, 'Por unidad o caja de 12.', { unidades: [['Unidad', 1, 11500, 10800], ['Caja x 12', 12, 132000, 126000]], porUnidad: true }),
    pr('cable12', 'Cable eléctrico #12', 'ferreteria', 'Ferretería', 'tubo', 2800, 463, 'Se vende por metro.', { medida: 'm', paso: 1 }),
    pr('puntilla2', 'Puntilla 2"', 'ferreteria', 'Ferretería', 'ladrillo', 9000, 38, 'Se vende por kilo.', { medida: 'kg', paso: 0.5 }),
    pr('cemento-et', 'Cemento gris 50 kg', 'ferreteria', 'Construcción', 'cemento', 33000, 120, 'Bulto de 50 kg.', { medida: 'bulto', paso: 1 }),
    pr('pintura-et', 'Pintura vinilo blanca', 'ferreteria', 'Construcción', 'pintura', 58000, 24, 'Galón. También en cuarto.', { medida: 'galón', paso: 0.25 }),
    pr('tubo-et', 'Tubo PVC ½" x 6 m', 'ferreteria', 'Ferretería', 'tubo', 14000, 60, 'Tubo de presión.', { medida: 'unidad', paso: 1 }),
    pr('bocachico-lb', 'Bocachico fresco', 'pescadores', 'Pescado', 'pescado', 8000, 48, 'Precio por libra. Del día.', { medida: 'lb', paso: 0.5 }),
    pr('bagre', 'Bagre fresco', 'pescadores', 'Pescado', 'pescado', 14000, 21, 'Precio por libra. Del día.', { medida: 'lb', paso: 0.5 }),
    pr('mojarra-cienaga', 'Mojarra de ciénaga', 'pescadores', 'Pescado', 'pescado', 9500, 10, 'Precio por libra. Del día.', { medida: 'lb', paso: 0.5 }),
    pr('queso-costeno', 'Queso costeño', 'quesera', 'Quesos', 'saco', 10000, 64, 'Precio por libra.', { medida: 'lb', paso: 0.5 }),
    pr('queso-duro', 'Queso duro', 'quesera', 'Quesos', 'saco', 11000, 30, 'Precio por libra.', { medida: 'lb', paso: 0.5 }),
    pr('suero-costeno', 'Suero costeño 750 ml', 'quesera', 'Suero y leche', 'botella', 5000, 36, 'Botella de 750 ml.'),
    pr('paca-gaseosa', 'Gaseosa 400 ml · paca x12', 'distribuidora', 'Bebidas', 'botella', 21000, 140, 'Para tiendas. Precio por paca.'),
    pr('caja-aceite', 'Aceite 1 L · caja x12', 'distribuidora', 'Abarrotes', 'botella', 126000, 40, 'Para tiendas. Precio por caja.'),
    pr('paca-arroz', 'Arroz 1 kg · paca x25', 'distribuidora', 'Abarrotes', 'saco', 98000, 55, 'Para tiendas. Precio por paca.'),
    pr('huevos30', 'Huevos criollos x 30', 'granja', 'Huevos', 'bolsa', 18000, 9, 'Panal de 30. Recogidos hoy.'),
    pr('pollo-criollo', 'Pollo criollo entero, pelado', 'granja', 'Pollo y gallina', 'pollo', 45000, 6, 'Por encargo, listo en 1 día.'),
    pr('gallina-criolla', 'Gallina criolla para sancocho', 'granja', 'Pollo y gallina', 'pollo', 50000, 4, 'Pelada y arreglada.'),
    // Restaurante: bebidas con opciones (se escoge al venderlas)
    pr('gaseosa400', 'Gaseosa 400 ml', 'rancho', 'Bebidas', 'botella', 3000, 60, 'Bien fría.', { ops: [{ n: 'Sabor', v: ['Cola', 'Naranja', 'Uva', 'Manzana'] }, { n: '¿Fría?', v: ['Bien fría', 'Al clima'] }] }),
    pr('jugo-natural', 'Jugo natural 16 oz', 'rancho', 'Bebidas', 'vaso', 3500, 80, 'Corozo, maracuyá, mango, guayaba, tamarindo o limonada.', { ops: [{ n: 'Sabor', v: ['Corozo', 'Maracuyá', 'Mango', 'Guayaba', 'Tamarindo', 'Limonada'] }, { n: 'Preparación', v: ['En agua', 'En leche (+$1.500)'] }, { n: 'Azúcar', v: ['Normal', 'Poquita', 'Sin azúcar'] }] }),
    // Droguería: presentaciones con su precio y un medicamento con fórmula
    pr('amoxicilina', 'Amoxicilina 500 mg x 21', 'drogueria', 'Medicamentos', 'farmacia', 16500, 30, 'Antibiótico: se vende solo con fórmula médica.', { rx: true })
  ];
  function sembrar() {
    const S = LM.S;
    TIENDAS9.forEach(t => { if (!S.tiendas.some(x => x.id === t.id)) S.tiendas.push(JSON.parse(JSON.stringify(t))); });
    PRODS9.forEach(p => { if (!S.prods.some(x => x.id === p.id)) S.prods.push(JSON.parse(JSON.stringify(p))); });
    const ac = S.prods.find(p => p.id === 'acetaminofen');
    if (ac && !ac.ops) ac.ops = [{ n: 'Presentación', v: [{ n: 'Tableta suelta', p: 300 }, { n: 'Blíster x 10', p: 3000 }, { n: 'Caja x 100', p: 18000 }] }];
    S.tiendas.forEach(t => { if (t.nuevo9) { const N = LM.NEG(t.id); if (N.emp[0] && N.emp[0].n === 'Propietario') N.emp[0].n = ({ granero: 'Ana Milena', ferreteria: 'Don Hernando', pescadores: 'Marlene', quesera: 'Doña Edith', distribuidora: 'Carolina', granja: 'Luz Dary' })[t.id] || 'Propietario'; } });
  }

  /* ---------------- qué herramienta tiene cada tipo ---------------- */
  Object.assign(LM.TIPOS, {
    mayorista: { nombre: 'Granos y víveres por mayor', herramienta: ['mayor', 'saco', 'Venta por mayor'], atributos: ['unidad de venta'], nota: 'Precio por libra, arroba o bulto; precio para tenderos; crédito con cupo.' },
    pesca: { nombre: 'Pescado (asociación o pescadería)', herramienta: ['acopio', 'pescado', 'Acopio y nevera'], atributos: ['por libra'], nota: 'Se le compra a cada pescador, se vende por libra y se liquida cada semana.' },
    lacteos: { nombre: 'Quesera y lácteos', herramienta: ['produccion', 'botella', 'Producción y encargos'], atributos: ['por libra'], nota: 'Leche que entra por finca, queso que sale y encargos con fecha.' },
    distribuidora: { nombre: 'Distribuidora', herramienta: ['rutas', 'pin', 'Rutas y preventa'], atributos: ['caja', 'paca'], nota: 'Vendedores visitan tiendas, toman pedidos y cobran cartera.' },
    granja: { nombre: 'Granja', herramienta: ['granja', 'pollo', 'Recolección y encargos'], atributos: [], nota: 'Huevos por galpón y encargos con fecha.' }
  });
  if (LM.TIPOS.deposito) LM.TIPOS.deposito.herramienta = ['medida', 'tubo', 'Por medida y cotizaciones'];
  if (LM.TIPOS.farmacia) LM.TIPOS.farmacia.herramienta = ['formulas', 'farmacia', 'Fórmulas y vencimientos'];
  // El aviso rojo del menú (cuántas cosas esperan)
  const _items = LM.EXT.panelItems;
  LM.EXT.panelItems = (items, t, caj) => {
    items = _items(items, t, caj);
    const it = items.find(x => ['mayor', 'medida', 'acopio', 'produccion', 'rutas', 'granja', 'formulas'].includes(x[0]));
    if (it) {
      const N = LM.NEG(t.id), k = ini(t, N);
      const n = ({ mayor: () => (k.pedidosT || []).filter(p => p.estado === 'nuevo').length, medida: () => (k.cotiz || []).filter(c => c.estado === 'abierta').length, formulas: () => rxPend(t).length,
        produccion: () => (k.encargos || []).filter(e => e.estado === 'pendiente').length, granja: () => (k.encargos || []).filter(e => e.estado === 'pendiente').length })[it[0]];
      it[3] = n ? (n() || undefined) : undefined;
    }
    return items;
  };
  const diasA = f => Math.ceil((new Date(f + 'T23:59:59') - new Date()) / 864e5);

  /* ---------------- datos iniciales de cada herramienta ---------------- */
  function ini(t, N) {
    if (N.k9) return N.k9;
    const k = N.k9 = {};
    if (t.cat === 'mayorista') {
      k.tendero = true; k.ticket = [];
      k.pedidosT = [{ id: 1, tienda: 'tienda', nombre: 'Tienda Mi Pueblo', items: [['arroz-mayor', 2, 3], ['azucar-mayor', 1, 4], ['aceite-mayor', 1, 1]], estado: 'nuevo', h: '7:40 a. m.' }];
      k.credito = { tienda: { cupo: 1500000, usado: 640000, plazo: 15 }, panaderia: { cupo: 800000, usado: 210000, plazo: 15 } };
    }
    if (t.cat === 'deposito') {
      k.ticket = [];
      k.cotiz = t.id !== 'ferreteria' ? [] : [{ id: 31, cli: 'Yesica Cantillo', cel: '3015529031', obra: 'Arreglo del baño', items: [['cable12', 15], ['puntilla2', 2], ['cemento-et', 10], ['tubo-et', 4], ['pintura-et', 2]], f: Date.now() - 864e5, estado: 'abierta' }];
    }
    if (t.cat === 'pesca') {
      k.acopio = [{ p: 'Ovidio Rangel', e: 'bocachico-lb', lb: 38, pc: 6000, f: hoyISO() }, { p: 'Eliécer Pacheco', e: 'bagre', lb: 22, pc: 11000, f: hoyISO() }, { p: 'Toño Mercado', e: 'bocachico-lb', lb: 25, pc: 6000, f: hoyISO() }, { p: 'Rafael Ospino', e: 'mojarra-cienaga', lb: 14, pc: 7000, f: hoyISO() }];
      k.pagados = {};
    }
    if (t.cat === 'lacteos') {
      k.leche = [{ finca: 'La Esperanza', quien: 'Don Ovidio', l: 140, pl: 2800, h: '5:40 a. m.', f: hoyISO() }, { finca: 'El Paraíso', quien: 'Wilfrido', l: 95, pl: 2800, h: '5:55 a. m.', f: hoyISO() }, { finca: 'Las Mercedes', quien: 'Nayibe', l: 80, pl: 2800, h: '5:58 a. m.', f: hoyISO() }];
      k.prod = [{ f: hoyISO(), queso: 31.5, suero: 36 }];
      k.encargos = [{ id: 1, para: 'Rancho Costeño', que: '10 kg de queso costeño', fecha: enDias(2), estado: 'listo' }, { id: 2, para: 'Tienda Mi Pueblo', que: '6 kg de queso + 10 botellas de suero', fecha: enDias(2), estado: 'pendiente' }];
    }
    if (t.cat === 'distribuidora') {
      k.ruta = { vendedor: 'Julio Ospino', nombre: 'Hatillo centro · martes y viernes' };
      k.paradas = [{ tid: 'tienda', estado: 'pedido', valor: 486000, h: '7:40 a. m.' }, { tid: 'panaderia', estado: 'sin pedido', valor: 0, h: '8:15 a. m.' }, { tid: 'rancho', estado: 'pendiente', valor: 0 }, { tid: 'billar', estado: 'pendiente', valor: 0, debe: 210000 }, { tid: 'drogueria', estado: 'pendiente', valor: 0 }];
      k.cartera = { billar: 210000, panaderia: 95000, tienda: 540000 };
    }
    if (t.cat === 'granja') {
      k.galpones = [{ n: 'Galpón 1', aves: 260 }, { n: 'Galpón 2', aves: 230 }];
      k.reco = [{ f: hoyISO(), g: 'Galpón 1', h: 220, rotos: 3 }, { f: hoyISO(), g: 'Galpón 2', h: 192, rotos: 2 }];
      k.encargos = [{ id: 1, para: 'Rancho Costeño', que: '4 pollos criollos pelados', fecha: enDias(2), estado: 'listo' }, { id: 2, para: 'Tienda Mi Pueblo', que: '10 panales de huevo', fecha: enDias(5), estado: 'pendiente', semanal: true }];
    }
    if (t.cat === 'farmacia') {
      k.vence = [{ n: 'Loratadina 10 mg', lote: 'L2291', f: '2026-12-20', u: 18 }, { n: 'Suero oral 500 ml', lote: 'S1180', f: '2027-01-15', u: 12 }, { n: 'Ibuprofeno 400 mg', lote: 'I0932', f: '2027-03-30', u: 60 }, { n: 'Acetaminofén 500 mg', lote: 'A4410', f: '2028-08-31', u: 340 }];
      k.rx = {};
    }
    if (t.cat === 'belleza') k.fila = [{ id: 1, n: 'Brayan M.', s: 'Corte', h: '2:41 p. m.' }, { id: 2, n: 'Yeferson', s: 'Corte + barba', h: '2:50 p. m.' }];
    LM.save();
    return k;
  }
  const PR = id => LM.PR(id) || { n: id, p: 0 };

  /* ======================= POR MAYOR ======================= */
  function pMayor(t, N) {
    const k = ini(t, N), ps = LM.S.prods.filter(p => p.t === t.id && p.unidades);
    const precioU = u => k.tendero ? u[3] : u[2];
    const tot = k.ticket.reduce((a, l) => a + l.p * l.q, 0);
    return LM.head('Venta por mayor', 'Precio por libra, arroba o bulto. El inventario se lleva en kilos: un bulto descuenta 50 kg y una arroba 12,5 kg.') +
      '<div class="mt-tabs" role="tablist"><button type="button" role="tab" aria-selected="' + k.tendero + '" data-act="my-precio" data-v="1">Precio tendero</button><button type="button" role="tab" aria-selected="' + !k.tendero + '" data-act="my-precio" data-v="0">Precio público</button></div>' +
      '<div class="g2"><div class="box"><h3>Productos</h3>' + ps.map(p => '<div class="mt-my-fila"><div><b>' + esc(p.n) + '</b><small class="muted">Hay ' + num(p.porUnidad ? p.stock : p.stock) + (p.porUnidad ? ' unidades' : ' kg') + '</small></div><div class="mt-my-us">' +
        p.unidades.map((u, i) => '<button type="button" class="mt-my-u" data-act="my-add" data-id="' + p.id + '" data-u="' + i + '">' + esc(u[0]) + '<b class="num">' + pesos(precioU(u)) + '</b></button>').join('') + '</div></div>').join('') + '</div>' +
      '<div class="box stack"><h3>Venta de ahora</h3>' + (k.ticket.length ? k.ticket.map((l, i) => '<div class="kv"><span>' + l.q + ' × ' + esc(l.n) + ' · ' + esc(l.u) + '</span><span><b class="num">' + pesos(l.p * l.q) + '</b> <button class="b-ghost" type="button" data-act="my-quitar" data-i="' + i + '" aria-label="Quitar">' + ic('x') + '</button></span></div>').join('') +
        '<div class="kv" style="font-size:19px"><b>Total</b><b class="num">' + pesos(tot) + '</b></div><form class="stack" data-form="my-cobrar"><div class="row2"><div class="campo"><label for="myP">Pago</label><select id="myP" name="m">' + OPC_PAGO + '</select></div><div class="campo"><label for="myC">Cliente (para crédito)</label><select id="myC" name="c"><option value="">Mostrador</option>' + Object.keys(k.credito).map(x => '<option value="' + x + '">' + esc((LM.T(x) || { n: x }).n) + '</option>').join('') + '</select></div></div><button class="btn b-monte b-lg" type="submit">' + ic('cash') + 'Cobrar ' + pesos(tot) + '</button></form>' : vacio('Toca la unidad (libra, arroba o bulto) de cada producto.')) + '</div></div>' +
      box('Pedidos de tenderos', k.pedidosT.length ? k.pedidosT.map(pd => { const tt = pd.items.reduce((a, it) => { const p = PR(it[0]); return a + (p.unidades ? p.unidades[it[1]][3] : 0) * it[2]; }, 0); const c = k.credito[pd.tienda];
        return '<div class="mt-ped"><div class="mt-ped-h">' + (LM.T(pd.tienda) ? LM.logoH(LM.T(pd.tienda)) : '') + '<b>' + esc(pd.nombre) + '</b><span class="muted">' + esc(pd.h) + '</span><span class="pill ' + (pd.estado === 'nuevo' ? 'p-nuevo' : 'p-ok') + '">' + esc(pd.estado) + '</span></div>' +
          pd.items.map(it => { const p = PR(it[0]), u = p.unidades ? p.unidades[it[1]] : ['', 0, 0, 0]; return '<div class="kv"><span>' + it[2] + ' × ' + esc(p.n) + ' · ' + esc(u[0]) + '</span><b class="num">' + pesos(u[3] * it[2]) + '</b></div>'; }).join('') +
          '<div class="kv"><b>Total</b><b class="num">' + pesos(tt) + '</b></div>' + (c ? '<p class="muted" style="margin:6px 0">Crédito: cupo ' + pesos(c.cupo) + ' · usado ' + pesos(c.usado) + ' · con este pedido ' + pesos(c.usado + tt) + (c.usado + tt > c.cupo ? ' <b style="color:var(--rojo)">(pasa el cupo)</b>' : '') + ' · paga a ' + c.plazo + ' días</p>' : '') +
          (pd.estado === 'nuevo' ? '<div class="quick"><button class="btn b-sm b-monte" type="button" data-act="my-despachar" data-id="' + pd.id + '" data-m="fiado">' + ic('check') + 'Despachar a crédito</button><button class="btn b-sm" type="button" data-act="my-despachar" data-id="' + pd.id + '" data-m="efectivo">Contado</button></div>' : '') + '</div>';
      }).join('') : vacio('No hay pedidos de tiendas.'));
  }
  A['my-precio'] = el => { const N = LM.NEG(ses().t); ini(tienda(), N).tendero = el.dataset.v === '1'; LM.save(); LM.rerender(); };
  A['my-add'] = el => { const t = tienda(), k = ini(t, LM.NEG(t.id)), p = PR(el.dataset.id), u = p.unidades[+el.dataset.u], pre = k.tendero ? u[3] : u[2]; const l = k.ticket.find(x => x.id === p.id && x.u === u[0]); if (l) l.q++; else k.ticket.push({ id: p.id, n: p.n, u: u[0], kg: u[1], p: pre, q: 1 }); LM.save(); LM.rerender(); };
  A['my-quitar'] = el => { const k = ini(tienda(), LM.NEG(ses().t)); k.ticket.splice(+el.dataset.i, 1); LM.save(); LM.rerender(); };
  F['my-cobrar'] = (f, d) => {
    const t = tienda(), N = LM.NEG(t.id), k = ini(t, N), tot = k.ticket.reduce((a, l) => a + l.p * l.q, 0), c = d.get('c'), m = c ? 'fiado' : d.get('m');
    k.ticket.forEach(l => { const p = PR(l.id); p.stock = Math.max(0, +(p.stock - l.kg * l.q).toFixed(2)); });
    if (c && k.credito[c]) k.credito[c].usado += tot;
    vender(t, k.ticket.map(l => l.q + ' ' + l.u + ' ' + l.n).join(', ') + (c ? ' · crédito ' + (LM.T(c) || {}).n : ''), tot, m);
    k.ticket = []; LM.save(); LM.rerender(); toast('Venta anotada: ' + pesos(tot));
  };
  A['my-despachar'] = el => {
    const t = tienda(), N = LM.NEG(t.id), k = ini(t, N), pd = k.pedidosT.find(x => x.id === +el.dataset.id);
    const tt = pd.items.reduce((a, it) => { const p = PR(it[0]), u = p.unidades[it[1]]; p.stock = Math.max(0, +(p.stock - u[1] * it[2]).toFixed(2)); return a + u[3] * it[2]; }, 0);
    if (el.dataset.m === 'fiado' && k.credito[pd.tienda]) k.credito[pd.tienda].usado += tt;
    vender(t, 'Pedido de ' + pd.nombre, tt, el.dataset.m); pd.estado = 'despachado'; LM.save(); LM.rerender(); toast('Despachado. Sale en el carguero.');
  };

  /* ======================= FERRETERÍA: por medida y cotizaciones ======================= */
  function pMedida(t, N) {
    const k = ini(t, N), ps = LM.S.prods.filter(p => p.t === t.id);
    const tot = k.ticket.reduce((a, l) => a + l.p * l.q, 0);
    const ctot = c => c.items.reduce((a, it) => a + PR(it[0]).p * it[1], 0);
    return LM.head('Por medida y cotizaciones', 'Cable por metro, puntillas por kilo, pintura por galón o cuarto. Las cotizaciones se envían por WhatsApp y se vuelven venta con un toque.') +
      '<div class="g2"><form class="box stack" data-form="fe-add"><h3 style="margin:0">Vender por medida</h3><div class="campo"><label for="feP">Producto</label><select id="feP" name="p">' + ps.map(p => '<option value="' + p.id + '">' + esc(p.n) + ' · ' + pesos(p.p) + ' por ' + esc(p.medida || 'unidad') + ' (hay ' + num(p.stock) + ')</option>').join('') + '</select></div>' +
      '<div class="campo"><label for="feQ">Cantidad (metros, kilos, galones…)</label><input id="feQ" name="q" type="number" min="0.25" step="0.25" value="1" required></div><button class="btn b-sol" type="submit">' + ic('plus') + 'Agregar</button>' +
      (k.ticket.length ? k.ticket.map((l, i) => '<div class="kv"><span>' + num(l.q) + ' ' + esc(l.m) + ' · ' + esc(l.n) + '</span><span><b class="num">' + pesos(l.p * l.q) + '</b> <button class="b-ghost" type="button" data-act="fe-quitar" data-i="' + i + '" aria-label="Quitar">' + ic('x') + '</button></span></div>').join('') + '<div class="kv" style="font-size:18px"><b>Total</b><b class="num">' + pesos(tot) + '</b></div>' +
        '<div class="row2"><div class="campo"><label for="feM">Pago</label><select id="feM" name="m">' + OPC_PAGO + '</select></div><div class="campo"><label>&nbsp;</label><button class="btn b-monte" type="button" data-act="fe-cobrar">' + ic('cash') + 'Cobrar</button></div></div><button class="btn b-ghost" type="button" data-act="fe-a-cotiz">' + ic('receipt') + 'Mejor guardarla como cotización</button>' : '') + '</form>' +
      '<div class="box"><h3>Se vende por medida</h3><div class="tbl-w"><table class="tbl"><thead><tr><th>Producto</th><th>Unidad</th><th>Se descuenta</th></tr></thead><tbody><tr><td>Cable, manguera, cadena</td><td>Metro</td><td>Del rollo abierto</td></tr><tr><td>Puntillas, alambre, tornillos</td><td>Kilo o libra</td><td>Pesados en la balanza</td></tr><tr><td>Cemento, arena, cal</td><td>Bulto</td><td>Por bulto</td></tr><tr><td>Pintura</td><td>Galón o cuarto (0,25)</td><td>Por presentación</td></tr></tbody></table></div></div></div>' +
      box('Cotizaciones', k.cotiz.length ? k.cotiz.slice().reverse().map(c => '<div class="mt-ped"><div class="mt-ped-h"><b>COT-' + String(c.id).padStart(3, '0') + '</b><span>' + esc(c.cli) + ' · ' + esc(c.obra || '') + '</span><span class="pill ' + (c.estado === 'abierta' ? (Date.now() - c.f > 8 * 864e5 ? 'p-no' : 'p-warn') : 'p-ok') + '">' + (c.estado === 'abierta' ? (Date.now() - c.f > 8 * 864e5 ? 'Vencida: revisar precios' : 'Vigente 8 días') : 'Vendida') + '</span></div>' +
        c.items.map(it => { const p = PR(it[0]); return '<div class="kv"><span>' + num(it[1]) + ' ' + esc(p.medida || 'und') + ' · ' + esc(p.n) + '</span><b class="num">' + pesos(p.p * it[1]) + '</b></div>'; }).join('') + '<div class="kv"><b>Total</b><b class="num">' + pesos(ctot(c)) + '</b></div>' +
        (c.estado === 'abierta' ? '<div class="quick"><a class="btn b-sm" target="_blank" rel="noopener" href="https://wa.me/57' + esc(c.cel || '') + '?text=' + encodeURIComponent('Cotización ' + t.n + ' (COT-' + c.id + '): ' + c.items.map(it => num(it[1]) + ' ' + (PR(it[0]).medida || 'und') + ' ' + PR(it[0]).n).join(', ') + '. Total ' + pesos(ctot(c)) + '. Precios por 8 días.') + '">' + ic('send') + 'Enviar por WhatsApp</a><button class="btn b-sm b-monte" type="button" data-act="fe-convertir" data-id="' + c.id + '">' + ic('check') + 'Convertir en venta</button></div>' : '') + '</div>').join('') : vacio('No hay cotizaciones.'));
  }
  F['fe-add'] = (f, d) => { const t = tienda(), k = ini(t, LM.NEG(t.id)), p = PR(d.get('p')), q = Math.max(0.25, +d.get('q') || 1); if (q > p.stock) { toast('Solo hay ' + num(p.stock) + ' ' + (p.medida || '')); return; } k.ticket.push({ id: p.id, n: p.n, m: p.medida || 'und', p: p.p, q }); LM.save(); LM.rerender(); };
  A['fe-quitar'] = el => { const k = ini(tienda(), LM.NEG(ses().t)); k.ticket.splice(+el.dataset.i, 1); LM.save(); LM.rerender(); };
  A['fe-cobrar'] = () => { const t = tienda(), k = ini(t, LM.NEG(t.id)), m = (document.getElementById('feM') || {}).value || 'efectivo', tot = k.ticket.reduce((a, l) => a + l.p * l.q, 0); k.ticket.forEach(l => { const p = PR(l.id); p.stock = Math.max(0, +(p.stock - l.q).toFixed(2)); }); vender(t, k.ticket.map(l => num(l.q) + ' ' + l.m + ' ' + l.n).join(', '), tot, m); k.ticket = []; LM.save(); LM.rerender(); toast('Venta anotada: ' + pesos(tot)); };
  A['fe-a-cotiz'] = () => { sheet('<div class="sh-h"><div class="tt"><small>Cotización</small><h3>¿Para quién es?</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + ic('x') + '</button></div><form class="sh-b stack" data-form="fe-cotiz"><div class="campo"><label for="fcN">Cliente</label><input id="fcN" name="n" required></div><div class="campo"><label for="fcC">Celular</label><input id="fcC" name="c" inputmode="tel"></div><div class="campo"><label for="fcO">Obra</label><input id="fcO" name="o" placeholder="Ej: arreglo del baño"></div><button class="btn b-sol b-lg" type="submit">Guardar cotización</button></form>'); };
  F['fe-cotiz'] = (f, d) => { const t = tienda(), k = ini(t, LM.NEG(t.id)); const id = Math.max(30, ...k.cotiz.map(c => c.id)) + 1; k.cotiz.push({ id, cli: d.get('n'), cel: String(d.get('c') || '').replace(/\D/g, ''), obra: d.get('o'), items: k.ticket.map(l => [l.id, l.q]), f: Date.now(), estado: 'abierta' }); k.ticket = []; LM.save(); closeModal(); LM.rerender(); toast('Cotización COT-' + id + ' guardada'); };
  A['fe-convertir'] = el => { const t = tienda(), k = ini(t, LM.NEG(t.id)), c = k.cotiz.find(x => x.id === +el.dataset.id); const tot = c.items.reduce((a, it) => { const p = PR(it[0]); p.stock = Math.max(0, +(p.stock - it[1]).toFixed(2)); return a + p.p * it[1]; }, 0); vender(t, 'Cotización COT-' + c.id + ' · ' + c.cli, tot, 'efectivo'); c.estado = 'vendida'; LM.save(); LM.rerender(); toast('Cotización vendida: ' + pesos(tot)); };

  /* ======================= PESCA: acopio, venta por libra, liquidación ======================= */
  function pAcopio(t, N) {
    const k = ini(t, N), ps = LM.S.prods.filter(p => p.t === t.id);
    const deuda = {}; k.acopio.forEach(a => { if (!a.pagado) deuda[a.p] = (deuda[a.p] || 0) + a.lb * a.pc; });
    const hoy = k.acopio.filter(a => a.f === hoyISO());
    return LM.head('Acopio y nevera', 'Lo que trae cada pescador entra a la nevera; se vende por libra y a cada pescador se le liquida lo suyo.') +
      '<div class="g3 num"><div class="kpi"><small>Recibido hoy</small><b>' + num(hoy.reduce((a, x) => a + x.lb, 0)) + ' lb</b><span>De ' + new Set(hoy.map(x => x.p)).size + ' pescadores</span></div><div class="kpi"><small>Por pagar a pescadores</small><b>' + pesos(Object.values(deuda).reduce((a, b) => a + b, 0)) + '</b><span>Liquidación</span></div><div class="kpi"><small>En la nevera</small><b>' + num(ps.reduce((a, p) => a + p.stock, 0)) + ' lb</b><span>Para vender</span></div></div>' +
      '<div class="g2"><form class="box stack" data-form="pe-recibir"><h3 style="margin:0">Recibir pescado</h3><div class="row2"><div class="campo"><label for="peP">Pescador</label><input id="peP" name="p" required list="pePs"><datalist id="pePs">' + [...new Set(k.acopio.map(a => a.p))].map(p => '<option>' + esc(p) + '</option>').join('') + '</datalist></div><div class="campo"><label for="peE">Especie</label><select id="peE" name="e">' + ps.map(p => '<option value="' + p.id + '">' + esc(p.n) + '</option>').join('') + '</select></div></div>' +
      '<div class="row2"><div class="campo"><label for="peL">Libras</label><input id="peL" name="lb" type="number" min="0.5" step="0.5" required></div><div class="campo"><label for="peC">Precio de compra por libra</label><input id="peC" name="pc" type="number" min="0" step="500" required value="6000"></div></div><button class="btn b-sol" type="submit">' + ic('plus') + 'Recibir</button></form>' +
      '<form class="box stack" data-form="pe-precios"><h3 style="margin:0">Precio de venta hoy (se ve en la app)</h3>' + ps.map(p => '<div class="row2"><div><b>' + esc(p.n) + '</b><br><small class="muted">Hay ' + num(p.stock) + ' lb</small></div><div class="campo"><label for="pp' + p.id + '">Por libra</label><input id="pp' + p.id + '" name="' + p.id + '" type="number" min="0" step="500" value="' + p.p + '"></div></div>').join('') + '<button class="btn" type="submit">Guardar precios</button></form></div>' +
      box('Acopio de hoy', hoy.length ? '<div class="tbl-w"><table class="tbl"><thead><tr><th>Pescador</th><th>Especie</th><th class="r">Libras</th><th class="r">Compra</th><th class="r">Le debemos</th></tr></thead><tbody>' + hoy.map(a => '<tr><td>' + esc(a.p) + '</td><td>' + esc(PR(a.e).n) + '</td><td class="r num">' + num(a.lb) + '</td><td class="r num">' + pesos(a.pc) + '</td><td class="r num"><b>' + pesos(a.lb * a.pc) + '</b></td></tr>').join('') + '</tbody></table></div>' : vacio('Hoy no ha llegado pescado.')) +
      box('Liquidación (lo que se le debe a cada pescador)', Object.keys(deuda).length ? Object.keys(deuda).map(p => '<div class="kv"><span>' + esc(p) + '</span><span><b class="num">' + pesos(deuda[p]) + '</b> <button class="btn b-sm" type="button" data-act="pe-pagar" data-p="' + esc(p) + '">' + ic('cash') + 'Pagar</button></span></div>').join('') + '<p class="muted" style="font-size:13px">Al pagar, queda como gasto del día.</p>' : vacio('No se le debe nada a nadie.'));
  }
  F['pe-recibir'] = (f, d) => { const t = tienda(), k = ini(t, LM.NEG(t.id)), p = PR(d.get('e')), lb = +d.get('lb'); k.acopio.push({ p: String(d.get('p')).trim(), e: p.id, lb, pc: +d.get('pc'), f: hoyISO() }); p.stock = +(p.stock + lb).toFixed(2); LM.save(); LM.rerender(); toast('Recibido: ' + num(lb) + ' lb de ' + p.n); };
  F['pe-precios'] = (f, d) => { const t = tienda(); LM.S.prods.filter(p => p.t === t.id).forEach(p => { const v = +d.get(p.id); if (v > 0) p.p = v; }); LM.save(); LM.rerender(); toast('Precios del día guardados'); };
  A['pe-pagar'] = el => { const t = tienda(), k = ini(t, LM.NEG(t.id)); let v = 0; k.acopio.forEach(a => { if (a.p === el.dataset.p && !a.pagado) { v += a.lb * a.pc; a.pagado = true; } }); gastar(t, 'Pago a pescador: ' + el.dataset.p, v); LM.save(); LM.rerender(); toast('Pagado: ' + pesos(v)); };

  /* ======================= QUESERA: leche, producción y encargos ======================= */
  function pProduccion(t, N) {
    const k = ini(t, N), hoyL = k.leche.filter(x => x.f === hoyISO()), litros = hoyL.reduce((a, x) => a + x.l, 0), pr0 = k.prod.find(x => x.f === hoyISO()) || { queso: 0, suero: 0 };
    return LM.head('Producción y encargos', 'Leche que entra por finca, queso que sale y encargos con fecha de entrega.') +
      '<div class="g3 num"><div class="kpi"><small>Leche hoy</small><b>' + num(litros) + ' L</b><span>De ' + hoyL.length + ' fincas</span></div><div class="kpi"><small>Queso producido</small><b>' + num(pr0.queso) + ' kg</b><span>' + (pr0.queso ? num(litros / pr0.queso) + ' litros por kilo' : 'Anótalo abajo') + '</span></div><div class="kpi"><small>Por pagar a lecheros</small><b>' + pesos(k.leche.filter(x => !x.pagado).reduce((a, x) => a + x.l * x.pl, 0)) + '</b><span>Se paga por quincena</span></div></div>' +
      '<div class="g2"><form class="box stack" data-form="qu-leche"><h3 style="margin:0">Recibir leche</h3><div class="row2"><div class="campo"><label for="quF">Finca</label><input id="quF" name="finca" required></div><div class="campo"><label for="quQ">Lechero</label><input id="quQ" name="quien"></div></div><div class="row2"><div class="campo"><label for="quL">Litros</label><input id="quL" name="l" type="number" min="1" required></div><div class="campo"><label for="quP">Precio por litro</label><input id="quP" name="pl" type="number" min="0" step="50" value="2800"></div></div><button class="btn b-sol" type="submit">' + ic('plus') + 'Recibir</button></form>' +
      '<form class="box stack" data-form="qu-prod"><h3 style="margin:0">Producción de hoy</h3><div class="row2"><div class="campo"><label for="quK">Queso (kg)</label><input id="quK" name="q" type="number" min="0" step="0.5" value="' + pr0.queso + '"></div><div class="campo"><label for="quS">Suero (botellas)</label><input id="quS" name="s" type="number" min="0" value="' + pr0.suero + '"></div></div><button class="btn" type="submit">Guardar y sumar al inventario</button><small class="muted">El queso entra al inventario en libras (1 kg = 2 lb).</small></form></div>' +
      encargosH(k) +
      box('Leche recibida hoy', hoyL.length ? hoyL.map(x => '<div class="kv"><span>' + esc(x.h || '') + ' · ' + esc(x.finca) + ' · ' + esc(x.quien || '') + '</span><b class="num">' + num(x.l) + ' L</b></div>').join('') : vacio('Hoy no ha llegado leche.'));
  }
  F['qu-leche'] = (f, d) => { const k = ini(tienda(), LM.NEG(ses().t)); k.leche.push({ finca: d.get('finca'), quien: d.get('quien'), l: +d.get('l'), pl: +d.get('pl') || 0, h: hora(), f: hoyISO() }); LM.save(); LM.rerender(); toast('Leche recibida'); };
  F['qu-prod'] = (f, d) => {
    const t = tienda(), k = ini(t, LM.NEG(t.id)); let x = k.prod.find(y => y.f === hoyISO()); if (!x) { x = { f: hoyISO(), queso: 0, suero: 0 }; k.prod.push(x); }
    const dq = Math.max(0, (+d.get('q') || 0) - x.queso), ds = Math.max(0, (+d.get('s') || 0) - x.suero); x.queso = +d.get('q') || 0; x.suero = +d.get('s') || 0;
    const q = LM.PR('queso-costeno'), s = LM.PR('suero-costeno'); if (q && q.t === t.id) q.stock = +(q.stock + dq * 2).toFixed(1); if (s && s.t === t.id) s.stock += ds;
    LM.save(); LM.rerender(); toast('Producción guardada');
  };

  /* ======================= encargos (quesera y granja) ======================= */
  function encargosH(k) {
    return box('Encargos', (k.encargos.length ? k.encargos.slice().sort((a, b) => a.fecha.localeCompare(b.fecha)).map(e => '<div class="kv"><span><b>' + esc(e.para) + '</b> · ' + esc(e.que) + '<br><small class="muted">Entrega ' + new Date(e.fecha + 'T12:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) + (e.semanal ? ' · se repite cada semana' : '') + '</small></span><span><span class="pill ' + (e.estado === 'listo' ? 'p-ok' : e.estado === 'entregado' ? 'p-gris' : 'p-warn') + '">' + esc(e.estado) + '</span> ' +
      (e.estado === 'pendiente' ? '<button class="btn b-sm" type="button" data-act="en-est" data-id="' + e.id + '" data-e="listo">Listo</button>' : e.estado === 'listo' ? '<button class="btn b-sm b-monte" type="button" data-act="en-est" data-id="' + e.id + '" data-e="entregado">Entregado</button>' : '') + '</span></div>').join('') : vacio('Sin encargos.')) +
      '<form class="inline" data-form="en-nuevo" style="margin-top:10px;flex-wrap:wrap"><input name="para" required placeholder="Para quién" aria-label="Para quién"><input name="que" required placeholder="Qué" aria-label="Qué"><input name="fecha" type="date" required aria-label="Fecha de entrega" value="' + hoyISO() + '"><label class="mt-ck"><input type="checkbox" name="sem"> Cada semana</label><button class="btn b-sm b-sol" type="submit">' + ic('plus') + 'Nuevo encargo</button></form><p class="muted" style="font-size:13px;margin:6px 0 0">Los encargos apartan el producto para que no se venda por fuera.</p>');
  }
  F['en-nuevo'] = (f, d) => { const k = ini(tienda(), LM.NEG(ses().t)); k.encargos.push({ id: Date.now(), para: d.get('para'), que: d.get('que'), fecha: d.get('fecha'), estado: 'pendiente', semanal: !!d.get('sem') }); LM.save(); LM.rerender(); toast('Encargo anotado'); };
  A['en-est'] = el => {
    const k = ini(tienda(), LM.NEG(ses().t)), e = k.encargos.find(x => x.id === +el.dataset.id); e.estado = el.dataset.e;
    if (e.estado === 'entregado' && e.semanal) { const d = new Date(e.fecha + 'T12:00'); d.setDate(d.getDate() + 7); k.encargos.push(Object.assign({}, e, { id: Date.now(), fecha: d.toISOString().slice(0, 10), estado: 'pendiente' })); e.semanal = false; }
    LM.save(); LM.rerender();
  };

  /* ======================= GRANJA: recolección y encargos ======================= */
  function pGranja(t, N) {
    const k = ini(t, N), hoy = k.reco.filter(r => r.f === hoyISO()), h = hoy.reduce((a, r) => a + r.h, 0);
    return LM.head('Recolección y encargos', 'Huevos recogidos por galpón y encargos con fecha. Lo del día se publica solo en la app.') +
      '<div class="g3 num"><div class="kpi"><small>Huevos hoy</small><b>' + h + '</b><span>' + Math.floor(h / 30) + ' panales y ' + (h % 30) + ' sueltos</span></div><div class="kpi"><small>Rotos hoy</small><b>' + hoy.reduce((a, r) => a + r.rotos, 0) + '</b><span>No se venden</span></div><div class="kpi"><small>Encargos por entregar</small><b>' + k.encargos.filter(e => e.estado !== 'entregado').length + '</b><span>Esta semana</span></div></div>' +
      '<div class="g2"><form class="box stack" data-form="gr-reco"><h3 style="margin:0">Anotar recolección</h3><div class="campo"><label for="grG">Galpón</label><select id="grG" name="g">' + k.galpones.map(g => '<option>' + esc(g.n) + '</option>').join('') + '</select></div><div class="row2"><div class="campo"><label for="grH">Huevos buenos</label><input id="grH" name="h" type="number" min="0" required></div><div class="campo"><label for="grR">Rotos</label><input id="grR" name="r" type="number" min="0" value="0"></div></div><button class="btn b-sol" type="submit">' + ic('plus') + 'Anotar y sumar al inventario</button><small class="muted">Cada 30 huevos suman un panal al producto "Huevos criollos x 30".</small></form>' +
      box('Por galpón hoy', k.galpones.map(g => { const r = hoy.filter(x => x.g === g.n); return '<div class="kv"><span>' + esc(g.n) + ' · ' + g.aves + ' gallinas</span><b class="num">' + r.reduce((a, x) => a + x.h, 0) + ' huevos</b></div>'; }).join('')) + '</div>' + encargosH(k);
  }
  F['gr-reco'] = (f, d) => { const t = tienda(), k = ini(t, LM.NEG(t.id)), h = +d.get('h') || 0; k.reco.push({ f: hoyISO(), g: d.get('g'), h, rotos: +d.get('r') || 0 }); const p = LM.PR('huevos30'); if (p && p.t === t.id) { k.sueltos = (k.sueltos || 0) + h; p.stock += Math.floor(k.sueltos / 30); k.sueltos %= 30; } LM.save(); LM.rerender(); toast('Recolección anotada'); };

  /* ======================= DISTRIBUIDORA: rutas de preventa ======================= */
  function pRutas(t, N) {
    const k = ini(t, N), ps = LM.S.prods.filter(p => p.t === t.id);
    const pedido = k.paradas.filter(p => p.estado === 'pedido').reduce((a, p) => a + p.valor, 0);
    return LM.head('Rutas y preventa', 'El vendedor visita cada tienda de la ruta, toma el pedido desde el celular y cobra la cartera. La bodega lo alista para el camión.') +
      '<div class="g3 num"><div class="kpi"><small>Ruta de hoy</small><b>' + k.paradas.length + ' tiendas</b><span>' + esc(k.ruta.vendedor) + ' · ' + esc(k.ruta.nombre) + '</span></div><div class="kpi"><small>Pedidos tomados</small><b>' + pesos(pedido) + '</b><span>' + k.paradas.filter(p => p.estado === 'pedido').length + ' tiendas</span></div><div class="kpi"><small>Cartera por cobrar</small><b>' + pesos(Object.values(k.cartera).reduce((a, b) => a + b, 0)) + '</b><span>' + Object.keys(k.cartera).length + ' tiendas</span></div></div>' +
      box('Paradas de hoy', k.paradas.map((p, i) => { const tt = LM.T(p.tid) || { n: p.tid }; return '<div class="mt-parada"><span class="av">' + (LM.T(p.tid) ? LM.logoH(tt) : '') + '</span><div><b>' + esc(tt.n) + '</b><small class="muted">' + esc(p.h || '') + (k.cartera[p.tid] ? ' · debe ' + pesos(k.cartera[p.tid]) : '') + '</small></div><span class="pill ' + (p.estado === 'pedido' ? 'p-ok' : p.estado === 'pendiente' ? 'p-gris' : 'p-warn') + '">' + esc(p.estado === 'pedido' ? 'pedido ' + pesos(p.valor) : p.estado) + '</span>' +
        (p.estado === 'pendiente' ? '<span class="quick"><button class="btn b-sm b-sol" type="button" data-act="ru-pedido" data-i="' + i + '">Tomar pedido</button><button class="btn b-sm" type="button" data-act="ru-sin" data-i="' + i + '">Sin pedido</button></span>' : '') + (k.cartera[p.tid] ? '<button class="btn b-sm" type="button" data-act="ru-cobrar" data-t="' + p.tid + '">' + ic('cash') + 'Cobró</button>' : '') + '</div>'; }).join('')) +
      '<button class="btn b-lg b-monte" type="button" data-act="ru-camion">' + ic('box') + 'Armar camión de mañana · ' + k.paradas.filter(p => p.estado === 'pedido' && !p.cargado).length + ' pedidos</button>' +
      '<p class="muted" style="font-size:13px">Catálogo para tiendas: ' + ps.map(p => esc(p.n) + ' ' + pesos(p.p)).join(' · ') + '</p>';
  }
  A['ru-pedido'] = el => {
    const t = tienda(), ps = LM.S.prods.filter(p => p.t === t.id);
    sheet('<div class="sh-h"><div class="tt"><small>Preventa</small><h3>Pedido de la tienda</h3></div><button class="x" type="button" data-act="cerrar" aria-label="Cerrar">' + ic('x') + '</button></div><form class="sh-b stack" data-form="ru-ped" data-i="' + el.dataset.i + '">' + ps.map(p => '<div class="row2"><div><b>' + esc(p.n) + '</b><br><small class="muted">' + pesos(p.p) + '</small></div><div class="campo"><label for="rq' + p.id + '">Cantidad</label><input id="rq' + p.id + '" name="' + p.id + '" type="number" min="0" value="0"></div></div>').join('') + '<button class="btn b-sol b-lg" type="submit">Guardar pedido</button></form>');
  };
  F['ru-ped'] = (f, d) => { const t = tienda(), k = ini(t, LM.NEG(t.id)), pa = k.paradas[+f.dataset.i]; let v = 0; LM.S.prods.filter(p => p.t === t.id).forEach(p => { v += (+d.get(p.id) || 0) * p.p; }); pa.estado = v ? 'pedido' : 'sin pedido'; pa.valor = v; pa.h = hora(); LM.save(); closeModal(); LM.rerender(); toast(v ? 'Pedido tomado: ' + pesos(v) : 'Sin pedido'); };
  A['ru-sin'] = el => { const k = ini(tienda(), LM.NEG(ses().t)), pa = k.paradas[+el.dataset.i]; pa.estado = 'sin pedido'; pa.h = hora(); LM.save(); LM.rerender(); };
  A['ru-cobrar'] = el => { const t = tienda(), k = ini(t, LM.NEG(t.id)), v = k.cartera[el.dataset.t]; vender(t, 'Cobro de cartera · ' + (LM.T(el.dataset.t) || {}).n, v, 'efectivo'); delete k.cartera[el.dataset.t]; LM.save(); LM.rerender(); toast('Cobrado ' + pesos(v)); };
  A['ru-camion'] = () => { const t = tienda(), k = ini(t, LM.NEG(t.id)); const ls = k.paradas.filter(p => p.estado === 'pedido' && !p.cargado); if (!ls.length) { toast('No hay pedidos nuevos para cargar.'); return; } ls.forEach(p => { p.cargado = true; vender(t, 'Pedido de ' + (LM.T(p.tid) || {}).n + ' (a crédito)', p.valor, 'fiado'); k.cartera[p.tid] = (k.cartera[p.tid] || 0) + p.valor; }); LM.save(); LM.rerender(); toast('Camión armado con ' + ls.length + ' pedidos'); };

  /* ======================= DROGUERÍA: fórmulas y vencimientos ======================= */
  const rxPend = t => { const k = ini(t, LM.NEG(t.id)); return LM.S.orders.filter(o => o.t === t.id && !o.rech && o.items.some(i => (LM.PR(i.id) || {}).rx) && !k.rx[o.n]); };
  function pFormulas(t, N) {
    const k = ini(t, N), pend = rxPend(t);
    return LM.head('Fórmulas y vencimientos', 'Los antibióticos y medicamentos de control solo salen con fórmula médica. Primero se vende lo que vence antes.') +
      box('Pedidos que necesitan fórmula', pend.length ? pend.map(o => '<div class="mt-ped"><div class="mt-ped-h"><b>Pedido #' + o.n + '</b><span>' + esc(o.cliN || o.cli) + '</span><span class="pill p-warn">' + ic('alert') + 'Requiere fórmula</span></div><p style="margin:6px 0">' + o.items.map(i => i.q + ' × ' + esc((LM.PR(i.id) || {}).n)).join(', ') + '</p>' +
        '<p class="muted" style="margin:0 0 8px">Pídele al cliente la foto de la fórmula por el chat del pedido. Revisa medicamento, dosis, fecha y firma del médico. El domiciliario debe ver la fórmula original al entregar.</p><div class="quick"><button class="btn b-sm" type="button" data-act="orden" data-n="' + o.n + '">' + ic('chat') + 'Abrir chat</button><button class="btn b-sm b-monte" type="button" data-act="rx-ok" data-n="' + o.n + '">' + ic('check') + 'Fórmula válida</button><button class="btn b-sm b-rojo" type="button" data-act="rx-no" data-n="' + o.n + '">Rechazar</button></div></div>').join('') : vacio('No hay pedidos con medicamentos de fórmula.')) +
      box('Próximos a vencer', '<div class="tbl-w"><table class="tbl"><thead><tr><th>Producto</th><th>Lote</th><th>Vence</th><th class="r">Unidades</th></tr></thead><tbody>' + k.vence.slice().sort((a, b) => a.f.localeCompare(b.f)).map(l => { const da = diasA(l.f); return '<tr><td><span class="mt-dot ' + (da <= 45 ? 'r' : da <= 120 ? 'a' : 'v') + '"></span>' + esc(l.n) + '</td><td class="num">' + esc(l.lote) + '</td><td class="num">' + esc(l.f) + (da <= 45 ? ' <b style="color:var(--rojo)">(' + da + ' días)</b>' : '') + '</td><td class="r num">' + l.u + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<form class="inline" data-form="rx-lote" style="margin-top:10px;flex-wrap:wrap"><input name="n" required placeholder="Producto" aria-label="Producto"><input name="lote" required placeholder="Lote" aria-label="Lote" style="max-width:110px"><input name="f" type="date" required aria-label="Vence"><input name="u" type="number" min="1" required placeholder="Unidades" aria-label="Unidades" style="max-width:110px"><button class="btn b-sm b-sol" type="submit">' + ic('plus') + 'Anotar lote</button></form>') +
      box('Presentaciones', '<p style="margin:0">En el punto de venta, el acetaminofén se vende por <b>tableta</b>, <b>blíster</b> o <b>caja</b>: la caja pregunta cuál y cobra su precio. Agrega presentaciones a otros productos desde Productos → Opciones.</p>');
  }
  A['rx-ok'] = el => { const t = tienda(), k = ini(t, LM.NEG(t.id)); k.rx[+el.dataset.n] = 'ok'; LM.logN(t.id, 'Aprobó la fórmula del pedido #' + el.dataset.n); LM.save(); LM.rerender(); toast('Fórmula aprobada. Ya puedes aceptar y despachar el pedido.'); };
  A['rx-no'] = el => { const t = tienda(), k = ini(t, LM.NEG(t.id)); k.rx[+el.dataset.n] = 'no'; const o = LM.S.orders.find(x => x.n === +el.dataset.n); if (o) { o.rech = true; o.chat.push({ de: 'n', m: 'No pudimos despachar: el medicamento necesita una fórmula médica válida.', h: hora() }); } LM.logN(t.id, 'Rechazó la fórmula del pedido #' + el.dataset.n); LM.save(); LM.rerender(); };
  F['rx-lote'] = (f, d) => { const k = ini(tienda(), LM.NEG(ses().t)); k.vence.push({ n: d.get('n'), lote: d.get('lote'), f: d.get('f'), u: +d.get('u') }); LM.save(); LM.rerender(); toast('Lote anotado'); };

  /* ======================= BARBERÍA: la fila del local ======================= */
  const _turnos = LM.EXT.panelFn.turnos;
  if (_turnos) {
    const pTurnos9 = (t, N, o, c) => {
      const k = ini(t, N);
      return '<div class="box mt-fila"><h3>' + ic('users') + 'Fila del local (llegaron sin turno)</h3>' + (k.fila.length ? k.fila.map((x, i) => '<div class="kv"><span><b class="num">' + (i + 1) + '</b> · ' + esc(x.n) + ' · ' + esc(x.s) + ' <small class="muted">llegó ' + esc(x.h) + ' · espera ~' + ((i + 1) * 15) + ' min</small></span><button class="btn b-sm b-sol" type="button" data-act="fi-pasar" data-id="' + x.id + '">Pasa a la silla</button></div>').join('') : vacio('Nadie en la fila.')) +
        '<form class="inline" data-form="fi-nuevo" style="margin-top:8px"><input name="n" required placeholder="Nombre" aria-label="Nombre"><input name="s" placeholder="Servicio" aria-label="Servicio" value="Corte"><button class="btn b-sm" type="submit">' + ic('plus') + 'Anotar en la fila</button></form></div>' + _turnos(t, N, o, c);
    };
    pTurnos9.cajero = _turnos.cajero;
    LM.EXT.panelFn.turnos = pTurnos9;
  }
  F['fi-nuevo'] = (f, d) => { const k = ini(tienda(), LM.NEG(ses().t)); k.fila.push({ id: Date.now(), n: d.get('n'), s: d.get('s') || 'Corte', h: hora() }); LM.save(); LM.rerender(); };
  A['fi-pasar'] = el => { const t = tienda(), N = LM.NEG(t.id), k = ini(t, N), i = k.fila.findIndex(x => x.id === +el.dataset.id), x = k.fila[i]; k.fila.splice(i, 1); if (N.turnos) N.turnos.push({ id: Date.now(), h: new Date().toTimeString().slice(0, 5), cli: x.n, cel: '', pid: (LM.S.prods.find(p => p.t === t.id && /corte/i.test(p.n)) || {}).id, emp: N.emp[0].n, casa: false, estado: 'pendiente' }); LM.save(); LM.rerender(); toast(x.n + ' pasa a la silla'); };

  Object.assign(LM.EXT.panelFn, { mayor: pMayor, medida: pMedida, acopio: pAcopio, produccion: pProduccion, granja: pGranja, rutas: pRutas, formulas: pFormulas });
  [pMayor, pMedida, pAcopio, pProduccion, pGranja, pFormulas].forEach(f => { f.cajero = true; });

  // Cuentas de demostración de los negocios nuevos (usuario = id del negocio, clave 1234)
  sembrar();
  LM.save();
})();
