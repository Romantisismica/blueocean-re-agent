'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Opp = {
  id: string;
  external_id: string | null;
  name: string;
  developer: string | null;
  zone: string | null;
  tier: number | null;
  opportunity_type: string | null;
  status: string | null;
  classification: string | null;
  url: string | null;
  detected_gap: string | null;
  last_seen_at: string;
};

type Kpi = {
  total_oportunidades: number;
  tier1: number;
  tier2: number;
  completas: number;
  requieren_interaccion: number;
  zonas: number;
};

type Run = {
  id: string;
  ran_at: string;
  total: number;
  tier1_count: number;
  tier2_count: number;
};

type Ocean = {
  id: number;
  name: string;
  description: string | null;
  monthly_fee: string | null;
  variable_fee: string | null;
};

const card: React.CSSProperties = {
  background: '#121c30',
  border: '1px solid #22314f',
  borderRadius: 14,
  padding: 16,
};

export default function Page() {
  const [kpis, setKpis] = useState<Kpi | null>(null);
  const [opps, setOpps] = useState<Opp[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [oceans, setOceans] = useState<Ocean[]>([]);
  const [filter, setFilter] = useState<'all' | '1' | '2'>('all');
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [k, o, r, b] = await Promise.all([
      supabase.from('v_kpis').select('*').maybeSingle(),
      supabase
        .from('opportunities')
        .select('*')
        .order('last_seen_at', { ascending: false })
        .limit(200),
      supabase.from('scout_runs').select('*').order('ran_at', { ascending: false }).limit(12),
      supabase.from('blue_oceans').select('*').order('id'),
    ]);
    const err = k.error || o.error || r.error || b.error;
    if (err) setError(err.message);
    if (k.data) setKpis(k.data as Kpi);
    if (o.data) setOpps(o.data as Opp[]);
    if (r.data) setRuns(r.data as Run[]);
    if (b.data) setOceans(b.data as Ocean[]);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel('realtime-blueocean')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scout_runs' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => load())
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? opps : opps.filter((o) => String(o.tier) === filter)),
    [opps, filter]
  );

  const totalRuns = runs.reduce((a, r) => a + (r.total || 0), 0);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>🌊 BlueOcean RE · Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#8fa3c4' }}>
            Océanos Azules inmobiliarios · Sabaneta &amp; Envigado
          </p>
        </div>
        <span
          style={{
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 999,
            background: live ? '#10351f' : '#3a1d1d',
            color: live ? '#4ade80' : '#f87171',
            border: `1px solid ${live ? '#1c5c34' : '#5c2222'}`,
          }}
        >
          {live ? '● Tiempo real activo' : '○ Conectando…'}
        </span>
      </header>

      {error && (
        <p style={{ ...card, borderColor: '#5c2222', color: '#fca5a5', marginTop: 16 }}>
          Error Supabase: {error}. Verifica las variables de entorno.
        </p>
      )}

      {/* KPIs */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
          marginTop: 20,
        }}
      >
        <Kpi label="Oportunidades" value={kpis?.total_oportunidades ?? opps.length} />
        <Kpi label="Tier 1 (Core)" value={kpis?.tier1 ?? '—'} accent="#4ade80" />
        <Kpi label="Tier 2 (Look-a-Like)" value={kpis?.tier2 ?? '—'} accent="#60a5fa" />
        <Kpi label="Data completa" value={kpis?.completas ?? '—'} />
        <Kpi label="Requieren interacción" value={kpis?.requieren_interaccion ?? '—'} accent="#fbbf24" />
        <Kpi label="Zonas" value={kpis?.zonas ?? '—'} />
      </section>

      {/* Océanos Azules */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18 }}>🟦 3 Océanos Azules en monitoreo</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {oceans.map((o) => (
            <div key={o.id} style={card}>
              <strong>
                #{o.id} · {o.name}
              </strong>
              <p style={{ color: '#9fb2d0', fontSize: 13, minHeight: 40 }}>{o.description}</p>
              <div style={{ fontSize: 13, color: '#cdd9ec' }}>
                <div>💵 {o.monthly_fee}</div>
                <div>📈 {o.variable_fee}</div>
              </div>
            </div>
          ))}
          {oceans.length === 0 && <p style={{ color: '#8fa3c4' }}>Sin catálogo. Ejecuta `seed.sql`.</p>}
        </div>
      </section>

      {/* Corridas del scout */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18 }}>📡 Corridas del scout ({totalRuns} hallazgos acumulados)</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 90, ...card }}>
          {runs
            .slice()
            .reverse()
            .map((r) => (
              <div key={r.id} title={`${new Date(r.ran_at).toLocaleString()} · ${r.total}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
                <div style={{ height: Math.max(4, (r.tier2_count || 0) * 4), background: '#60a5fa', borderRadius: 3 }} />
                <div style={{ height: Math.max(4, (r.tier1_count || 0) * 4), background: '#4ade80', borderRadius: 3 }} />
              </div>
            ))}
          {runs.length === 0 && <span style={{ color: '#8fa3c4' }}>Sin ejecuciones registradas.</span>}
        </div>
      </section>

      {/* Tabla de oportunidades */}
      <section style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18 }}>🏙️ Oportunidades</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', '1', '2'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #22314f',
                  background: filter === f ? '#1c2b47' : 'transparent',
                  color: '#e6edf7',
                }}
              >
                {f === 'all' ? 'Todos' : `Tier ${f}`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...card, marginTop: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#8fa3c4' }}>
                <th style={{ padding: '8px 6px' }}>Proyecto</th>
                <th style={{ padding: '8px 6px' }}>Zona</th>
                <th style={{ padding: '8px 6px' }}>Tier</th>
                <th style={{ padding: '8px 6px' }}>Estado</th>
                <th style={{ padding: '8px 6px' }}>Detectado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} style={{ borderTop: '1px solid #1b2740' }}>
                  <td style={{ padding: '8px 6px', maxWidth: 320 }}>
                    {o.url ? (
                      <a href={o.url} target="_blank" rel="noreferrer" style={{ color: '#7cc4ff' }}>
                        {o.name}
                      </a>
                    ) : (
                      o.name
                    )}
                  </td>
                  <td style={{ padding: '8px 6px' }}>{o.zone ?? '—'}</td>
                  <td style={{ padding: '8px 6px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: o.tier === 1 ? '#10351f' : '#152a47',
                        color: o.tier === 1 ? '#4ade80' : '#60a5fa',
                      }}
                    >
                      T{o.tier ?? '?'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 6px', color: o.status === 'DATA_COMPLETE' ? '#4ade80' : '#fbbf24' }}>
                    {o.status ?? '—'}
                  </td>
                  <td style={{ padding: '8px 6px', color: '#8fa3c4' }}>
                    {new Date(o.last_seen_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 16, color: '#8fa3c4' }}>
                    Sin oportunidades. Ejecuta el scout o revisa la conexión.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer style={{ marginTop: 32, color: '#5f7398', fontSize: 12 }}>
        BlueOcean RE Agent · datos desde Supabase · actualización en tiempo real vía Realtime
      </footer>
    </main>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12, color: '#8fa3c4' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent ?? '#e6edf7' }}>{value}</div>
    </div>
  );
}
