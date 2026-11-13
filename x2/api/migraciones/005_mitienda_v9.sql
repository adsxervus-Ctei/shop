-- Mi Tienda v9: ingreso con WhatsApp, Google y Facebook; más medios de pago; equipo por roles; asistencia.

-- Una persona puede entrar con Google o Facebook sin haber dado el celular todavía
alter table usuarios alter column telefono drop not null;
alter table usuarios add column if not exists correo text;
alter table usuarios add column if not exists google_sub text;
alter table usuarios add column if not exists facebook_id text;
create unique index if not exists usuarios_correo_u on usuarios(lower(correo)) where correo is not null;
create unique index if not exists usuarios_google_u on usuarios(google_sub) where google_sub is not null;
create unique index if not exists usuarios_facebook_u on usuarios(facebook_id) where facebook_id is not null;

-- Códigos de ingreso por WhatsApp (se guarda solo el hash del código)
create table if not exists codigos_whatsapp (
  id          bigserial primary key,
  telefono    text not null,
  codigo_hash text not null,
  expira      timestamptz not null,
  intentos    integer not null default 0,
  usado       boolean not null default false,
  creado      timestamptz not null default now()
);
create index if not exists codigos_whatsapp_tel_idx on codigos_whatsapp(telefono, creado desc);

-- Medios de pago: Daviplata y Bre-B aparte de Nequi
alter table pedidos drop constraint if exists pedidos_pago_check;
alter table pedidos add constraint pedidos_pago_check check (pago in ('efectivo','nequi','daviplata','breb','banco','fiado'));
alter table pagos drop constraint if exists pagos_metodo_check;
alter table pagos add constraint pagos_metodo_check check (metodo in ('efectivo','nequi','daviplata','breb','banco','fiado'));

-- Equipo de trabajo por roles
alter table negocio_usuarios drop constraint if exists negocio_usuarios_rol_check;
alter table negocio_usuarios add constraint negocio_usuarios_rol_check check (rol in ('dueno','cajero','mesero','cocina','domiciliario'));

-- Asistencia del equipo (entrada y salida con el QR del negocio)
create table if not exists asistencia (
  id          bigserial primary key,
  negocio_id  text not null references negocios(id) on delete cascade,
  usuario_id  bigint not null references usuarios(id) on delete cascade,
  tipo        text not null check (tipo in ('entrada','salida')),
  en          timestamptz not null default now()
);
create index if not exists asistencia_negocio_idx on asistencia(negocio_id, en desc);

-- Peticiones, quejas, reclamos y sugerencias (PQR) de los clientes a cada negocio
create table if not exists pqr (
  id          bigserial primary key,
  negocio_id  text not null references negocios(id) on delete cascade,
  usuario_id  bigint references usuarios(id) on delete set null,
  nombre      text not null,
  telefono    text,
  tipo        text not null check (tipo in ('peticion','queja','reclamo','sugerencia')),
  texto       text not null,
  respuesta   text,
  estado      text not null default 'abierta' check (estado in ('abierta','respondida')),
  creado      timestamptz not null default now(),
  respondido  timestamptz
);
create index if not exists pqr_negocio_idx on pqr(negocio_id, creado desc);
