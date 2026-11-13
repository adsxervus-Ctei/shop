-- Mi Tienda · Servus 0.2
-- 1. Foto de perfil de cada persona (sale en el marcador del billar y en su cuenta).
-- 2. Solicitudes de negocios nuevos: el negocio llena el formulario y el superadministrador lo aprueba.
-- 3. Pautas del inicio (mínimo 3, máximo 5 activas): las vende el superadministrador, con fechas y valor.
-- 4. Estados de los negocios (imagen o video de máximo 15 segundos, con texto y botón).
-- 5. Archivos de video (los estados) además de las fotos.

alter table usuarios add column if not exists foto_id bigint references archivos(id) on delete set null;
alter table usuarios add column if not exists correo text;
alter table negocios add column if not exists estado text not null default 'activo';
alter table negocios drop constraint if exists negocios_estado_check;
alter table negocios add constraint negocios_estado_check check (estado in ('activo','suspendido'));

create table if not exists solicitudes_negocio (
  id            bigserial primary key,
  nombre        text not null,
  categoria     text not null,
  municipio     text not null,
  direccion     text,
  dueno_nombre  text not null,
  telefono      text not null,
  correo        text,
  mensaje       text,
  estado        text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  motivo        text,
  negocio_id    text references negocios(id) on delete set null,
  revisado_por  bigint references usuarios(id) on delete set null,
  revisado      timestamptz,
  creado        timestamptz not null default now()
);
create index if not exists solicitudes_negocio_estado_idx on solicitudes_negocio(estado, creado desc);

create table if not exists pautas (
  id          bigserial primary key,
  negocio_id  text references negocios(id) on delete cascade,
  titulo      text not null,
  texto       text,
  imagen_id   bigint references archivos(id) on delete set null,
  imagen_url  text,                      -- foto de la galería de la app (cuando no se sube una)
  color       text,                      -- color de la franja; si no hay, la app lo saca de la foto
  enlace      text,                      -- a dónde lleva: t-<negocio>, p-<producto> o una sección
  boton       text not null default 'Ver más',
  inicio      date not null,
  fin         date not null,
  valor       integer not null default 0, -- lo que pagó el negocio (pesos)
  estado      text not null default 'activa' check (estado in ('activa','pausada')),
  orden       integer not null default 0,
  creado      timestamptz not null default now(),
  check (fin >= inicio)
);
create index if not exists pautas_fechas_idx on pautas(estado, inicio, fin);

create table if not exists estados_negocio (
  id          bigserial primary key,
  negocio_id  text not null references negocios(id) on delete cascade,
  tipo        text not null check (tipo in ('imagen','video')),
  archivo_id  bigint references archivos(id) on delete set null,
  texto       text,
  cta_tipo    text not null default 'tienda' check (cta_tipo in ('tienda','producto','whatsapp','ninguno')),
  cta_ref     text,
  cta_txt     text,
  segundos    numeric(4,1),
  activo      boolean not null default true,
  creado      timestamptz not null default now()
);
create index if not exists estados_negocio_idx on estados_negocio(negocio_id, activo, creado desc);
