-- =====================================================================
-- Health · Esquema de base de datos (Supabase / PostgreSQL)
-- Ejecutar completo en: Supabase Dashboard > SQL Editor > New query > Run
-- Idempotente: se puede volver a ejecutar sin romper nada.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Deportistas
-- ---------------------------------------------------------------------
create table if not exists public.deportistas (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid unique references auth.users(id) on delete cascade,
  preparador_id    uuid references auth.users(id) on delete set null,
  nombre           text not null default '',
  email            text,
  fecha_nacimiento date,
  sexo             text check (sexo in ('H','M','otro') or sexo is null),
  altura_cm        numeric(5,1),
  deporte          text,
  nivel            text,
  consentimiento_datos boolean not null default false,
  activo           boolean not null default true,
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now()
);

-- Cada usuario que se registra obtiene su ficha de deportista automáticamente
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.deportistas (user_id, email, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ¿Puede el usuario actual ver/editar los datos de este deportista?
-- Sí si es el propio deportista o su preparador.
create or replace function public.puede_acceder(d uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.deportistas
    where id = d and (user_id = auth.uid() or preparador_id = auth.uid())
  );
$$;

-- Marca de tiempo de actualización
create or replace function public.set_actualizado_en()
returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end $$;

drop trigger if exists trg_deportistas_upd on public.deportistas;
create trigger trg_deportistas_upd before update on public.deportistas
  for each row execute procedure public.set_actualizado_en();

-- ---------------------------------------------------------------------
-- 2. Registro diario
-- ---------------------------------------------------------------------
create table if not exists public.registro_diario (
  id             uuid primary key default gen_random_uuid(),
  deportista_id  uuid not null references public.deportistas(id) on delete cascade,
  fecha          date not null,
  peso_kg        numeric(5,2),
  sueno_h        numeric(3,1),
  calidad_sueno  smallint check (calidad_sueno between 1 and 10),
  fc_reposo      smallint,
  hrv_ms         numeric(5,1),
  energia        smallint check (energia between 1 and 10),
  estres         smallint check (estres between 1 and 10),
  hambre         smallint check (hambre between 1 and 10),
  dolor          text,
  pasos          integer,
  notas          text,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (deportista_id, fecha)
);
create index if not exists idx_registro_diario_dep_fecha on public.registro_diario (deportista_id, fecha desc);
drop trigger if exists trg_registro_diario_upd on public.registro_diario;
create trigger trg_registro_diario_upd before update on public.registro_diario
  for each row execute procedure public.set_actualizado_en();

-- ---------------------------------------------------------------------
-- 3. Sesiones planificadas y realizadas
-- ---------------------------------------------------------------------
create table if not exists public.sesion_planificada (
  id                    uuid primary key default gen_random_uuid(),
  deportista_id         uuid not null references public.deportistas(id) on delete cascade,
  plan_version          text,
  fecha                 date not null,
  nombre                text not null,
  tipo                  text not null default 'fuerza'
                        check (tipo in ('fuerza','resistencia','hyrox','tecnica','movilidad','descanso','otro')),
  duracion_prevista_min integer,
  intensidad_objetivo   text,
  detalle_json          jsonb,
  creado_en             timestamptz not null default now()
);
create index if not exists idx_sesion_plan_dep_fecha on public.sesion_planificada (deportista_id, fecha);

create table if not exists public.sesion_realizada (
  id                    uuid primary key default gen_random_uuid(),
  sesion_planificada_id uuid references public.sesion_planificada(id) on delete set null,
  deportista_id         uuid not null references public.deportistas(id) on delete cascade,
  fecha                 date not null,
  nombre                text,
  tipo                  text not null default 'fuerza'
                        check (tipo in ('fuerza','resistencia','hyrox','tecnica','movilidad','descanso','otro')),
  estado                text not null default 'completa'
                        check (estado in ('completa','parcial','no_realizada')),
  duracion_min          integer,
  rpe                   smallint check (rpe between 1 and 10),
  carga_srpe            integer generated always as (coalesce(duracion_min,0) * coalesce(rpe,0)) stored,
  fc_media              smallint,
  fc_max                smallint,
  distancia_km          numeric(6,2),
  detalle_json          jsonb,
  notas                 text,
  fuente                text not null default 'manual',
  creado_en             timestamptz not null default now(),
  actualizado_en        timestamptz not null default now()
);
create index if not exists idx_sesion_real_dep_fecha on public.sesion_realizada (deportista_id, fecha desc);
drop trigger if exists trg_sesion_real_upd on public.sesion_realizada;
create trigger trg_sesion_real_upd before update on public.sesion_realizada
  for each row execute procedure public.set_actualizado_en();

-- ---------------------------------------------------------------------
-- 4. Nutrición
-- ---------------------------------------------------------------------
create table if not exists public.plan_nutricional (
  id             uuid primary key default gen_random_uuid(),
  deportista_id  uuid not null references public.deportistas(id) on delete cascade,
  version        text not null default '1.0',
  vigente_desde  date not null default current_date,
  vigente_hasta  date,
  -- {"fuerte":{"kcal":3000,"prot":180,"ch":400,"grasa":80}, "ligero":{...}, "descanso":{...}, "competicion":{...}}
  objetivos_json jsonb not null default '{}'::jsonb,
  notas          text,
  creado_en      timestamptz not null default now()
);

create table if not exists public.registro_nutricion (
  id               uuid primary key default gen_random_uuid(),
  deportista_id    uuid not null references public.deportistas(id) on delete cascade,
  fecha            date not null,
  tipo_dia         text check (tipo_dia in ('fuerte','ligero','descanso','competicion')),
  kcal             integer,
  proteina_g       numeric(6,1),
  carbohidratos_g  numeric(6,1),
  grasas_g         numeric(6,1),
  fibra_g          numeric(5,1),
  agua_l           numeric(4,2),
  adherencia       smallint check (adherencia between 0 and 100),
  notas            text,
  fuente           text not null default 'manual',
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now(),
  unique (deportista_id, fecha)
);
create index if not exists idx_nutri_dep_fecha on public.registro_nutricion (deportista_id, fecha desc);
drop trigger if exists trg_nutri_upd on public.registro_nutricion;
create trigger trg_nutri_upd before update on public.registro_nutricion
  for each row execute procedure public.set_actualizado_en();

-- ---------------------------------------------------------------------
-- 5. Mediciones (antropometría, tests, 1RM…)
-- ---------------------------------------------------------------------
create table if not exists public.medicion (
  id             uuid primary key default gen_random_uuid(),
  deportista_id  uuid not null references public.deportistas(id) on delete cascade,
  fecha          date not null default current_date,
  tipo           text not null,   -- peso | pliegue | perimetro | pct_graso | 1rm | test_resistencia | salto | otro
  nombre         text not null,   -- ej. "cintura", "sentadilla", "5km"
  valor          numeric(10,2) not null,
  unidad         text,
  metodo         text,
  condiciones    text,
  creado_en      timestamptz not null default now()
);
create index if not exists idx_medicion_dep_fecha on public.medicion (deportista_id, fecha desc);

-- ---------------------------------------------------------------------
-- 6. Seguridad: Row Level Security
-- ---------------------------------------------------------------------
alter table public.deportistas        enable row level security;
alter table public.registro_diario    enable row level security;
alter table public.sesion_planificada enable row level security;
alter table public.sesion_realizada   enable row level security;
alter table public.plan_nutricional   enable row level security;
alter table public.registro_nutricion enable row level security;
alter table public.medicion           enable row level security;

-- deportistas: ve y edita su ficha; el preparador ve y edita las de sus deportistas
drop policy if exists deportistas_select on public.deportistas;
create policy deportistas_select on public.deportistas for select
  using (user_id = auth.uid() or preparador_id = auth.uid());

drop policy if exists deportistas_update on public.deportistas;
create policy deportistas_update on public.deportistas for update
  using (user_id = auth.uid() or preparador_id = auth.uid())
  with check (user_id = auth.uid() or preparador_id = auth.uid());

-- un usuario puede crear su propia ficha (si no la creó el trigger);
-- un preparador puede crear deportistas sin cuenta propia (los lleva él)
drop policy if exists deportistas_insert on public.deportistas;
create policy deportistas_insert on public.deportistas for insert
  with check (user_id = auth.uid() or preparador_id = auth.uid());

-- Crea la ficha de los usuarios que se registraron antes de existir el trigger
insert into public.deportistas (user_id, email, nombre)
select u.id, u.email, split_part(u.email, '@', 1)
from auth.users u
where not exists (select 1 from public.deportistas d where d.user_id = u.id);

-- resto de tablas: una política por tabla basada en puede_acceder()
do $$
declare t text;
begin
  foreach t in array array['registro_diario','sesion_planificada','sesion_realizada',
                           'plan_nutricional','registro_nutricion','medicion']
  loop
    execute format('drop policy if exists %I_acceso on public.%I', t, t);
    execute format(
      'create policy %I_acceso on public.%I for all
         using (public.puede_acceder(deportista_id))
         with check (public.puede_acceder(deportista_id))', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7. Vistas derivadas (respetan RLS gracias a security_invoker)
-- ---------------------------------------------------------------------
create or replace view public.v_peso_media_7d
with (security_invoker = true) as
select deportista_id, fecha, peso_kg,
       round(avg(peso_kg) over (partition by deportista_id order by fecha
             rows between 6 preceding and current row), 2) as media_7d
from public.registro_diario
where peso_kg is not null;

create or replace view public.v_carga_semanal
with (security_invoker = true) as
select deportista_id,
       date_trunc('week', fecha)::date as semana,
       sum(carga_srpe)                                  as carga,
       count(*) filter (where estado = 'completa')      as completas,
       count(*) filter (where estado = 'parcial')       as parciales,
       count(*)                                         as registradas,
       sum(duracion_min)                                as minutos
from public.sesion_realizada
group by deportista_id, date_trunc('week', fecha);

-- ACWR: carga de los últimos 7 días / media de carga semanal de los últimos 28
create or replace view public.v_acwr
with (security_invoker = true) as
with d as (
  select deportista_id, fecha, carga_srpe from public.sesion_realizada
  where fecha >= current_date - 27
)
select deportista_id,
       sum(carga_srpe) filter (where fecha >= current_date - 6)          as carga_7d,
       round(sum(carga_srpe) / 4.0, 0)                                    as media_28d_semanal,
       case when sum(carga_srpe) > 0
            then round(sum(carga_srpe) filter (where fecha >= current_date - 6) / (sum(carga_srpe) / 4.0), 2)
       end                                                                as acwr
from d group by deportista_id;

-- Alertas para el panel del preparador
create or replace view public.v_alertas
with (security_invoker = true) as
select d.id as deportista_id, d.nombre,
       (select max(fecha) from public.registro_diario r where r.deportista_id = d.id) as ultimo_registro,
       current_date - coalesce((select max(fecha) from public.registro_diario r where r.deportista_id = d.id), current_date - 99) as dias_sin_registro,
       a.acwr
from public.deportistas d
left join public.v_acwr a on a.deportista_id = d.id
where d.activo;

-- ---------------------------------------------------------------------
-- 8. Permisos de API
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant select on all tables in schema public to authenticated;
alter default privileges in schema public grant all on tables to authenticated;
