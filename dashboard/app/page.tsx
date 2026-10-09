"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Waves,
  Buildings,
  MapPin,
  WarningCircle,
  ArrowsClockwise,
  CurrencyCircleDollar,
  Lightbulb,
  Info,
  SquaresFour,
  ListBullets,
  ArrowSquareOut,
  Clock,
  Tag,
} from "@phosphor-icons/react";
import { supabase } from "../lib/supabaseClient";

type Opp = {
  id: string;
  name: string;
  developer: string | null;
  zone: string | null;
  tier: number | null;
  status: string | null;
  url: string | null;
  image_url: string | null;
  description: string | null;
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

const TIER_LABEL: Record<number, { short: string; hint: string }> = {
  1: { short: "Prioritario", hint: "Está en Sabaneta o Envigado, tu zona principal." },
  2: { short: "Referencia", hint: "Está en una zona vecina; sirve para comparar precios e ideas." },
};

const STATUS_LABEL: Record<string, { text: string; hint: string }> = {
  DATA_COMPLETE: { text: "Info completa", hint: "Ya tenemos constructora y datos del proyecto." },
  REQUIRES_CHATBOT_INTERACTION: {
    text: "Falta verificar",
    hint: "Aún falta la constructora o los precios; hay que confirmarlos.",
  },
};

function tierInfo(t: number | null) {
  return TIER_LABEL[t ?? 2] ?? TIER_LABEL[2];
}
function statusInfo(s: string | null) {
  return STATUS_LABEL[s ?? ""] ?? { text: "Por revisar", hint: "Estado pendiente de clasificar." };
}
function haceCuanto(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}

export default function Page() {
  const [kpis, setKpis] = useState<Kpi | null>(null);
  const [opps, setOpps] = useState<Opp[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [oceans, setOceans] = useState<Ocean[]>([]);
  const [filter, setFilter] = useState<"all" | "1" | "2">("all");
  const [view, setView] = useState<"catalogo" | "tabla">("catalogo");
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

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

  const lastRun = runs[0];

  return (
    <div className="relative mx-auto max-w-[1200px] px-4 pb-16 pt-5 sm:px-6">
      {/* Barra superior */}
      <header className="glass glass-edge sticky top-3 z-20 flex items-center justify-between gap-4 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-inset ring-white/10">
            <Waves {...ICON} size={22} />
          </span>
          <div className="leading-tight">
            <h1 className="text-[15px] font-semibold tracking-tight">Catálogo de proyectos</h1>
            <p className="text-xs text-white/45">
              {lastRun ? `Última búsqueda ${haceCuanto(lastRun.ran_at)}` : "Sabaneta y Envigado"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp((v) => !v)}
            className="glass hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/70 transition hover:text-white active:translate-y-px sm:flex"
          >
            <Info size={14} weight="bold" />
            ¿Cómo se lee?
          </button>
          <button
            onClick={load}
            className="glass hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white/70 transition hover:text-white active:translate-y-px md:flex"
          >
            <ArrowsClockwise size={14} weight="bold" />
            Actualizar
          </button>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ring-1 ring-inset ${
              live ? "bg-accent/10 text-accent ring-accent/25" : "bg-white/5 text-white/50 ring-white/10"
            }`}
          >
            <span className={`size-2 rounded-full ${live ? "bg-accent live-dot" : "bg-white/40"}`} />
            {live ? "En vivo" : "Conectando…"}
          </span>
        </div>
      </header>

      {/* Introducción */}
      <section className="mt-8 mb-6">
        <h2 className="max-w-[24ch] text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl">
          Todos los proyectos que <span className="italic text-accent">encontramos para ti</span>
        </h2>
        <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-white/55">
          Cada tarjeta es un proyecto inmobiliario detectado en Sabaneta y Envigado (o en zonas
          vecinas). Puedes ver su imagen, quién lo construye, dónde está y qué tan completo está el
          dato. Haz clic en el nombre para abrir la página original.
        </p>
      </section>

      {/* Ayuda / explicaciones */}
      {showHelp && (
        <div className="glass mb-6 grid gap-4 rounded-2xl p-5 text-sm text-white/70 sm:grid-cols-2">
          <HelpItem
            icon={<Lightbulb size={16} weight="duotone" className="text-accent" />}
            title="Prioritario"
            body="Proyecto en Sabaneta o Envigado. Es lo que más te interesa revisar primero."
          />
          <HelpItem
            icon={<Lightbulb size={16} weight="duotone" className="text-cool" />}
            title="Referencia"
            body="Proyecto en una zona vecina. Sirve para comparar precios, amenidades e ideas."
          />
          <HelpItem
            icon={<Buildings size={16} weight="duotone" className="text-accent" />}
            title="Info completa"
            body="Ya sabemos la constructora y los datos del proyecto."
          />
          <HelpItem
            icon={<WarningCircle size={16} weight="duotone" className="text-amber-300" />}
            title="Falta verificar"
            body="Todavía no sabemos la constructora o los precios. Hay que confirmarlos."
          />
          <HelpItem
            icon={<Tag size={16} weight="duotone" className="text-accent" />}
            title="Idea de negocio"
            body="Producto o servicio que podrías lanzar aprovechando estos proyectos."
          />
          <HelpItem
            icon={<Clock size={16} weight="duotone" className="text-cool" />}
            title="Encontrado"
            body="Cuándo el buscador vio por última vez este proyecto."
          />
        </div>
      )}

      {error && (
        <div className="glass mb-6 flex items-start gap-3 rounded-2xl border-red-400/20 p-4 text-sm text-red-200/90">
          <WarningCircle size={20} weight="duotone" className="mt-0.5 shrink-0" />
          <div>
            <strong className="font-medium">No pudimos conectar con la base de datos.</strong>
            <p className="text-red-200/70">{error}. Revisa las credenciales de Supabase.</p>
          </div>
        </div>
      )}

      {/* Resumen */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiTile label="Proyectos" value={kpis?.total_oportunidades ?? opps.length} hint="En el catálogo" loading={loading} />
        <KpiTile label="Prioritarios" value={kpis?.tier1 ?? "—"} hint="Sabaneta / Envigado" accent loading={loading} />
        <KpiTile label="De referencia" value={kpis?.tier2 ?? "—"} hint="Zonas vecinas" loading={loading} />
        <KpiTile label="Con info completa" value={kpis?.completas ?? "—"} hint="Listos para analizar" loading={loading} />
        <KpiTile label="Falta verificar" value={kpis?.requieren_interaccion ?? "—"} hint="Necesitan más datos" warn loading={loading} />
        <KpiTile label="Zonas" value={kpis?.zonas ?? "—"} hint="Sectores distintos" loading={loading} />
      </section>

      {/* Ideas de negocio */}
      <SectionTitle
        icon={<Lightbulb {...ICON} />}
        title="Ideas de negocio en seguimiento"
        subtitle="Productos que podrías lanzar aprovechando estos proyectos."
      />
      <section className="grid gap-4 md:grid-cols-3">
        {oceans.map((o) => (
          <article key={o.id} className="glass tilt relative overflow-hidden rounded-2xl p-5">
            <div className="absolute -right-8 -top-8 size-28 rounded-full bg-accent/10 blur-2xl" />
            <div className="flex items-center gap-2 text-xs text-white/45">
              <span className="font-mono">Idea {o.id}</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <h3 className="mt-3 text-[15px] font-semibold leading-snug">{o.name}</h3>
            <p className="mt-2 min-h-[40px] text-xs leading-relaxed text-white/50">{o.description}</p>
            <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-xs">
              <div className="flex items-center gap-2 text-white/75">
                <CurrencyCircleDollar size={15} weight="duotone" className="text-accent" />
                <span className="font-mono">{o.monthly_fee}</span>
                <span className="text-white/40">al mes</span>
              </div>
              <div className="flex items-center gap-2 text-white/55">
                <Tag size={15} weight="duotone" />
                <span className="font-mono">{o.variable_fee}</span>
              </div>
            </div>
          </article>
        ))}
        {oceans.length === 0 && !loading && <EmptyState text="Aún no hay ideas cargadas." />}
      </section>

      {/* Catálogo */}
      <SectionTitle
        icon={<Buildings {...ICON} />}
        title="Catálogo de proyectos"
        subtitle="Cada proyecto indexado con su imagen, constructora y ubicación."
        right={
          <div className="flex items-center gap-2">
            <div className="glass flex gap-1 rounded-full p-1">
              {(["all", "1", "2"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    filter === f ? "bg-white/12 text-white" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {f === "all" ? "Todos" : f === "1" ? "Prioritarios" : "Referencia"}
                </button>
              ))}
            </div>
            <div className="glass hidden gap-1 rounded-full p-1 sm:flex">
              <button
                onClick={() => setView("catalogo")}
                title="Ver como catálogo"
                className={`grid size-7 place-items-center rounded-full transition ${
                  view === "catalogo" ? "bg-white/12 text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                <SquaresFour size={15} weight="bold" />
              </button>
              <button
                onClick={() => setView("tabla")}
                title="Ver como tabla"
                className={`grid size-7 place-items-center rounded-full transition ${
                  view === "tabla" ? "bg-white/12 text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                <ListBullets size={15} weight="bold" />
              </button>
            </div>
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass h-64 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <EmptyState text="Todavía no hay proyectos en el catálogo. Ejecuta una búsqueda." />
        </div>
      ) : view === "catalogo" ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => (
            <ProjectCard key={o.id} o={o} />
          ))}
        </section>
      ) : (
        <ProjectsTable rows={filtered} />
      )}

      <footer className="mt-10 text-center text-xs text-white/30">
        Se actualiza solo cuando llegan datos nuevos · información desde tu base de datos
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ProjectCard({ o }: { o: Opp }) {
  const t = tierInfo(o.tier);
  const s = statusInfo(o.status);
  return (
    <article className="glass tilt group relative flex flex-col overflow-hidden rounded-2xl">
      <div className="relative aspect-[16/10] overflow-hidden">
        <ProjectImage src={o.image_url} name={o.name} tier={o.tier} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
        <span
          title={t.hint}
          className={`absolute left-3 top-3 inline-flex cursor-help rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset backdrop-blur ${
            o.tier === 1
              ? "bg-accent/20 text-accent ring-accent/30"
              : "bg-cool/20 text-cool ring-cool/30"
          }`}
        >
          {t.short}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold leading-snug text-white/95">{o.name}</h3>
          {o.url && (
            <a
              href={o.url}
              target="_blank"
              rel="noreferrer"
              title="Abrir la página del proyecto"
              className="shrink-0 text-white/40 transition hover:text-accent"
            >
              <ArrowSquareOut size={18} weight="bold" />
            </a>
          )}
        </div>

        <p className="mt-1 text-xs text-white/50">
          {o.developer && o.developer !== "Por identificar" ? o.developer : "Constructora sin confirmar"}
        </p>

        {o.description && (
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/45">{o.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-white/60">
            <MapPin size={14} weight="duotone" />
            {o.zone ?? "Sin ubicación"}
          </span>
          <span
            title={s.hint}
            className={`cursor-help ${o.status === "DATA_COMPLETE" ? "text-accent" : "text-amber-300/90"}`}
          >
            {s.text}
          </span>
        </div>
      </div>
    </article>
  );
}

function ProjectImage({ src, name, tier }: { src: string | null; name: string; tier: number | null }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (!src || failed) {
    return (
      <div
        className={`grid h-full w-full place-items-center ${
          tier === 1
            ? "bg-gradient-to-br from-accent/25 via-ink-800 to-ink-900"
            : "bg-gradient-to-br from-cool/20 via-ink-800 to-ink-900"
        }`}
      >
        <span className="text-3xl font-semibold tracking-tight text-white/70">{initials}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
    />
  );
}

function ProjectsTable({ rows }: { rows: Opp[] }) {
  return (
    <section className="glass overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-white/40">
              <th className="px-5 py-3 font-medium">Proyecto</th>
              <th className="px-5 py-3 font-medium">Dónde</th>
              <th className="px-5 py-3 font-medium">Prioridad</th>
              <th className="px-5 py-3 font-medium">Información</th>
              <th className="px-5 py-3 font-medium">Encontrado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const t = tierInfo(o.tier);
              const s = statusInfo(o.status);
              return (
                <tr key={o.id} className="border-t border-white/5 transition hover:bg-white/[0.035]">
                  <td className="max-w-[320px] px-5 py-3.5">
                    {o.url ? (
                      <a href={o.url} target="_blank" rel="noreferrer" className="font-medium text-white/90 underline-offset-4 hover:text-accent hover:underline">
                        {o.name}
                      </a>
                    ) : (
                      <span className="font-medium text-white/90">{o.name}</span>
                    )}
                    <div className="mt-0.5 text-xs text-white/40">
                      {o.developer && o.developer !== "Por identificar" ? o.developer : "Constructora sin confirmar"}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-white/70">
                      <MapPin size={14} weight="duotone" />
                      {o.zone ?? "Sin ubicación"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      title={t.hint}
                      className={`inline-flex cursor-help rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        o.tier === 1 ? "bg-accent/10 text-accent ring-accent/25" : "bg-cool/10 text-cool ring-cool/25"
                      }`}
                    >
                      {t.short}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span title={s.hint} className={`cursor-help text-xs ${o.status === "DATA_COMPLETE" ? "text-accent" : "text-amber-300/90"}`}>
                      {s.text}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-white/40">
                    {new Date(o.last_seen_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function KpiTile({
  label,
  value,
  hint,
  accent,
  warn,
  loading,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
  warn?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="glass tilt relative overflow-hidden rounded-2xl p-4">
      <div className="absolute -right-6 -top-6 size-16 rounded-full bg-white/5 blur-xl" />
      <div className="text-[11px] font-medium leading-tight text-white/50">{label}</div>
      {loading ? (
        <div className="mt-2 h-8 w-12 animate-pulse rounded bg-white/8" />
      ) : (
        <div className={`depth-num mt-1 font-mono text-3xl font-semibold tracking-tight ${accent ? "text-accent" : warn ? "text-amber-300" : "text-white"}`}>
          {value}
        </div>
      )}
      {hint && <div className="mt-0.5 text-[10px] leading-tight text-white/35">{hint}</div>}
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mt-10 mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-medium text-white/85">
          <span className="text-accent">{icon}</span>
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-xs text-white/40">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function HelpItem({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <div className="text-white/85">{title}</div>
        <div className="text-xs text-white/50">{body}</div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-white/40">{text}</p>;
}
