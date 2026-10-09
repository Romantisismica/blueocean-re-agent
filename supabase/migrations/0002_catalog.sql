-- ============================================================================
-- 0002 - Catálogo: imagen y descripción por proyecto
-- ============================================================================

alter table public.opportunities add column if not exists image_url   text;
alter table public.opportunities add column if not exists description text;

-- RPC de ingesta actualizada para incluir imagen y descripción
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
      launch_date, typologies, value_proposition, detected_gap, url, status,
      image_url, description
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
      item->>'status',
      item->>'image_url',
      item->>'description'
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
      image_url         = coalesce(excluded.image_url, public.opportunities.image_url),
      description       = coalesce(excluded.description, public.opportunities.description),
      last_seen_at      = now()
    returning id into v_opp_id;

    insert into public.opportunity_history (opportunity_id, run_id, snapshot)
    values (v_opp_id, v_run_id, item);
  end loop;

  return v_run_id;
end;
$$;
