-- Mi Tienda · Servus 0.1
-- 1. Recuperar la contraseña con un código al correo o al WhatsApp registrado.
-- 2. Un rol "atencion" para los cargos propios de cada negocio (barbero, regente, mecánico, vendedor de ruta…),
--    con el nombre del cargo que se ve en la app.
-- 3. El estado de la pantalla de atención de cada negocio (mesas, turnos, órdenes, acopio…), compartido entre
--    los celulares del equipo, y la vitrina pública (portada, frase del dueño, cupones).

create table if not exists codigos_recuperar (
  id          bigserial primary key,
  usuario_id  bigint not null references usuarios(id) on delete cascade,
  canal       text not null check (canal in ('correo','whatsapp')),
  codigo_hash text not null,
  expira      timestamptz not null,
  intentos    integer not null default 0,
  usado       boolean not null default false,
  creado      timestamptz not null default now()
);
create index if not exists codigos_recuperar_u_idx on codigos_recuperar(usuario_id, creado desc);

alter table negocio_usuarios drop constraint if exists negocio_usuarios_rol_check;
alter table negocio_usuarios add constraint negocio_usuarios_rol_check check (rol in ('dueno','cajero','mesero','cocina','domiciliario','atencion'));
alter table negocio_usuarios add column if not exists cargo text;

create table if not exists sv_estado (
  negocio_id  text primary key references negocios(id) on delete cascade,
  datos       jsonb not null default '{}'::jsonb,
  version     integer not null default 0,
  actualizado timestamptz not null default now()
);
