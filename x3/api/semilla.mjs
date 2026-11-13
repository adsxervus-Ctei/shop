// Mi Tienda · datos semilla de PRUEBA
// Uso: DATABASE_URL=postgres://… npm run semilla
// Crea: 1 admin, 2 negocios, 3 repartidores (pendiente, aprobado, rechazado), 2 clientes,
// productos con código QR y un pedido con oferta abierta. Todas las claves son 1234: cámbialas
// o no corras esto en la base real. Se puede correr varias veces: no duplica nada.
import { conectar, migrar, q, uno, cerrar } from './db.mjs';
import { hashClave } from './auth.mjs';
import { fileURLToPath } from 'node:url';

const avatar = (ini, color) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="20" fill="${color}"/><text x="60" y="75" font-size="44" font-family="Arial" font-weight="700" text-anchor="middle" fill="#fff">${ini}</text></svg>`);
const doc = (txt, color) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" rx="14" fill="${color}"/><text x="20" y="40" font-size="20" font-family="Arial" font-weight="700" fill="#fff">${txt}</text><text x="20" y="180" font-size="13" font-family="Arial" fill="#fff">DOCUMENTO DE PRUEBA · NO VÁLIDO</text></svg>`);

async function archivo(propietario, tipo, datos, privado = true) {
  return (await uno('insert into archivos(propietario_id, tipo, mime, datos, bytes, privado) values ($1,$2,$3,$4,$5,$6) returning id',
    [propietario, tipo, 'image/svg+xml', datos, datos.length, privado])).id;
}
async function usuario(tel, usuario, nombre, roles) {
  await q(`insert into usuarios(telefono, usuario, nombre, clave_hash, roles) values ($1,$2,$3,$4,$5) on conflict (telefono) do nothing`, [tel, usuario, nombre, hashClave('1234'), roles]);
  return (await uno('select id from usuarios where telefono=$1', [tel])).id;
}

export async function sembrar({ conOferta = true } = {}) {
  const admin = await usuario('3000000001', 'admin', 'Administración Mi Tienda', ['admin', 'cliente']);
  await usuario('3000000002', 'equipo', 'Equipo de fotos Mi Tienda', ['equipo', 'cliente']);
  const maria = await usuario('3105550102', 'maria', 'María de Chimí', ['cliente']);
  const juan = await usuario('3124441020', 'juan', 'Juan Pérez', ['cliente']);
  const dRancho = await usuario('3001004000', 'rancho', 'Don Juan Ríos', ['negocio', 'cliente']);
  const cRancho = await usuario('3001004001', 'rancho-cajero', 'Mesero de turno', ['negocio', 'cliente']);
  const dDrog = await usuario('3001374111', 'drogueria', 'Dueña Droguería Loba', ['negocio', 'cliente']);

  const negocios = [
    ['rancho', 'Rancho Costeño', 'comida', 'Calle Principal, Hatillo', 8.95612, -74.07721, '3001004000', '3102005000'],
    ['drogueria', 'Droguería Loba', 'farmacia', 'Frente a la iglesia, Hatillo', 8.95531, -74.07648, '3001374111', '3102915679']
  ];
  for (const n of negocios)
    await q(`insert into negocios(id, nombre, categoria, municipio, zona_id, direccion, lat, lng, telefono, nequi) values ($1,$2,$3,'Hatillo de Loba','hatillo',$4,$5,$6,$7,$8) on conflict (id) do nothing`, n);
  for (const [nid, uid, rol] of [['rancho', dRancho, 'dueno'], ['rancho', cRancho, 'cajero'], ['drogueria', dDrog, 'dueno']])
    await q('insert into negocio_usuarios values ($1,$2,$3) on conflict do nothing', [nid, uid, rol]);

  // Los 5 tipos de negocio nuevos (v7): dueño = el id del negocio; cajero/mesera = id-cajero. Clave 1234.
  const nuevos = [
    ['billar', 'Billares La Carambola', 'billar', 'Hatillo de Loba', 'hatillo', 'Calle del Comercio, Hatillo', 8.95580, -74.07690, '3001500001'],
    ['barberia', 'Barbería Estilo Loba', 'belleza', 'Barranco de Loba', 'barranco', 'Barrio Arriba, Barranco de Loba', 8.94560, -74.10590, '3001500002'],
    ['taller', 'Taller Moto Ribera', 'taller', 'Hatillo de Loba', 'hatillo', 'Vía a San Martín, Hatillo', 8.95420, -74.07150, '3001500003'],
    ['ropa', 'Variedades La Ribereña', 'ropa', 'San Martín de Loba', 'sanmartin', 'Plaza principal, San Martín de Loba', 8.93880, -74.03930, '3001500004'],
    ['agro', 'Agroveterinaria El Playón', 'agro', 'Hatillo de Loba', 'hatillo', 'Salida a Chimí, Hatillo', 8.95750, -74.08020, '3001500005']
  ];
  for (const [id, nombre, cat, mun, zona, dir, lat, lng, tel] of nuevos) {
    await q(`insert into negocios(id, nombre, categoria, municipio, zona_id, direccion, lat, lng, telefono, nequi) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) on conflict (id) do nothing`, [id, nombre, cat, mun, zona, dir, lat, lng, tel]);
    const d = await usuario(tel, id, 'Dueño · ' + nombre, ['negocio', 'cliente']);
    const c = await usuario('30016' + tel.slice(5), id + '-cajero', (cat === 'billar' ? 'Mesera · ' : 'Cajero · ') + nombre, ['negocio', 'cliente']);
    await q('insert into negocio_usuarios values ($1,$2,$3) on conflict do nothing', [id, d, 'dueno']);
    await q('insert into negocio_usuarios values ($1,$2,$3) on conflict do nothing', [id, c, 'cajero']);
  }

  // Mi Tienda v9: equipo del Rancho por roles y los 6 negocios nuevos de la Propuesta K (clave 1234)
  for (const [tel, u, nombre, rol] of [['3001004002', 'rancho-mesera', 'Sofía Pérez', 'mesero'], ['3001004003', 'rancho-cocina', 'Rubén Díaz', 'cocina'], ['3001004004', 'rancho-domi', 'Danto (domiciliario de confianza)', 'domiciliario']]) {
    const id = await usuario(tel, u, nombre, ['negocio', 'cliente']);
    await q('insert into negocio_usuarios values ($1,$2,$3) on conflict do nothing', ['rancho', id, rol]);
  }
  const nuevos9 = [
    ['granero', 'Granero Central', 'mayorista', 'Calle del Comercio, Hatillo', '3001500011', 'Ana Milena'],
    ['ferreteria', 'Ferretería El Tornillo', 'deposito', 'Salida a San Martín, Hatillo', '3001500012', 'Don Hernando'],
    ['pescadores', 'Asociación de Pescadores', 'pesca', 'El muelle, Hatillo', '3001500013', 'Marlene'],
    ['quesera', 'Quesera El Playón', 'lacteos', 'Vereda El Playón', '3001500014', 'Doña Edith'],
    ['distribuidora', 'Distribuidora Loba', 'distribuidora', 'Bodega vía principal, Hatillo', '3001500015', 'Carolina'],
    ['granja', 'Granja Chimí', 'granja', 'Chimí, a la entrada', '3001500016', 'Luz Dary']
  ];
  for (const [id, nombre, cat, dir, tel, dueno] of nuevos9) {
    await q(`insert into negocios(id, nombre, categoria, municipio, zona_id, direccion, lat, lng, telefono, nequi) values ($1,$2,$3,'Hatillo de Loba','hatillo',$4,8.9559,-74.0770,$5,$5) on conflict (id) do nothing`, [id, nombre, cat, dir, tel]);
    const d = await usuario(tel, id, dueno, ['negocio', 'cliente']);
    await q('insert into negocio_usuarios values ($1,$2,$3) on conflict do nothing', [id, d, 'dueno']);
  }

  // Servus 0.1: nombres como en "7 propuestas de interfaz", dos negocios más y un usuario por cargo (clave 1234)
  for (const [id, nombre] of [['drogueria', 'Droguería La Loba'], ['barberia', 'Barbería El Estilo'], ['taller', 'Taller El Pistón'], ['agro', 'Agro La Loba']])
    await q('update negocios set nombre=$2 where id=$1', [id, nombre]);
  for (const [id, nombre, cat, dir, tel, dueno] of [['chimi', 'Variedades Chimí', 'tienda', 'Calle 3, Chimí', '3001500017', 'Keila'], ['calzado', 'Calzado El Paso', 'ropa', 'Calle del Comercio, Hatillo', '3001500018', 'Daniela']]) {
    await q(`insert into negocios(id, nombre, categoria, municipio, zona_id, direccion, lat, lng, telefono, nequi) values ($1,$2,$3,'Hatillo de Loba','hatillo',$4,8.9559,-74.0770,$5,$5) on conflict (id) do nothing`, [id, nombre, cat, dir, tel]);
    const d = await usuario(tel, id, dueno, ['negocio', 'cliente']);
    await q('insert into negocio_usuarios values ($1,$2,$3) on conflict do nothing', [id, d, 'dueno']);
  }
  // La tienda de barrio no estaba en el servidor
  if (!(await uno("select 1 from negocios where id='tienda'"))) {
    await q(`insert into negocios(id, nombre, categoria, municipio, zona_id, direccion, lat, lng, telefono, nequi) values ('tienda','Tienda Mi Pueblo','tienda','Hatillo de Loba','hatillo','Barrio Arriba, Hatillo',8.9561,-74.0768,'3001500019','3001500019') on conflict (id) do nothing`);
    const d = await usuario('3001500019', 'tienda', 'Doña Rosa', ['negocio', 'cliente']);
    await q('insert into negocio_usuarios values ($1,$2,$3) on conflict do nothing', ['tienda', d, 'dueno']);
  }
  const EQUIPO = [
    ['rancho', 'rancho-cajero', 'Karen', 'cajero', 'Cajera'], ['billar', 'billar-mesera', 'Keila', 'mesero', 'Mesera de mesas'],
    ['barberia', 'barberia-atencion', 'Kevin', 'atencion', 'Barbero'], ['tienda', 'tienda-cajero', 'Valentina', 'cajero', 'Cajera del mostrador'],
    ['drogueria', 'drogueria-atencion', 'María José', 'atencion', 'Auxiliar de farmacia'], ['drogueria', 'drogueria-cajero', 'Diana', 'cajero', 'Cajera'],
    ['taller', 'taller-atencion', 'Elkin', 'atencion', 'Mecánico'], ['granero', 'granero-atencion', 'Jairo', 'atencion', 'Despachador'],
    ['ferreteria', 'ferreteria-atencion', 'Wilson', 'atencion', 'Vendedor de mostrador'], ['ropa', 'ropa-atencion', 'Andrea', 'atencion', 'Asesora de ventas'],
    ['pescadores', 'pescadores-atencion', 'Jesús', 'atencion', 'Recibe el pescado'], ['quesera', 'quesera-atencion', 'Wilmer', 'atencion', 'Quesero'],
    ['distribuidora', 'distribuidora-atencion', 'Julio', 'atencion', 'Vendedor de ruta'], ['agro', 'agro-atencion', 'Paola', 'atencion', 'Veterinaria'],
    ['granja', 'granja-atencion', 'Fredy', 'atencion', 'Galponero']
  ];
  let k = 0;
  for (const [nid, u, nombre, rol, cargo] of EQUIPO) {
    const tel = '30020' + String(10000 + k++).slice(-5);
    const id = (await uno('select id from usuarios where usuario=$1', [u]))?.id || await usuario(tel, u, nombre, ['negocio', 'cliente']);
    await q('update usuarios set nombre=$2 where id=$1', [id, nombre]);
    await q(`insert into negocio_usuarios(negocio_id, usuario_id, rol, cargo) values ($1,$2,$3,$4) on conflict (negocio_id, usuario_id) do update set rol=excluded.rol, cargo=excluded.cargo`, [nid, id, rol, cargo]);
  }
  for (const [u, nombre] of [['rancho', 'Don Efraín'], ['drogueria', 'Liliana'], ['billar', 'Don Álvaro'], ['barberia', 'Jhon'], ['taller', 'Ramiro'], ['ropa', 'Yuleidis'], ['agro', 'Nelly'], ['tienda', 'Doña Rosa']])
    await q('update usuarios set nombre=$2 where usuario=$1', [u, nombre]);
  // Correo de prueba para recuperar la contraseña
  await q(`update usuarios set correo='maria@ejemplo.com' where usuario='maria' and correo is null`);

  const reps = [
    { tel: '3001112233', u: 'danto', nombre: 'Danto Ruiz Pérez', cedula: '1047400111', placa: 'HTL12A', marca: 'Bajaj Boxer', color: 'Roja', estado: 'aprobado', motivo: null, color2: '#16a34a', conectado: true },
    { tel: '3008889900', u: 'yeison', nombre: 'Yeison Mendoza Arias', cedula: '1047400222', placa: 'SML34B', marca: 'AKT NKD', color: 'Negra', estado: 'pendiente', motivo: null, color2: '#2563eb', conectado: false },
    { tel: '3016667788', u: 'kelly', nombre: 'Kelly Arrieta Gómez', cedula: '1047400333', placa: 'BRL56C', marca: 'Yamaha XTZ', color: 'Azul', estado: 'rechazado', motivo: 'La foto del pase de conducción no se lee. Tómala de nuevo con buena luz.', color2: '#9333ea', conectado: false }
  ];
  for (const r of reps) {
    const id = await usuario(r.tel, r.u, r.nombre, ['cliente', 'repartidor']);
    if (await uno('select 1 from repartidores where usuario_id=$1', [id])) continue;
    const ini = r.nombre.split(' ').map(x => x[0]).slice(0, 2).join('');
    const f = await archivo(id, 'foto_repartidor', avatar(ini, r.color2));
    const c = await archivo(id, 'cedula', doc('CÉDULA · ' + r.nombre, '#475569'));
    const p = await archivo(id, 'pase', doc('PASE · ' + r.nombre, '#0f766e'));
    await q(`insert into repartidores(usuario_id, nombre_completo, cedula, foto_id, cedula_foto_id, pase_foto_id, moto_marca, moto_color, placa, telefono, nequi, zona_id,
               estado_aprobacion, motivo_rechazo, revisado_por, revisado_en, conectado, habeas_data_en, habeas_data_version)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,'hatillo',$11,$12,$13,$14,$15, now(), '2026-11')`,
      [id, r.nombre, r.cedula, f, c, p, r.marca, r.color, r.placa, r.tel, r.estado, r.motivo, r.estado === 'pendiente' ? null : admin, r.estado === 'pendiente' ? null : new Date(), r.conectado]);
  }

  // Productos con código (el QR apunta a este código)
  const prods = [
    ['asado', 'rancho', 'Asado Especial', 'Asados', 30000, 30, 'Cocina · sale al momento'],
    ['mojarra', 'rancho', 'Mojarra frita con patacón', 'Pescados', 28000, 12, 'Cocina · sale al momento'],
    ['sancocho', 'rancho', 'Sancocho de gallina', 'Almuerzos', 18000, 20, 'Cocina · olla de leña'],
    ['suero', 'drogueria', 'Suero oral x2', 'Medicamentos', 7000, 40, 'Vitrina 1, segundo nivel'],
    ['acetaminofen', 'drogueria', 'Acetaminofén 500 mg x10', 'Medicamentos', 3000, 100, 'Detrás del mostrador, cajón A'],
    ['panales', 'drogueria', 'Pañales etapa 3 x30', 'Bebés', 46000, 18, 'Estante del fondo, abajo'],
    ['bloqueador', 'drogueria', 'Bloqueador solar SPF 50', 'Cuidado personal', 25000, 12, 'Exhibidor de la entrada'],
    ['horamesa', 'billar', 'Hora de mesa de pool', 'Mesas', 8000, 999, 'Mesas'],
    ['cerveza', 'billar', 'Cerveza fría x6', 'Bebidas', 18000, 48, 'Nevera del fondo'],
    ['picada', 'billar', 'Picada para compartir', 'Pasabocas', 22000, 15, 'Cocina'],
    ['cerveza1', 'billar', 'Cerveza fría (unidad)', 'Bebidas', 3500, 96, 'Nevera del fondo']
  ];
  const pref = { rancho: 'RC', drogueria: 'DL', billar: 'LC' };
  for (const nid of Object.keys(pref)) await q('insert into productos_consecutivo(negocio_id, prefijo) values ($1,$2) on conflict do nothing', [nid, pref[nid]]);
  for (const [id, nid, nombre, cat, precio, stock, ubic] of prods) {
    if (await uno('select 1 from productos where id=$1', [id])) continue;
    const r = await uno('update productos_consecutivo set ultimo=ultimo+1 where negocio_id=$1 returning prefijo, ultimo', [nid]);
    await q(`insert into productos(id, negocio_id, codigo, nombre, categoria, precio, stock, ubicacion) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, nid, `${r.prefijo}-${String(r.ultimo).padStart(4, '0')}`, nombre, cat, precio, stock, ubic]);
  }

  if (conOferta && !(await uno(`select 1 from pedidos where negocio_id='rancho' and numero=127`))) {
    const pe = await uno(`insert into pedidos(numero, negocio_id, cliente_id, cliente_nombre, cliente_tel, items, subtotal, domicilio, total, modo, zona_id, direccion, pago, origen, estado)
                          values (127,'rancho',$1,'Juan Pérez','3124441020',$2,50000,4000,54000,'domicilio','hatillo','Calle Principal, al lado de la cancha','efectivo','lobamall','buscando_repartidor') returning id`,
      [juan, JSON.stringify([{ id: 'asado', n: 'Asado Especial', q: 2, p: 25000 }])]);
    await q(`insert into ofertas_domicilio(pedido_id, negocio_id, zona_id, valor, origen_lat, origen_lng, destino_lat, destino_lng, destino_texto, distancia_km, minutos, vence_en)
             values ($1,'rancho','hatillo',4000,8.95612,-74.07721,8.9549,-74.0791,'Calle Principal, al lado de la cancha',0.3,4, now() + interval '10 minutes')`, [pe.id]);
  }
  // Servus 0.2: superadministrador de prueba, 3 pautas pagadas y 2 negocios esperando aprobación
  const sup = await usuario('3000000009', 'superadmin', 'Superadministrador (prueba)', ['admin', 'cliente']);
  const hoy = new Date(Date.now() - 5 * 3600e3), dia = n => new Date(hoy.getTime() + n * 864e5).toISOString().slice(0, 10);
  if (!(await uno('select 1 from pautas limit 1'))) {
    const P = [['rancho', 'Hamburguesa con papas a $18.000', 'Carne de la casa, papas y salsa. En Rancho Costeño.', 'galeria/f-hamburguesa.jpg', 't-rancho', 'Pedir ahora', -2, 12, 150000],
      ['calzado', 'Tenis desde $89.000 en Calzado El Paso', 'Cambio de talla gratis. Pagas al recibir.', 'galeria/f-tenis.jpg', 't-calzado', 'Ver tenis', -1, 13, 120000],
      ['granja', 'Gallina criolla y huevos de la Granja Chimí', 'Recogidos hoy. Domicilio a Hatillo y Chimí.', 'galeria/f-gallinas.jpg', 't-granja', 'Ver la granja', 0, 6, 60000]];
    let o = 0;
    for (const [nid, ti, tx, img, en, bt, a, b, v] of P) {
      if (!(await uno('select 1 from negocios where id=$1', [nid]))) continue;
      await q(`insert into pautas(negocio_id, titulo, texto, imagen_url, enlace, boton, inicio, fin, valor, orden) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [nid, ti, tx, img, en, bt, dia(a), dia(b), v, o++]);
    }
  }
  if (!(await uno('select 1 from solicitudes_negocio limit 1'))) {
    await q(`insert into solicitudes_negocio(nombre, categoria, municipio, direccion, dueno_nombre, telefono, correo, mensaje) values
      ('Panadería La Espiga','tienda','Hatillo de Loba','Calle del Comercio','Yolanda Mejía','3157770011','espiga@ejemplo.com','Queremos vender pan y tortas por encargo.'),
      ('Taller Moto Rápido','taller','San Martín de Loba','Salida a Barranco','Wilmer Ortiz','3168880022',null,'Reparación de motos y venta de repuestos.')`);
  }
  return { admin, maria, juan, sup };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.env.NODE_ENV === 'production' && process.env.SEMILLA_EN_PRODUCCION !== 'si') {
    console.error('Esta semilla crea cuentas con clave 1234. No se corre en producción (define SEMILLA_EN_PRODUCCION=si si de verdad quieres).');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) { console.error('Falta DATABASE_URL'); process.exit(1); }
  conectar();
  await migrar();
  await sembrar();
  console.log('Semilla lista. Cuentas (clave 1234): admin, equipo, rancho, rancho-cajero, drogueria, billar, billar-cajero (mesera), barberia, taller, ropa, agro, rancho-mesera, rancho-cocina, rancho-domi, granero, ferreteria, pescadores, quesera, distribuidora, granja, danto (aprobado), yeison (pendiente), kelly (rechazado), maria, juan');
  await cerrar();
}
