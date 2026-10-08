-- Catálogo de los 3 Océanos Azules
insert into public.blue_oceans (id, name, description, monthly_fee, variable_fee, tier_focus)
values
  (1, 'Operador de Renta Corta Event-Driven',
      'Gestión profesional de renta corta optimizada por eventos de DAVIarena y Ciudad Peldar.',
      '$79-149k COP/unidad/mes', '8-12% por reserva', 'Sabaneta (DAVIarena), Envigado (Ciudad Peldar)'),
  (2, 'Marketplace P2P de Parqueaderos',
      'Alquiler de parqueaderos vecino-vecino dentro de conjuntos residenciales masivos.',
      '$180-450k COP/conjunto/mes', '10-15% por transacción', 'Envigado, Sabaneta'),
  (3, 'Concierge SaaS para Expats / Nómadas',
      'App de edificio bilingüe: amenities, concierge y servicios para residentes internacionales.',
      '$20-35k COP/unidad/mes', '15-20% por servicios', 'Envigado, Sabaneta')
on conflict (id) do update set
  name         = excluded.name,
  description  = excluded.description,
  monthly_fee  = excluded.monthly_fee,
  variable_fee = excluded.variable_fee,
  tier_focus   = excluded.tier_focus,
  updated_at   = now();
