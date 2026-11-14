/* Mi Tienda · Servus 0.1 · DATOS DE EJEMPLO
   Fotos reales de los productos y de las personas, perfil público de cada negocio (portada, dueño,
   seguidores), combos, cupones nuevos (valor fijo, porcentaje o regalo) y el equipo de cada negocio
   con un usuario por cargo para entrar y verlo lleno. Todo es de demostración: el dueño lo cambia. */
(function () {
  'use strict';
  const LM = window.LM;
  const SV = LM.sv = LM.sv || {};
  // fotos de productos y portadas en galeria/ · personas y logos en img/sv/ (así cada carpeta tiene menos de 100 archivos para subirla a GitHub)
  const F = n => (/^f-/.test(n) ? 'galeria/' : 'img/sv/') + n + '.jpg';
  const L = n => 'img/sv/l-' + n + '.png';
  SV.foto = F; SV.logo = L;
  // las fotos que van en variables de CSS necesitan la dirección completa (si no, se buscan dentro de css/)
  SV.abs = u => { try { return /^data:/.test(u) ? u : new URL(u, location.href).href; } catch (e) { return u; } };

  /* ---------- íconos que no traía la app ---------- */
  const P2 = {
    power: '<path d="M12 3v8"/><path d="M6.3 7.3a8 8 0 1 0 11.4 0"/>',
    mapa: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    regla: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
    camion: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    hoja: '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19 13 11"/>',
    huevo: '<path d="M12 3c3.5 0 6 5.5 6 10a6 6 0 0 1-12 0c0-4.5 2.5-10 6-10z"/>',
    gota: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    pastilla: '<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M12 8v8"/>',
    sobre: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
    reloj2: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    ojo2: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    gana: '<path d="M4 17l6-6 4 4 6-7"/><path d="M14 8h6v6"/>',
    wa: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c.3 2 2.5 4.3 4.5 4.7l1.2-1.2 1.8.8-.4 1.6c-3.6.3-7.4-3.4-7.3-7.2l1.6-.4.8 1.8z"/>',
    pausa2: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
    tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    arriba: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    imagen: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
    megafono: '<path d="M3 10v4h4l6 4V6L7 10z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
    power: '<path d="M12 3v8"/><path d="M6.3 7.3a8 8 0 1 0 11.4 0"/>',
    escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    subir: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>'
  };
  SV.ic = (n, c) => P2[n] ? '<svg viewBox="0 0 24 24" class="ic ' + (c || '') + '" aria-hidden="true">' + P2[n] + '</svg>' : LM.ic(n, c);

  /* ---------- fotos de los productos ---------- */
  const FOTO = {
    asado: 'f-lena-fuego', sancocho: 'f-fogon', bandeja: 'f-puesto-comida', pollo: 'f-lena', costilla: 'f-fogon', hamburguesa: 'f-hamburguesa',
    'hamburguesa-rc': 'f-hamburguesa', jugo: 'f-jugo', 'jugo-natural': 'f-arandanos', salpicon: 'f-fresas', raspao: 'f-helado', gaseosa: 'f-bebida', gaseosa400: 'f-bebida',
    cerveza: 'f-bebida', cerveza1: 'f-bebida', picada: 'f-cafe-local', cuaderno: 'f-cuaderno', kit: 'f-libros', regalo: 'f-velas', fruta: 'f-pina',
    mojarraviva: 'f-canoas-rojas', cachama: 'f-canoas', bocachico: 'f-muelle-gente', 'bocachico-lb': 'f-canoa', bagre: 'f-rio', 'mojarra-cienaga': 'f-muelle',
    vestido: 'f-vestido', camisa: 'f-moda-saco', uniforme: 'f-moda-buzo', chancla: 'f-tenis', concentrado: 'f-gallinas', semilla: 'f-cultivo', urea: 'f-campo',
    huevos30: 'f-gallina', 'pollo-criollo': 'f-gallinas', 'gallina-criolla': 'f-gallina', kitarrastre: 'f-rueda', llanta: 'f-rueda', aceite: 'f-rueda', mercadito: 'f-repollo',
    'cafe-grano': 'f-cafe-grano', pina: 'f-pina', 'concentrado-perro': 'f-perro', 'semilla-maiz': 'f-flores-amarillas', 'vestido-camisero': 'f-vestido', gafas: 'f-gafas',
    sombrero: 'f-sombrero', buzo: 'f-moda-buzo', mandarina: 'f-mandarina', arveja: 'f-arveja', ahuyama: 'f-ahuyama', limon: 'f-limon', huevo: 'f-gallina',
    'tenis-lona': 'f-tenis', fresas: 'f-fresas', helado: 'f-helado', 'saco-dril': 'f-moda-saco', 'chaqueta-jean': 'f-tienda-ropa', 'tenis-calzado': 'f-tenis', 'sandalias': 'f-tenis',
    corte: 'f-reloj', 'gallina-viva': 'f-gallinas', 'ponedora': 'f-gallinas'
  };
  SV.fotoProd = id => FOTO[id] ? F(FOTO[id]) : '';

  /* ---------- productos nuevos (para "Más para ti", combos y la tienda) ---------- */
  const pr = (id, n, t, sub, i, p, stock, d, extra) => Object.assign({ id, n, t, sub, i, p, r: 4.7, rc: 20, v: 40, stock, nuevo: false, d, disp: true, sv: true }, extra || {});
  const PRODS = [
    pr('hamburguesa-rc', 'Hamburguesa con papas a la francesa', 'rancho', 'Rápidas', 'hamburguesa', 22500, 40, 'Carne de la casa, papas y salsa de la casa.', { r: 4.9, rc: 212, v: 1200 }),
    pr('helado', 'Cono de helado de vainilla', 'chimi', 'Helados', 'cono', 3000, 60, 'Helado artesanal, bien frío.', { r: 4.8, rc: 98, v: 980 }),
    pr('cafe-grano', 'Café en grano de la Serranía 500 g', 'granero', 'Víveres', 'saco', 12500, 80, 'Café tostado de la Serranía de San Lucas.', { r: 4.8, rc: 41, v: 310 }),
    pr('pina', 'Piña oro miel grande', 'tienda', 'Mercado', 'fruta', 6000, 30, 'Dulce y jugosa.', { r: 4.7, rc: 22, v: 220 }),
    pr('mandarina', 'Mandarina por unidad', 'tienda', 'Mercado', 'fruta', 400, 200, 'De la región.', { r: 4.6, rc: 18, v: 150 }),
    pr('limon', 'Limón por unidad', 'tienda', 'Mercado', 'fruta', 200, 300, 'Limón Tahití.', { r: 4.6, rc: 12, v: 400 }),
    pr('huevo', 'Huevo por unidad', 'tienda', 'Mercado', 'bolsa', 600, 300, 'Huevo rojo AA.', { r: 4.7, rc: 30, v: 900 }),
    pr('fresas', 'Fresas por libra', 'tienda', 'Mercado', 'fruta', 4900, 25, 'Fresas frescas.', { r: 4.7, rc: 40, v: 540 }),
    pr('arveja', 'Arveja verde por libra', 'campo', 'Frutas', 'hojas', 3500, 40, 'Desgranada del día.', { r: 4.6, rc: 15, v: 90 }),
    pr('ahuyama', 'Ahuyama por kilo', 'campo', 'Frutas', 'hojas', 2500, 40, 'De las fincas de Chimí.', { r: 4.6, rc: 11, v: 80 }),
    pr('concentrado-perro', 'Concentrado para perro · bulto 20 kg', 'agro', 'Alimento animal', 'perro', 96000, 22, 'Para perro adulto.', { r: 4.8, rc: 36, v: 95 }),
    pr('semilla-maiz', 'Semilla de maíz · bolsa 20 kg', 'agro', 'Semillas y abonos', 'campo', 210000, 12, 'Maíz amarillo certificado.', { r: 4.6, rc: 14, v: 30 }),
    pr('vestido-camisero', 'Vestido camisero vinotinto', 'ropa', 'Dama', 'camisa', 65000, 9, 'Tallas S a XL.', { r: 4.7, rc: 41, v: 60 }),
    pr('buzo', 'Buzo tejido', 'ropa', 'Dama', 'camisa', 52000, 12, 'Tejido fresco.', { r: 4.6, rc: 22, v: 60 }),
    pr('saco-dril', 'Saco de dril', 'ropa', 'Dama', 'camisa', 68000, 8, 'Dril grueso.', { r: 4.6, rc: 15, v: 40 }),
    pr('sombrero', 'Sombrero vueltiao', 'ropa', 'Caballero', 'camisa', 85000, 6, 'Hecho a mano.', { r: 4.9, rc: 27, v: 30 }),
    pr('gafas', 'Gafas de sol con filtro UV', 'ropa', 'Dama', 'sol', 32000, 15, 'Filtro UV 400.', { r: 4.5, rc: 19, v: 70 }),
    pr('chaqueta-jean', 'Chaqueta de jean para las fiestas', 'ropa', 'Dama', 'camisa', 58000, 10, 'Jean azul clásico.', { r: 4.6, rc: 64, v: 64 }),
    pr('tenis-lona', 'Tenis blancos de lona', 'calzado', 'Calzado', 'camisa', 89900, 20, 'Tallas 35 a 43. Cambio de talla gratis.', { r: 4.8, rc: 128, v: 128 }),
    pr('sandalias', 'Sandalias de cuero', 'calzado', 'Calzado', 'camisa', 48000, 14, 'Tallas 35 a 40.', { r: 4.6, rc: 33, v: 50 })
  ];
  // Precio rebajado de los que salen en "Súper ofertas" y en los combos
  const PROMOS = [
    ['sv-o1', 'rancho', 'hamburguesa-rc', 18000, 'Hamburguesa a $18.000'], ['sv-o2', 'tienda', 'fresas', 3900, 'Fresas frescas'],
    ['sv-o3', 'calzado', 'tenis-lona', 73900, 'Tenis de lona'], ['sv-o4', 'pescadores', 'bocachico-lb', 7200, 'Pesca del día'],
    ['sv-o5', 'chimi', 'helado', 2500, 'Cono de vainilla'], ['sv-o6', 'ropa', 'chaqueta-jean', 46400, 'Para las fiestas'],
    ['sv-o7', 'granero', 'cafe-grano', 10800, 'Café de la Serranía'], ['sv-o8', 'granja', 'huevos30', 17000, 'Huevos del día']
  ];

  /* ---------- negocios nuevos y cómo se ven ---------- */
  const tiendaBase = (id, n, cat, ini, color, dir, horario, desc) => ({ id, n, cat, ini, color, r: 4.7, dir, horario, min: 35, desc, abierto: true, tel: '300 61' + id.length + ' 44' + (10 + id.length), nequi: '310 61' + id.length + ' 44' + (10 + id.length),
    zonas: { cabecera: 3000, chimi: 6000, sanmartin: null, barranco: null }, pagos: { efectivo: true, nequi: true, daviplata: true, breb: true, banco: true, fiado: false }, sv: true });
  const TIENDAS = [
    tiendaBase('chimi', 'Variedades Chimí', 'tienda', 'VC', 'fucsia', 'Calle 3, Chimí', '8:00 a. m. – 8:00 p. m.', 'Helados, dulces, papelería y cositas para la casa.'),
    tiendaBase('calzado', 'Calzado El Paso', 'ropa', 'EP', 'tinta', 'Calle del Comercio, Hatillo', '8:00 a. m. – 7:00 p. m.', 'Tenis, sandalias y zapatos por talla. Cambios en 5 días.')
  ];
  // Nombre, logo, dueño y portada de cada negocio (como en "7 propuestas de interfaz")
  const PERFIL = {
    rancho: { n: 'Rancho Costeño', logo: 'rancho', dueno: 'Don Efraín', foto: 'r-efrain', cargo: 'Dueño y asador desde hace 18 años', frase: 'Asamos con leña de la región, como lo hacía mi papá. Si algo no le gusta, me escribe y se lo cambio.', portada: 'f-puesto-comida', banner: ['Viernes de asado', 'Asado especial con yuca y bollo a $20.000', 'f-lena-fuego'], seg: 2300, res: 1240, r: 4.9, tipo: 'Asadero', dir: 'Calle del Puerto, Hatillo de Loba', hasta: '10 p. m.' },
    tienda: { n: 'Tienda Mi Pueblo', logo: 'mipueblo', dueno: 'Doña Rosa', foto: 'r-rosa', cargo: 'Tendera del barrio desde 2004', frase: 'Aquí le fiamos al vecino de siempre y le apartamos lo que necesite.', portada: 'f-limon', banner: ['Mercado a domicilio', 'Desde $2.000 el domicilio en Hatillo', 'f-fresas'], seg: 1100, res: 410, r: 4.8, tipo: 'Tienda de barrio' },
    drogueria: { n: 'Droguería La Loba', logo: 'drogueria', dueno: 'Liliana', foto: 'r-liliana', cargo: 'Regente de farmacia', frase: 'Le explicamos cómo tomarse cada medicamento. Lo que lleva fórmula, solo con fórmula.', portada: 'f-flores', banner: ['Turno de noche', 'Domicilios de droguería hasta las 10 p. m.', 'f-flores-amarillas'], seg: 1800, res: 530, r: 4.9, tipo: 'Droguería' },
    billar: { n: 'Billares La Carambola', logo: 'billares', dueno: 'Don Álvaro', foto: 'r-alvaro', cargo: 'Dueño · 12 años con el billar', frase: 'Mesas niveladas, paños nuevos y la cerveza bien fría.', portada: 'f-musica-dj', banner: ['Martes de pareja', 'Pool a $6.000 la hora toda la noche', 'f-concierto'], seg: 640, res: 180, r: 4.7, tipo: 'Billares', hasta: '12 a. m.' },
    barberia: { n: 'Barbería El Estilo', logo: 'barberia', dueno: 'Jhon', foto: 'r-jhon', cargo: 'Barbero y dueño', frase: 'Pide tu turno por la app y no hagas fila.', portada: 'f-reloj', banner: ['Corte + barba', 'A $16.000 de lunes a jueves', 'f-reloj'], seg: 920, res: 260, r: 4.8, tipo: 'Barbería' },
    taller: { n: 'Taller El Pistón', logo: 'piston', dueno: 'Ramiro', foto: 'r-ramiro', cargo: 'Mecánico de motos', frase: 'No toco su moto sin que usted apruebe la cotización.', portada: 'f-rueda', banner: ['Revisión gratis', 'Frenos y cadena sin costo con el cambio de aceite', 'f-rueda'], seg: 510, res: 140, r: 4.7, tipo: 'Repuestos y taller' },
    ropa: { n: 'Variedades La Ribereña', logo: 'riberena', dueno: 'Yuleidis', foto: 'r-yuleidis', cargo: 'Dueña', frase: 'Le separamos la prenda con un abono y la paga por cuotas.', portada: 'f-tienda-ropa', banner: ['Temporada de fiestas', 'Chaquetas y vestidos con 20 % menos', 'f-vestido'], seg: 1500, res: 320, r: 4.6, tipo: 'Moda y variedades' },
    agro: { n: 'Agro La Loba', logo: 'agro', dueno: 'Nelly', foto: 'r-nelly', cargo: 'Dueña · zootecnista', frase: 'Vamos a su finca a revisar los animales y el cultivo.', portada: 'f-campo', banner: ['Jornada de vacunación', 'Aftosa: agende la visita a su finca', 'f-cultivo'], seg: 730, res: 150, r: 4.7, tipo: 'Agro y veterinaria' },
    granero: { n: 'Granero Central', logo: 'granero', dueno: 'Ana Milena', foto: 'r-anamilena', cargo: 'Dueña · venta por mayor', frase: 'Precio especial para tenderos registrados.', portada: 'f-cafe-grano', banner: ['Precio tendero', 'Arroz por bulto a $175.000', 'f-cafe-grano'], seg: 880, res: 210, r: 4.7, tipo: 'Granos por mayor' },
    ferreteria: { n: 'Ferretería El Tornillo', logo: 'ferreteria', dueno: 'Don Hernando', foto: '', cargo: 'Ferretero', frase: 'Mándenos la foto de la lista y le cotizamos.', portada: 'f-ladrillo', banner: ['Cotiza tu obra', 'Te mandamos la cotización por WhatsApp', 'f-ladrillo'], seg: 420, res: 110, r: 4.7, tipo: 'Ferretería' },
    pescadores: { n: 'Asociación de Pescadores', logo: 'pescadores', dueno: 'Marlene', foto: 'r-marlene', cargo: 'Presidenta de la asociación', frase: 'Pescado de la ciénaga, del día, pesado delante de usted.', portada: 'f-canoas', banner: ['Pesca del día', 'Bocachico a $8.000 la libra', 'f-canoa'], seg: 690, res: 190, r: 4.8, tipo: 'Pesca' },
    quesera: { n: 'Quesera El Playón', logo: 'quesera', dueno: 'Doña Edith', foto: 'r-edith', cargo: 'Quesera de tradición', frase: 'Queso costeño de leche de las fincas de El Playón.', portada: 'f-campo', banner: ['Encargos para el fin de semana', 'Queso costeño a $10.000 la libra', 'f-campo'], seg: 560, res: 130, r: 4.8, tipo: 'Lácteos' },
    distribuidora: { n: 'Distribuidora Loba', logo: 'distribuidora', dueno: 'Carolina', foto: 'r-carolina', cargo: 'Gerente', frase: 'Preventa martes y viernes; entregamos al día siguiente.', portada: 'f-camioneta', banner: ['Para tenderos', 'Paca de gaseosa a $21.000', 'f-camioneta'], seg: 300, res: 60, r: 4.7, tipo: 'Distribuidora' },
    granja: { n: 'Granja Chimí', logo: 'granja', dueno: 'Luz Dary', foto: 'r-luzdary', cargo: 'Granjera', frase: 'Huevos recogidos hoy y pollo criollo por encargo.', portada: 'f-gallinas', banner: ['Huevos del día', 'Panal de 30 a $18.000', 'f-gallina'], seg: 1100, res: 260, r: 4.8, tipo: 'Huevos y pollo criollo' },
    chimi: { n: 'Variedades Chimí', logo: 'chimi', dueno: 'Keila', foto: 'r-keila', cargo: 'Dueña', frase: 'Helados, dulces y lo que necesite la casa.', portada: 'f-helado', banner: ['Tarde de helado', 'Cono de vainilla a $2.500', 'f-helado'], seg: 480, res: 95, r: 4.7, tipo: 'Variedades' },
    calzado: { n: 'Calzado El Paso', logo: 'calzado', dueno: 'Daniela', foto: 'r-daniela', cargo: 'Dueña', frase: 'Si la talla no le queda, se la cambiamos gratis.', portada: 'f-tenis', banner: ['Cambio de talla gratis', 'Tenis de lona a $73.900', 'f-tenis'], seg: 830, res: 128, r: 4.8, tipo: 'Calzado' }
  };
  // Servus 0.2: portada por tipo de negocio cuando el dueño todavía no sube la suya
  const PORTADA_CAT = { comida: 'f-fogon', rapida: 'f-hamburguesa', tienda: 'f-fresas', farmacia: 'f-planta', papeleria: 'f-libros', deposito: 'f-ladrillo', campo: 'f-cultivo', billar: 'f-concierto', belleza: 'f-gafas',
    taller: 'f-timon', ropa: 'f-tienda-ropa', agro: 'f-campo', mayorista: 'f-cafe-grano', pesca: 'f-canoas', quesera: 'f-campo', distribuidora: 'f-camioneta', granja: 'f-gallinas', mascotas: 'f-gato', cafeteria: 'f-cafeteria' };
  SV.perfil = tid => {
    const t = LM.T(tid) || {}, p = PERFIL[tid] || {};
    const N = LM.NEG(tid), v = (N.sv && N.sv.vitrina) || {};
    const pc = PORTADA_CAT[t.cat] || 'f-campo';
    return Object.assign({ dueno: (N.emp[0] || {}).n || 'Dueño', foto: '', cargo: 'Dueño', frase: t.desc || '', portada: pc, banner: [t.n, t.desc || '', pc], seg: 120, res: 20, r: t.r || 4.6, tipo: (LM.CAT[t.cat] || {}).n || '', dir: t.dir, hasta: '' }, p, v, t.mostrarDueno === false ? { foto: '' } : {});
  };
  // Negocios con el sello Confianza (verificados, entregan a tiempo y reponen si llega mal)
  SV.confianza = tid => ['rancho', 'tienda', 'drogueria', 'granja', 'calzado', 'pescadores', 'chimi', 'ropa', 'granero'].includes(tid);
  SV.PERFIL = PERFIL;
  // Logo de cualquier negocio: el suyo o, si no tiene, uno con sus iniciales y su color
  const LG = {};
  SV.lg = t => {
    if (!t) return '';
    if (t.logo) return t.logo;
    if (!LG[t.id]) { const c = ({ fucsia: '#C2185B', sol: '#D99A00', rio: '#1F5FBF', monte: '#1E8A45', mango: '#E66A00', tinta: '#14181B', lima: '#4E9A2A' })[t.color] || '#0D5C63'; const ini = String(t.ini || t.n.split(' ').map(x => x[0]).join('')).slice(0, 2).toUpperCase();
      LG[t.id] = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="' + c + '"/><text x="32" y="41" font-family="Inter,Arial,sans-serif" font-size="24" font-weight="800" fill="#fff" text-anchor="middle">' + ini.replace(/[<&>]/g, '') + '</text></svg>'); }
    return LG[t.id];
  };

  /* ---------- combos: dos negocios, un solo domicilio ---------- */
  SV.COMBOS = [
    { id: 'cb1', n: 'Almuerzo con postre', items: ['hamburguesa-rc', 'helado'] },
    { id: 'cb2', n: 'Desayuno del campo', items: ['huevos30', 'mandarina'], q: [1, 6] },
    { id: 'cb3', n: 'Asado y jugo', items: ['asado', 'jugo-natural'] },
    { id: 'cb4', n: 'Sancocho completo', items: ['gallina-criolla', 'ahuyama'] }
  ];

  /* ---------- cupones nuevos que crea cada dueño ---------- */
  const domingo = () => { const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7)); d.setHours(23, 59, 0, 0); return d.getTime(); };
  const hoyFin = () => { const d = new Date(); d.setHours(23, 59, 0, 0); return d.getTime(); };
  const CUPONES = () => [
    { id: 'sv-c1', t: 'rancho', code: 'RANCHO2000', tipo: 'fijo', valor: 2000, min: 15000, pct: 0, vence: domingo(), activo: true, usos: 14, svNota: 'Válido hasta el domingo' },
    { id: 'sv-c2', t: 'rancho', code: 'JUGOGRATIS', tipo: 'regalo', regalo: 'Jugo natural gratis', cond: { prod: 'asado', q: 2 }, pct: 0, vence: hoyFin(), activo: true, usos: 6, svNota: 'Solo hoy' },
    { id: 'sv-c3', t: 'tienda', code: 'VECINO5', tipo: 'pct', pct: 5, vence: domingo(), activo: true, usos: 22, svNota: 'En todo el mercado' },
    { id: 'sv-c4', t: 'drogueria', code: 'DOMI0', tipo: 'fijo', valor: 3000, min: 30000, pct: 0, vence: domingo(), activo: true, usos: 9, svNota: 'Domicilio gratis desde $30.000' },
    { id: 'sv-c5', t: 'calzado', code: 'PASO10', tipo: 'pct', pct: 10, vence: domingo(), activo: true, usos: 4, svNota: 'En tenis y sandalias' },
    { id: 'sv-c6', t: 'granja', code: 'PANAL1', tipo: 'regalo', regalo: '6 huevos gratis', cond: { prod: 'huevos30', q: 2 }, pct: 0, vence: domingo(), activo: true, usos: 3, svNota: 'Llevando 2 panales' }
  ];

  /* ---------- el equipo de cada negocio (un usuario por cargo · clave 1234) ---------- */
  // [usuario, nombre, rol de la app, cargo que se ve, foto]
  const EQUIPO = {
    rancho: [['rancho', 'Don Efraín', 'Dueño', 'Dueño', 'r-efrain'], ['rancho-cajero', 'Karen', 'Cajero', 'Cajera', 'e-karen'], ['rancho-mesera', 'Sofía', 'Mesero', 'Mesera', 'e-sofia'], ['rancho-cocina', 'Rubén', 'Cocina', 'Asador', 'e-ruben'], ['rancho-domi', 'Danto', 'Domiciliario', 'Domiciliario de confianza', 'd-danto']],
    billar: [['billar', 'Don Álvaro', 'Dueño', 'Dueño', 'r-alvaro'], ['billar-mesera', 'Keila', 'Mesero', 'Mesera de mesas', 'r-keila'], ['billar-cajero', 'Luis', 'Cajero', 'Cajero', 'u-luis']],
    barberia: [['barberia', 'Jhon', 'Dueño', 'Dueño y barbero', 'r-jhon'], ['barberia-atencion', 'Kevin', 'Atención', 'Barbero', ''], ['barberia-cajero', 'Andrea', 'Cajero', 'Recepción y caja', 'u-andrea']],
    tienda: [['tienda', 'Doña Rosa', 'Dueño', 'Dueña', 'r-rosa'], ['tienda-cajero', 'Valentina', 'Cajero', 'Cajera del mostrador', 'u-valentina'], ['tienda-domi', 'Yeison', 'Domiciliario', 'Domiciliario de confianza', 'd-yeison']],
    drogueria: [['drogueria', 'Liliana', 'Dueño', 'Dueña y regente', 'r-liliana'], ['drogueria-atencion', 'María José', 'Atención', 'Auxiliar de farmacia', 'u-maria'], ['drogueria-cajero', 'Diana', 'Cajero', 'Cajera', 'u-diana']],
    taller: [['taller', 'Ramiro', 'Dueño', 'Dueño y jefe de taller', 'r-ramiro'], ['taller-atencion', 'Elkin', 'Atención', 'Mecánico', ''], ['taller-cajero', 'Yesica', 'Cajero', 'Repuestos y caja', 'u-yesica']],
    granero: [['granero', 'Ana Milena', 'Dueño', 'Dueña', 'r-anamilena'], ['granero-atencion', 'Jairo', 'Atención', 'Despachador', ''], ['granero-cajero', 'Luis', 'Cajero', 'Cajero', 'u-luis']],
    ferreteria: [['ferreteria', 'Don Hernando', 'Dueño', 'Dueño', ''], ['ferreteria-atencion', 'Wilson', 'Atención', 'Vendedor de mostrador', ''], ['ferreteria-cajero', 'Diana', 'Cajero', 'Cajera', 'u-diana']],
    ropa: [['ropa', 'Yuleidis', 'Dueño', 'Dueña', 'r-yuleidis'], ['ropa-atencion', 'Andrea', 'Atención', 'Asesora de ventas', 'u-andrea'], ['ropa-cajero', 'Valentina', 'Cajero', 'Cajera', 'u-valentina']],
    pescadores: [['pescadores', 'Marlene', 'Dueño', 'Presidenta', 'r-marlene'], ['pescadores-atencion', 'Jesús', 'Atención', 'Recibe el pescado', '']],
    quesera: [['quesera', 'Doña Edith', 'Dueño', 'Dueña', 'r-edith'], ['quesera-atencion', 'Wilmer', 'Atención', 'Quesero', '']],
    distribuidora: [['distribuidora', 'Carolina', 'Dueño', 'Gerente', 'r-carolina'], ['distribuidora-atencion', 'Julio', 'Atención', 'Vendedor de ruta', '']],
    agro: [['agro', 'Nelly', 'Dueño', 'Dueña', 'r-nelly'], ['agro-atencion', 'Paola', 'Atención', 'Veterinaria', 'u-andrea'], ['agro-cajero', 'Luis', 'Cajero', 'Mostrador', 'u-luis']],
    granja: [['granja', 'Luz Dary', 'Dueño', 'Dueña', 'r-luzdary'], ['granja-atencion', 'Fredy', 'Atención', 'Galponero', '']],
    chimi: [['chimi', 'Keila', 'Dueño', 'Dueña', 'r-keila'], ['chimi-cajero', 'Valentina', 'Cajero', 'Cajera', 'u-valentina']],
    calzado: [['calzado', 'Daniela', 'Dueño', 'Dueña', 'r-daniela'], ['calzado-cajero', 'Andrea', 'Cajero', 'Cajera', 'u-andrea']]
  };
  SV.EQUIPO = EQUIPO;
  SV.fotoDe = (tid, u) => { const e = (EQUIPO[tid] || []).find(x => x[0] === u); return e && e[4] ? F(e[4]) : ''; };
  SV.cargoDe = (tid, u) => { const N = LM.NEG(tid), e = N.emp.find(x => x.u === u); return (e && e.cargo) || ''; };

  /* ---------- sembrar una sola vez (y completar si faltan cosas) ---------- */
  function sembrar() {
    const S = LM.S;
    TIENDAS.forEach(t => { if (!S.tiendas.some(x => x.id === t.id)) S.tiendas.push(JSON.parse(JSON.stringify(t))); });
    PRODS.forEach(p => { if (!S.prods.some(x => x.id === p.id)) S.prods.push(JSON.parse(JSON.stringify(p))); });
    // nombres, logos y calificación del perfil
    Object.keys(PERFIL).forEach(id => { const t = S.tiendas.find(x => x.id === id), p = PERFIL[id]; if (!t) return; t.n = p.n; t.logo = L(p.logo); t.r = p.r; });
    // fotos de producto (si el dueño no subió la suya)
    S.prods.forEach(p => { const f = SV.fotoProd(p.id); if (f && !p.fotoSrv && (!p.fotoMini || /^(img\/sv|galeria)\//.test(p.fotoMini))) p.fotoMini = f; });
    const ahora = Date.now(), fin = (LM.finDia ? LM.finDia() : ahora + 8 * 3600e3);
    PROMOS.forEach(([id, t, prod, precio, titulo]) => { if (!S.promos.some(x => x.id === id) && LM.PR(prod)) S.promos.push({ id, t, prod, precio, cupo: 40, vend: 12 + id.length * 3, hasta: fin, titulo, portada: false, activo: true, foto: null, sv: true }); });
    S.promos.forEach(x => { if (x.sv && x.hasta < ahora) x.hasta = fin; });
    if (!S.sv01) {
      S.sv01 = { v: 1 };
      // los cupones viejos de ejemplo pasan al formato nuevo
      S.cupones.forEach(c => { if (!c.tipo) c.tipo = 'pct'; });
      CUPONES().forEach(c => { if (!S.cupones.some(x => x.id === c.id)) S.cupones.push(c); });
    } else S.cupones.forEach(c => { if (c.id && /^sv-c/.test(c.id) && c.vence && c.vence < ahora) { const n = CUPONES().find(x => x.id === c.id); if (n) c.vence = n.vence; } });
    // equipo de ejemplo
    Object.keys(EQUIPO).forEach(tid => {
      if (!LM.T(tid)) return;
      const N = LM.NEG(tid);
      EQUIPO[tid].forEach(([u, n, rol, cargo]) => {
        const e = N.emp.find(x => x.u === u);
        if (e) { if (u === tid || !e.svEditado) { e.n = n; e.cargo = cargo; if (u !== tid) e.rol = rol; } }
        else if (!(N.svBorrados || []).includes(u)) N.emp.push({ u, rol, n, cargo });
      });
      // el cajero genérico de antes se renombra
      const g = N.emp.find(x => x.u === tid + '-cajero' && x.n === 'Cajero de turno'); if (g) g.n = 'Cajero(a)';
    });
    if (!S.user.foto) S.user.foto = F('u-maria');
    LM.save();
  }
  SV.sembrar = sembrar;
  sembrar();
  // Si se descargaron las fotos profesionales (npm run fotos → img/productos/<id>.jpg), esas ganan a las de ejemplo
  const enCamino = new Set();
  SV.revisarFotos = () => { Object.keys(LM.FOTOS || {}).forEach(id => {
    if (enCamino.has(id)) return;
    const p = LM.PR(id); if (!p || p.fotoSrv) return;
    const im = new Image();
    const rel = 'img/productos/' + id + '.jpg';
    if (p.fotoMini === rel) return; // ya la tiene
    enCamino.add(id); im.onerror = () => enCamino.delete(id);
    // se prueba con ?p= para que el navegador no reuse un "no existe" guardado de antes
    im.onload = () => { enCamino.delete(id); if (p.fotoMini !== rel) { p.fotoMini = rel; LM.save(); if (!location.hash || location.hash === '#inicio') LM.rerender(); } };
    im.src = rel + '?p=' + Date.now();
  }); };
  SV.revisarFotos();
})();
