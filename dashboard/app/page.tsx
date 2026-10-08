"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Waves,
  Broadcast,
  Buildings,
  MapPin,
  Stack,
  WarningCircle,
  ArrowsClockwise,
  CurrencyCircleDollar,
  Sparkle,
} from "@phosphor-icons/react";
import { supabase } from "../lib/supabaseClient";

type Opp = {
  id: string;
  name: string;
  developer: string | null;
  zone: string | null;
  tier: number | null;
  opportunity_type: string | null;
  status: string | null;
  url: string | null;
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

type Run = { id: string; ran_at: string; total: number; tier1_count: number; tier2_count: number };
type Ocean = { id: number; name: string; description: string | null; monthly_fee: string | null; variable_fee: string | null };

const ICON = { weight: "duotone" as const, size: 20 };

export default function Page() {
  const [kpis, setKpis] = useState<Kpi | null>(null);
  const [opps, setOpps] = useState<Opp[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [oceans, setOceans] = useState<Ocean[]>([]);
  const [filter, setFilter] = useState<"all" | "1" | "2">("all");
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [k, o, r, b] = await Promise.all([
      supabase.from("v_kpis").select("*").maybeSingle(),
      supabase.from("opportunities").select("*").order("last_seen_at", { ascending: false }).limit(200),
      supabase.from("scout_runs").select("*").order("ran_at", { ascending: false }).limit(12),
      supabase.from("blue_oceans").select("*").order("id"),
    ]);
    const err = k.error || o.error || r.error || b.error;
    setError(err ? err.message : null);
    if (k.data) setKpis(k.data as Kpi);
    if (o.data) setOpps(o.data as Opp[]);
    if (r.data) setRuns(r.data as Run[]);
    if (b.data) setOceans(b.data as Ocean[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("realtime-blueocean")
      .on("postgres_changes", { event: "*", schema: "public", table: "opportunities" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "scout_runs" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => load())
      .subscribe((s) => setLive(s === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? opps : opps.filter((o) => String(o.tier) === filter)),
    [opps, filter]
  );

  return (
    <div className="relative mx-auto max-w-[1200px] px-4 pb-16 pt-5 sm:px-6">
      {/* Header */}
      <header className="glass glass-edge sticky top-3 z-20 flex items-center justify-between gap-4 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-inset ring-white/10">
            <Waves {...ICON} size={22} />
          </span>
          <div className="leading-tight">
            <h1 className="text-[15px] font-semibold tracking-tight">BlueOcean RE</h1>
            <p className="text-xs text-white/45">Sabaneta &amp; Envigado · Océanos Azules</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="glass hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/70 transition hover:text-white active:translate-y-px sm:flex"
          >
            <ArrowsClockwise size={14} weight="bold" />
            Actualizar
          </button>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ring-1 ring-inset ${
              live
                ? "bg-accent/10 text-accent ring-accent/25"
                : "bg-white/5 text-white/50 ring-white/10"
            }`}
          >
            <span className={`size-2 rounded-full ${live ? "bg-accent live-dot" : "bg-white/40"}`} />
            {live ? "Tiempo real" : "Conectando…"}
          </span>
        </div>
      </header>

      {/* Intro */}
      <section className="mt-8 mb-6">
        <h2 className="max-w-[22ch] text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl">
          Inteligencia de <span className="italic text-accent">océanos azules</span> inmobiliarios
        </h2>
        <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-white/55">
          Rastreo diario de proyectos sobre planos, clasificados por prioridad y con histórico
          consultable. Los datos llegan desde Supabase y se actualizan en vivo.
        </p>
      </section>

      {error && (
        <div className="glass mb-6 flex items-start gap-3 rounded-2xl border-red-400/20 p-4 text-sm text-red-200/90">
          <WarningCircle size={20} weight="duotone" className="mt-0.5 shrink-0" />
          <div>
            <strong className="font-medium">Error de conexión a Supabase.</strong>
            <p className="text-red-200/70">{error}. Verifica las variables de entorno.</p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiTile label="Oportunidades" value={kpis?.total_oportunidades ?? opps.length} loading={loading} />
        <KpiTile label="Tier 1 · Core" value={kpis?.tier1 ?? "—"} accent loading={loading} />
        <KpiTile label="Tier 2 · Look-a-like" value={kpis?.tier2 ?? "—"} loading={loading} />
        <KpiTile label="Data completa" value={kpis?.completas ?? "—"} loading={loading} />
        <KpiTile label="Requieren interacción" value={kpis?.requieren_interaccion ?? "—"} warn loading={loading} />
        <KpiTile label="Zonas" value={kpis?.zonas ?? "—"} loading={loading} />
      </section>

      {/* Océanos */}
      <SectionTitle icon={<Sparkle {...ICON} />} title="3 Océanos Azules en monitoreo" />
      <section className="grid gap-4 md:grid-cols-3">
        {oceans.map((o) => (
          <article key={o.id} className="glass tilt relative overflow-hidden rounded-2xl p-5">
            <div className="absolute -right-8 -top-8 size-28 rounded-full bg-accent/10 blur-2xl" />
            <div className="flex items-center gap-2 text-xs text-white/45">
              <span className="font-mono">#{o.id}</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <h3 className="mt-3 text-[15px] font-semibold leading-snug">{o.name}</h3>
            <p className="mt-2 min-h-[40px] text-xs leading-relaxed text-white/50">{o.description}</p>
            <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-xs">
              <div className="flex items-center gap-2 text-white/75">
                <CurrencyCircleDollar size={15} weight="duotone" className="text-accent" />
                <span className="font-mono">{o.monthly_fee}</span>
              </div>
              <div className="flex items-center gap-2 text-white/55">
                <Broadcast size={15} weight="duotone" />
                <span className="font-mono">{o.variable_fee}</span>
              </div>
            </div>
          </article>
        ))}
        {oceans.length === 0 && !loading && <EmptyState text="Sin catálogo. Ejecuta seed.sql." />}
      </section>

      {/* Corridas */}
      <SectionTitle icon={<Stack {...ICON} />} title="Corridas del scout" />
      <section className="glass rounded-2xl p-5">
        {runs.length === 0 ? (
          <EmptyState text="Sin ejecuciones registradas." />
        ) : (
          <div className="flex h-28 items-end gap-2">
            {runs
              .slice()
              .reverse()
              .map((r) => (
                <div
                  key={r.id}
                  title={`${new Date(r.ran_at).toLocaleString()} · ${r.total} hallazgos`}
                  className="group flex flex-1 flex-col items-stretch justify-end gap-0.5"
                >
                  <div
                    className="rounded-t bg-cool/70 transition group-hover:bg-cool"
                    style={{ height: Math.max(3, (r.tier2_count || 0) * 5) }}
                  />
                  <div
                    className="rounded-t bg-accent/80 transition group-hover:bg-accent"
                    style={{ height: Math.max(4, (r.tier1_count || 0) * 5) }}
                  />
                </div>
              ))}
          </div>
        )}
        <div className="mt-4 flex items-center gap-4 border-t border-white/10 pt-3 text-xs text-white/45">
          <Legend color="bg-accent" label="Tier 1" />
          <Legend color="bg-cool" label="Tier 2" />
          <span className="ml-auto font-mono">
            {runs.reduce((a, r) => a + (r.total || 0), 0)} hallazgos acumulados
          </span>
        </div>
      </section>

      {/* Oportunidades */}
      <SectionTitle
        icon={<Buildings {...ICON} />}
        title="Oportunidades"
        right={
          <div className="glass flex gap-1 rounded-full p-1">
            {(["all", "1", "2"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  filter === f ? "bg-white/12 text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                {f === "all" ? "Todos" : `Tier ${f}`}
              </button>
            ))}
          </div>
        }
      />
      <section className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-white/40">
                <th className="px-5 py-3 font-medium">Proyecto</th>
                <th className="px-5 py-3 font-medium">Zona</th>
                <th className="px-5 py-3 font-medium">Tier</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Detectado</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-3 w-24 animate-pulse rounded bg-white/8" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!loading &&
                filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-white/5 transition hover:bg-white/[0.035]"
                  >
                    <td className="max-w-[320px] px-5 py-3.5">
                      {o.url ? (
                        <a
                          href={o.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-white/90 underline-offset-4 hover:text-accent hover:underline"
                        >
                          {o.name}
                        </a>
                      ) : (
                        <span className="font-medium text-white/90">{o.name}</span>
                      )}
                      <div className="mt-0.5 text-xs text-white/40">{o.developer ?? "Por identificar"}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-white/70">
                        <MapPin size={14} weight="duotone" />
                        {o.zone ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          o.tier === 1
                            ? "bg-accent/10 text-accent ring-accent/25"
                            : "bg-cool/10 text-cool ring-cool/25"
                        }`}
                      >
                        T{o.tier ?? "?"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs ${
                          o.status === "DATA_COMPLETE" ? "text-accent" : "text-amber-300/90"
                        }`}
                      >
                        {o.status === "DATA_COMPLETE" ? "Completo" : "Requiere interacción"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-white/40">
                      {new Date(o.last_seen_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-white/45">
                    <EmptyState text="Sin oportunidades. Ejecuta el scout." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-10 text-center text-xs text-white/30">
        BlueOcean RE Agent · datos desde Supabase · actualización en vivo vía Realtime
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function KpiTile({
  label,
  value,
  accent,
  warn,
  loading,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  warn?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="glass tilt relative overflow-hidden rounded-2xl p-4">
      <div className="absolute -right-6 -top-6 size-16 rounded-full bg-white/5 blur-xl" />
      <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
      {loading ? (
        <div className="mt-2 h-8 w-12 animate-pulse rounded bg-white/8" />
      ) : (
        <div
          className={`depth-num mt-1 font-mono text-3xl font-semibold tracking-tight ${
            accent ? "text-accent" : warn ? "text-amber-300" : "text-white"
          }`}
        >
          {value}
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  right,
}: {
  icon: ReactNode;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="mt-10 mb-4 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2 text-sm font-medium text-white/80">
        <span className="text-accent">{icon}</span>
        {title}
      </h2>
      {right}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-white/40">{text}</p>;
}
