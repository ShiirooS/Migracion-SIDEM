import { useState, useEffect } from "react";
import { getMetrics, type Metrics } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2, AlertTriangle, BarChart3, FileText, Clock,
  CheckCircle, XCircle, RefreshCw, Inbox, ShieldAlert,
  TrendingUp, Users, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Donut SVG ──────────────────────────────────────────────────────────────────
function DonutChart({ slices }: {
  slices: { value: number; color: string; label: string }[];
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-36 w-36 items-center justify-center rounded-full border-8 border-muted bg-muted/20">
        <span className="text-xs text-muted-foreground">Sin datos</span>
      </div>
    );
  }

  const r = 54;
  const cx = 72;
  const cy = 72;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const paths = slices.map((s) => {
    const pct = s.value / total;
    const dash = pct * circ;
    const gap = circ - dash;
    const rotation = (offset / total) * 360 - 90;
    offset += s.value;
    return { ...s, dash, gap, rotation };
  });

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 144 144" className="h-full w-full -rotate-0">
        {paths.map((p, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={p.color}
            strokeWidth="18"
            strokeDasharray={`${p.dash} ${p.gap}`}
            strokeDashoffset={-(offset - p.value) / total * circ - circ / 4 + circ / 4}
            transform={`rotate(${p.rotation} ${cx} ${cy})`}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{total}</span>
        <span className="text-[10px] text-muted-foreground">total</span>
      </div>
    </div>
  );
}

// ── Mini stat card ─────────────────────────────────────────────────────────────
function KpiCard({
  label, value, icon: Icon, color, bg, sub,
}: {
  label: string; value: number; icon: React.ElementType;
  color: string; bg: string; sub?: string;
}) {
  return (
    <Card className="relative overflow-hidden shadow-sm">
      <div className={cn("absolute inset-0 opacity-[0.06]", bg)} />
      <CardContent className="relative pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className={cn("mt-1 text-3xl font-bold tabular-nums", color)}>{value}</p>
            {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
          </div>
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl">
            <div className={cn("absolute inset-0 opacity-15", bg)} />
            <Icon className={cn("relative h-5 w-5", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Barra horizontal ───────────────────────────────────────────────────────────
function HBar({ label, value, total, color }: {
  label: string; value: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="max-w-[55%] truncate font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {value} <span className="text-[10px]">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-[200ms]", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Pipeline estado ────────────────────────────────────────────────────────────
function PipelineStep({
  label, value, color, last = false,
}: { label: string; value: number; color: string; last?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center gap-1 text-center">
        <div className={cn("flex h-12 w-16 items-center justify-center rounded-xl text-xl font-bold text-white shadow-sm", color)}>
          {value}
        </div>
        <p className="text-[10px] font-medium text-muted-foreground leading-tight max-w-[4rem] text-center">{label}</p>
      </div>
      {!last && <div className="mb-4 text-muted-foreground/30 text-lg">›</div>}
    </div>
  );
}

// ── Principal ─────────────────────────────────────────────────────────────────
export function MetricasSNM() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar métricas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Cargando métricas…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!metrics) return null;

  const tasaResolucion = metrics.resueltas > 0
    ? Math.round((metrics.aprobados / metrics.resueltas) * 100)
    : 0;

  const riesgoSlices = [
    { label: "ALTO",     value: metrics.por_riesgo["ALTO"]     ?? 0, color: "#ef4444" },
    { label: "MEDIO",    value: metrics.por_riesgo["MEDIO"]    ?? 0, color: "#f59e0b" },
    { label: "BAJO",     value: metrics.por_riesgo["BAJO"]     ?? 0, color: "#10b981" },
    { label: "Sin score",value: metrics.por_riesgo["SIN_SCORE"] ?? 0, color: "#94a3b8" },
  ].filter(s => s.value > 0);

  const categoriasOrdenadas = Object.entries(metrics.por_categoria)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const CAT_COLORS = [
    "bg-blue-500", "bg-violet-500", "bg-cyan-500",
    "bg-teal-500", "bg-indigo-500", "bg-sky-500",
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border bg-institutional p-6 text-institutional-foreground shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-institutional-foreground/50">
              Sistema Nacional de Migración · Panamá
            </p>
            <h1 className="mt-1 text-2xl font-bold">Métricas operativas</h1>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <p className="text-xs text-institutional-foreground/40">
                Actualizado {lastUpdated.toLocaleTimeString("es-PA", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={cargar}
              disabled={loading}
              className="gap-2 text-institutional-foreground/70 hover:bg-institutional-hover hover:text-institutional-foreground"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Métricas top en el header */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total expedientes", value: metrics.total,        icon: BarChart3,   color: "text-institutional-foreground" },
            { label: "Ingresados hoy",    value: metrics.hoy,          icon: TrendingUp,  color: "text-blue-300" },
            { label: "En proceso",        value: metrics.pendientes + metrics.en_evaluacion, icon: Activity, color: "text-gold" },
            { label: "Resueltos",         value: metrics.resueltas,    icon: CheckCircle, color: "text-emerald-300" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-institutional-foreground/5 p-4">
              <div className="flex items-center gap-2">
                <s.icon className={cn("h-4 w-4", s.color)} />
                <p className="text-xs text-institutional-foreground/50">{s.label}</p>
              </div>
              <p className={cn("mt-2 text-3xl font-bold tabular-nums", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI secundarios ──────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Pendientes de revisión"
          value={metrics.pendientes}
          icon={Inbox}
          color="text-amber-600"
          bg="bg-amber-500"
          sub="Esperan asignación"
        />
        <KpiCard
          label="En evaluación"
          value={metrics.en_evaluacion}
          icon={FileText}
          color="text-blue-600"
          bg="bg-blue-500"
          sub="Agentes trabajando"
        />
        <KpiCard
          label="Aprobados"
          value={metrics.aprobados}
          icon={CheckCircle}
          color="text-emerald-600"
          bg="bg-emerald-500"
          sub={`${tasaResolucion}% tasa de aprobación`}
        />
        <KpiCard
          label="Rechazados"
          value={metrics.rechazados}
          icon={XCircle}
          color="text-red-600"
          bg="bg-red-500"
          sub={`${100 - tasaResolucion}% tasa de rechazo`}
        />
      </div>

      {/* ── Fila media: riesgo + categorías ──────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Donut de riesgo */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              Distribución por nivel de riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <DonutChart slices={riesgoSlices} />
              <div className="flex-1 space-y-2.5">
                {[
                  { label: "ALTO",      color: "bg-red-500",   textColor: "text-red-600",   key: "ALTO" },
                  { label: "MEDIO",     color: "bg-amber-500", textColor: "text-amber-600",  key: "MEDIO" },
                  { label: "BAJO",      color: "bg-emerald-500", textColor: "text-emerald-600", key: "BAJO" },
                  { label: "Sin score", color: "bg-muted-foreground/50", textColor: "text-muted-foreground", key: "SIN_SCORE" },
                ].map(({ label, color, textColor, key }) => {
                  const val = metrics.por_riesgo[key] ?? 0;
                  const pct = metrics.total > 0 ? Math.round((val / metrics.total) * 100) : 0;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", color)} />
                      <span className="flex-1 text-xs text-muted-foreground">{label}</span>
                      <span className={cn("text-xs font-bold tabular-nums", textColor)}>{val}</span>
                      <span className="w-8 text-right text-[10px] text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mini barras dentro del card */}
            <div className="mt-4 space-y-1.5 border-t pt-4">
              {[
                { key: "ALTO",  color: "bg-red-500",     label: "ALTO" },
                { key: "MEDIO", color: "bg-amber-500",   label: "MEDIO" },
                { key: "BAJO",  color: "bg-emerald-500", label: "BAJO" },
              ].map(({ key, color, label }) => {
                const val = metrics.por_riesgo[key] ?? 0;
                const pct = metrics.total > 0 ? Math.round((val / metrics.total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-2 text-[11px]">
                    <span className="w-10 text-muted-foreground">{label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right font-medium">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Categorías migratorias */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              Categorías migratorias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoriasOrdenadas.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin datos disponibles</p>
            )}
            {categoriasOrdenadas.map(([cat, count], i) => (
              <HBar
                key={cat}
                label={cat}
                value={count}
                total={metrics.total}
                color={CAT_COLORS[i] ?? "bg-slate-500"}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Pipeline de estados ───────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Pipeline de expedientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-start gap-1">
            <PipelineStep label="Pendientes"    value={metrics.pendientes}     color="bg-amber-500" />
            <PipelineStep label="En evaluación" value={metrics.en_evaluacion}  color="bg-blue-500" />
            <PipelineStep label="Aprobados"     value={metrics.aprobados}      color="bg-emerald-500" />
            <PipelineStep label="Rechazados"    value={metrics.rechazados}     color="bg-red-500" last />
          </div>

          {/* Barra de resolución */}
          {metrics.resueltas > 0 && (
            <div className="mt-5 space-y-2 border-t pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Tasa de resolución</span>
                <span className="font-bold text-emerald-600">{tasaResolucion}% aprobación</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-emerald-500 transition-all duration-[200ms]"
                  style={{ width: `${tasaResolucion}%` }}
                />
                <div
                  className="bg-red-500 transition-all duration-[200ms]"
                  style={{ width: `${100 - tasaResolucion}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>✓ Aprobados: {metrics.aprobados}</span>
                <span>✗ Rechazados: {metrics.rechazados}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
