-- ============================================================================
-- BlueOcean RE Agent - Esquema de histórico e informes
-- Ejecutar en Supabase (SQL Editor) o con `supabase db push`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Oportunidades (proyectos detectados / océanos azules)
-- ---------------------------------------------------------------------------
create table if not exists public.opportunities (
  id               uuid primary key default gen_random_uuid(),
  external_id      text unique,
  name             text not null,
  developer        text,
  zone             text,
  tier             int  check (tier in (1, 2)),
  opportunity_type text check (opportunity_type in ('CORE_TARGET', 'LOOK_A_LIKE')),
  launch_date      date,
  typologies       text,
  value_proposition text,
  detected_gap     text,
  url              text,
  status           text check (status in ('DATA_COMPLETE', 'REQUIRES_CHATBOT_INTERACTION', 'INCIERTO')),
  classification   text check (classification in ('Incierto', 'Oportunidad Validada', 'Océano Azul Detectado')),
  source           text default 'brave_scout',
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_opportunities_tier on public.opportunities (tier);
create index if not exists idx_opportunities_zone on public.opportunities (zone);
create index if not exists idx_opportunities_status on public.opportunities (status);

-- ---------------------------------------------------------------------------
-- 2. Histórico (snapshot por corrida del scout)
-- ---------------------------------------------------------------------------
create table if not exists public.opportunity_history (
  id             bigint generated always as identity primary key,
  opportunity_id uuid references public.opportunities (id) on delete cascade,
  run_id         uuid,
  snapshot       jsonb not null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_history_opportunity on public.opportunity_history (opportunity_id);
create index if not exists idx_history_run on public.opportunity_history (run_id);

-- ---------------------------------------------------------------------------
-- 3. Corridas del scout
-- ---------------------------------------------------------------------------
create table if not exists public.scout_runs (
  id           uuid primary key default gen_random_uuid(),
  ran_at       timestamptz not null default now(),
  total        int not null default 0,
  tier1_count  int not null default 0,
  tier2_count  int not null default 0,
  source       text default 'brave_scout',
  payload      jsonb
);

create index if not exists idx_scout_runs_ran_at on public.scout_runs (ran_at desc);

-- ---------------------------------------------------------------------------
-- 4. Alertas enviadas por el bot
-- ---------------------------------------------------------------------------
create table if not exists public.alerts (
  id       bigint generated always as identity primary key,
  sent_at  timestamptz not null default now(),
  chat_id  text,
  niche    text,
  message  text,
  meta     jsonb
);

create index if not exists idx_alerts_sent_at on public.alerts (sent_at desc);

-- ---------------------------------------------------------------------------
-- 5. Catálogo de los 3 Océanos Azules
-- ---------------------------------------------------------------------------
create table if not exists public.blue_oceans (
  id            int primary key,
  name          text not null,
  description   text,
  monthly_fee   text,
  variable_fee  text,
  tier_focus    text,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. Eventos del bot (interacción bidireccional)
-- ---------------------------------------------------------------------------
create table if not exists public.bot_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  chat_id    text,
  direction  text check (direction in ('in', 'out')),
  text       text,
  meta       jsonb
);

create index if not exists idx_bot_events_created on public.bot_events (created_at desc);

-- ---------------------------------------------------------------------------
-- 7. Trigger updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_opportunities_updated on public.opportunities;
create trigger trg_opportunities_updated
  before update on public.opportunities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. Función de ingesta (upsert + histórico) usada por el scout
-- ---------------------------------------------------------------------------
create or replace function public.ingest_scout_payload(payload jsonb)
returns uuid language plpgsql security definer as $$
declare
  v_run_id uuid;
  item jsonb;
  v_opp_id uuid;
begin
  insert into public.scout_runs (total, tier1_count, tier2_count, source, payload)
  values (
    coalesce((payload->>'total_opportunities')::int, 0),
    coalesce((payload->>'tier_1_count')::int, 0),
    coalesce((payload->>'tier_2_count')::int, 0),
    coalesce(payload->>'source', 'brave_scout'),
    payload
  )
  returning id into v_run_id;

  for item in select * from jsonb_array_elements(coalesce(payload->'opportunities', '[]'::jsonb))
  loop
    insert into public.opportunities (
      external_id, name, developer, zone, tier, opportunity_type,
      launch_date, typologies, value_proposition, detected_gap, url, status
    )
    values (
      item->>'id',
      coalesce(item->>'name', 'Sin nombre'),
      item->>'developer',
      item->>'zone',
      nullif(item->>'tier', '')::int,
      item->>'opportunity_type',
      nullif(item->>'launch_date', '')::date,
      item->>'typologies',
      item->>'value_proposition',
      item->>'detected_gap',
      item->>'url',
      item->>'status'
    )
    on conflict (external_id) do update set
      name              = excluded.name,
      developer         = coalesce(excluded.developer, public.opportunities.developer),
      zone              = coalesce(excluded.zone, public.opportunities.zone),
      tier              = coalesce(excluded.tier, public.opportunities.tier),
      opportunity_type  = coalesce(excluded.opportunity_type, public.opportunities.opportunity_type),
      launch_date       = coalesce(excluded.launch_date, public.opportunities.launch_date),
      typologies        = coalesce(excluded.typologies, public.opportunities.typologies),
      value_proposition = coalesce(excluded.value_proposition, public.opportunities.value_proposition),
      detected_gap      = coalesce(excluded.detected_gap, public.opportunities.detected_gap),
      url               = coalesce(excluded.url, public.opportunities.url),
      status            = coalesce(excluded.status, public.opportunities.status),
      last_seen_at      = now()
    returning id into v_opp_id;

    insert into public.opportunity_history (opportunity_id, run_id, snapshot)
    values (v_opp_id, v_run_id, item);
  end loop;

  return v_run_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Vistas de informe (dashboard)
-- ---------------------------------------------------------------------------
create or replace view public.v_kpis as
select
  count(*)                                            as total_oportunidades,
  count(*) filter (where tier = 1)                    as tier1,
  count(*) filter (where tier = 2)                    as tier2,
  count(*) filter (where status = 'DATA_COMPLETE')    as completas,
  count(*) filter (where status = 'REQUIRES_CHATBOT_INTERACTION') as requieren_interaccion,
  count(distinct zone)                                as zonas
from public.opportunities;

create or replace view public.v_por_zona as
select zone, count(*) as total,
       count(*) filter (where tier = 1) as tier1,
       count(*) filter (where tier = 2) as tier2
from public.opportunities
group by zone
order by total desc;

create or replace view public.v_por_dia as
select date_trunc('day', created_at)::date as dia,
       count(*) as oportunidades,
       count(*) filter (where tier = 1) as tier1,
       count(*) filter (where tier = 2) as tier2
from public.opportunities
group by 1
order by 1 desc;

-- ---------------------------------------------------------------------------
-- 10. Realtime (conectar a Supabase Realtime para el dashboard en vivo)
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.opportunities;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.scout_runs;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.alerts;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.bot_events;
  exception when duplicate_object then null;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 11. RLS
-- ---------------------------------------------------------------------------
alter table public.opportunities        enable row level security;
alter table public.opportunity_history  enable row level security;
alter table public.scout_runs           enable row level security;
alter table public.alerts               enable row level security;
alter table public.blue_oceans          enable row level security;
alter table public.bot_events           enable row level security;

-- Lectura pública (anon) para el dashboard. Las escrituras usan service_role,
-- que ignora RLS. Ajusta a `to authenticated` si el dashboard es privado.
drop policy if exists "lectura_publica" on public.opportunities;
create policy "lectura_publica" on public.opportunities        for select using (true);
drop policy if exists "lectura_publica" on public.opportunity_history;
create policy "lectura_publica" on public.opportunity_history  for select using (true);
drop policy if exists "lectura_publica" on public.scout_runs;
create policy "lectura_publica" on public.scout_runs           for select using (true);
drop policy if exists "lectura_publica" on public.alerts;
create policy "lectura_publica" on public.alerts               for select using (true);
drop policy if exists "lectura_publica" on public.blue_oceans;
create policy "lectura_publica" on public.blue_oceans          for select using (true);
drop policy if exists "lectura_publica" on public.bot_events;
create policy "lectura_publica" on public.bot_events           for select using (true);

-- ---------------------------------------------------------------------------
-- 12. Grants (PostgREST usa los roles anon/authenticated/service_role)
-- ---------------------------------------------------------------------------
grant select on
  public.opportunities,
  public.opportunity_history,
  public.scout_runs,
  public.alerts,
  public.blue_oceans,
  public.bot_events
to anon, authenticated;

grant select on public.v_kpis, public.v_por_zona, public.v_por_dia to anon, authenticated;

grant execute on function public.ingest_scout_payload(jsonb) to service_role;

-- El dashboard (anon) puede insertar eventos del bot si se expone desde el front.
-- Ajustar o eliminar según el modelo de seguridad deseado.
grant insert on public.bot_events to anon, authenticated;

