import { useState, useEffect } from "react";
import { getApplication, submitVerdict, requestSubsanacion } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2, AlertTriangle, FileText, ArrowLeft, Check, X,
  User, CreditCard, Globe, Calendar, Wallet, ShieldAlert,
  ShieldCheck, ShieldX, Flag, ClipboardCheck, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AppDetail {
  id: string;
  ticket_number: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  nacionalidad_codigo: string;
  numero_pasaporte: string;
  vencimiento_pasaporte: string;
  categoria_migratoria: string;
  monto_subsistencia: string;
  estado: string;
  nivel_riesgo: string | null;
  score_riesgo: number | null;
  interpol_alerta_encontrada: boolean;
  interpol_alerta_tipo: string | null;
  interpol_alerta_detalle: string | null;
  ofac_alerta_encontrada: boolean;
  ofac_alerta_detalle: string | null;
  pais_restringido_encontrada: boolean;
  url_solvencia: string | null;
  url_antecedentes: string | null;
  agente_asignado_id: string | null;
}

interface Props {
  applicationId: string;
  session: { rol: "AGENTE" | "ADMIN"; id: string };
  onVolver: () => void;
}

const ESTADO_CFG: Record<string, { label: string; cls: string }> = {
  PENDIENTE:             { label: "Pendiente",           cls: "bg-amber-100 text-amber-800 border border-amber-300" },
  EN_EVALUACION:         { label: "En evaluación",       cls: "bg-blue-100 text-blue-800 border border-blue-300" },
  APROBADO:              { label: "Aprobado",            cls: "bg-emerald-100 text-emerald-800 border border-emerald-300" },
  RECHAZADO:             { label: "Rechazado",           cls: "bg-red-100 text-red-800 border border-red-300" },
  SUBSANACION_PENDIENTE: { label: "Subsanación pend.",   cls: "bg-slate-100 text-slate-700 border border-slate-300" },
};

const NIVEL_CFG: Record<string, { cls: string; bar: string; label: string }> = {
  BAJO:  { cls: "text-emerald-600", bar: "bg-emerald-500", label: "BAJO" },
  MEDIO: { cls: "text-amber-600",   bar: "bg-amber-500",   label: "MEDIO" },
  ALTO:  { cls: "text-red-600",     bar: "bg-red-500",     label: "ALTO" },
};

function ScoreGauge({ score, nivel }: { score: number; nivel: string | null }) {
  const cfg = NIVEL_CFG[nivel ?? ""] ?? { cls: "text-muted-foreground", bar: "bg-muted", label: "—" };
  const pct = Math.min(100, Math.max(0, score));
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor"
            className="text-muted/30" strokeWidth="8" />
          <circle cx="44" cy="44" r={r} fill="none"
            stroke={nivel === "ALTO" ? "#ef4444" : nivel === "MEDIO" ? "#f59e0b" : "#10b981"}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 0.6s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-bold leading-none", cfg.cls)}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className={cn("rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider",
        nivel === "ALTO"  && "bg-red-100 text-red-700 border border-red-300",
        nivel === "MEDIO" && "bg-amber-100 text-amber-700 border border-amber-300",
        nivel === "BAJO"  && "bg-emerald-100 text-emerald-700 border border-emerald-300",
        !nivel && "bg-muted text-muted-foreground",
      )}>
        Riesgo {cfg.label}
      </span>
    </div>
  );
}

function AlertChip({ active, label, detail, color }: {
  active: boolean; label: string; detail?: string | null; color: "red" | "amber";
}) {
  if (!active) return null;
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-xl border p-4",
      color === "red"   && "border-red-200 bg-red-50",
      color === "amber" && "border-amber-200 bg-amber-50",
    )}>
      <div className={cn(
        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        color === "red"   && "bg-red-100",
        color === "amber" && "bg-amber-100",
      )}>
        <AlertTriangle className={cn("h-4 w-4",
          color === "red"   && "text-red-600",
          color === "amber" && "text-amber-600",
        )} />
      </div>
      <div>
        <p className={cn("text-sm font-semibold",
          color === "red"   && "text-red-800",
          color === "amber" && "text-amber-800",
        )}>{label}</p>
        {detail && <p className={cn("mt-0.5 text-xs leading-relaxed",
          color === "red"   && "text-red-700/80",
          color === "amber" && "text-amber-700/80",
        )}>{detail}</p>}
      </div>
    </div>
  );
}

function DataRow({ icon: Icon, label, value, mono }: {
  icon: React.ElementType; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={cn("truncate text-sm font-medium", mono && "font-mono text-xs tracking-wide")}>{value}</p>
      </div>
    </div>
  );
}

function RiskIndicator({ active, label }: { active: boolean; label: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
      active ? "border-red-200 bg-red-50 text-red-700" : "border-border bg-muted/30 text-muted-foreground",
    )}>
      {active
        ? <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
        : <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground/50" />}
      <span className="text-xs font-medium">{label}</span>
      <span className={cn("ml-auto text-[10px] font-bold uppercase",
        active ? "text-red-600" : "text-muted-foreground",
      )}>
        {active ? "DETECTADO" : "Limpio"}
      </span>
    </div>
  );
}

export function ExpedienteDetalle({ applicationId, session, onVolver }: Props) {
  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [decision, setDecision] = useState<"APROBADO" | "RECHAZADO" | "SUBSANACION" | "">("");
  const [articulo, setArticulo] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [motivoSubsanacion, setMotivoSubsanacion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const data = await getApplication(applicationId) as unknown as AppDetail;
      setApp(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el expediente");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, [applicationId]);

  async function handleVerdict() {
    if (decision === "SUBSANACION") {
      if (motivoSubsanacion.trim().length < 20) {
        toast.error("El motivo debe tener al menos 20 caracteres");
        return;
      }
      setSubmitting(true);
      try {
        await requestSubsanacion(applicationId, motivoSubsanacion);
        toast.success("Subsanación solicitada — el solicitante será notificado");
        setSubmitted(true);
        const updated = await getApplication(applicationId) as unknown as AppDetail;
        setApp(updated);
        setTimeout(() => onVolver(), 2000);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al solicitar subsanación");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!decision || !articulo.trim() || !justificacion.trim()) {
      toast.error("Todos los campos del dictamen son requeridos");
      return;
    }
    setSubmitting(true);
    try {
      await submitVerdict(applicationId, {
        decision: decision as "APROBADO" | "RECHAZADO",
        articulo_citado: articulo,
        justificacion,
      });
      toast.success(`Dictamen ${decision} emitido correctamente`);
      setSubmitted(true);
      const updated = await getApplication(applicationId) as unknown as AppDetail;
      setApp(updated);
      setTimeout(() => onVolver(), 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al emitir dictamen");
    } finally {
      setSubmitting(false);
    }
  }

  const esAsignado =
    session.rol === "ADMIN" ||
    (app?.agente_asignado_id != null && app.agente_asignado_id === session.id);

  const puedeEmitir =
    app != null &&
    ["PENDIENTE", "EN_EVALUACION"].includes(app.estado) &&
    !submitted &&
    esAsignado;

  const esperandoCorrecion =
    app != null && app.estado === "SUBSANACION_PENDIENTE" && !submitted;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Cargando expediente…</p>
      </div>
    );
  }

  if (error || !app) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-700">{error ?? "Expediente no encontrado"}</AlertDescription>
      </Alert>
    );
  }

  const estadoCfg = ESTADO_CFG[app.estado] ?? { label: app.estado, cls: "bg-muted text-muted-foreground" };
  const hasAlerts = app.interpol_alerta_encontrada || app.ofac_alerta_encontrada || app.pais_restringido_encontrada;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onVolver}
              className="gap-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Volver a la cola
            </Button>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", estadoCfg.cls)}>
              {estadoCfg.label}
            </span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 font-mono text-xs tracking-widest text-slate-400">
                EXPEDIENTE #{app.ticket_number}
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                {app.nombres} {app.apellidos}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> {app.nacionalidad_codigo}
                </span>
                <span className="text-slate-600">·</span>
                <span>{app.categoria_migratoria}</span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(app.fecha_nacimiento).toLocaleDateString("es-PA")}
                </span>
              </div>
            </div>

            {/* Score gauge en el header */}
            <div className="flex items-center gap-4 rounded-xl bg-white/5 px-5 py-3">
              <ScoreGauge score={app.score_riesgo ?? 0} nivel={app.nivel_riesgo} />
              <div className="space-y-1 text-xs text-slate-400">
                <p className={cn("flex items-center gap-1.5", app.interpol_alerta_encontrada ? "text-red-400" : "")}>
                  {app.interpol_alerta_encontrada ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3 opacity-40" />}
                  INTERPOL
                </p>
                <p className={cn("flex items-center gap-1.5", app.ofac_alerta_encontrada ? "text-red-400" : "")}>
                  {app.ofac_alerta_encontrada ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3 opacity-40" />}
                  OFAC SDN
                </p>
                <p className={cn("flex items-center gap-1.5", app.pais_restringido_encontrada ? "text-amber-400" : "")}>
                  {app.pais_restringido_encontrada ? <Flag className="h-3 w-3" /> : <Flag className="h-3 w-3 opacity-40" />}
                  País restringido
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de ponderación */}
        <div className="border-t border-white/10 bg-white/5 px-6 py-3">
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="shrink-0">Ponderación</span>
            <div className="flex flex-1 items-center gap-1">
              {app.interpol_alerta_encontrada && (
                <div className="flex h-5 flex-1 items-center justify-center rounded bg-red-500/80 text-[10px] font-bold text-white">
                  INTERPOL +50
                </div>
              )}
              {app.ofac_alerta_encontrada && (
                <div className="flex h-5 flex-1 items-center justify-center rounded bg-orange-500/80 text-[10px] font-bold text-white">
                  OFAC +40
                </div>
              )}
              {app.pais_restringido_encontrada && (
                <div className="flex h-5 flex-1 items-center justify-center rounded bg-amber-500/80 text-[10px] font-bold text-white">
                  País +10
                </div>
              )}
              {!hasAlerts && (
                <div className="flex h-5 flex-1 items-center justify-center rounded bg-emerald-500/30 text-[10px] font-bold text-emerald-300">
                  Sin alertas
                </div>
              )}
            </div>
            <span className="shrink-0 font-mono font-bold text-white">
              = {app.score_riesgo ?? 0} pts
            </span>
          </div>
        </div>
      </div>

      {/* ── Alertas activas ───────────────────────────────────── */}
      {hasAlerts && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AlertChip
            active={app.interpol_alerta_encontrada}
            label="INTERPOL — Red Notice"
            detail={app.interpol_alerta_detalle}
            color="red"
          />
          <AlertChip
            active={app.ofac_alerta_encontrada}
            label="OFAC SDN — Lista de sanciones"
            detail={app.ofac_alerta_detalle}
            color="red"
          />
          <AlertChip
            active={app.pais_restringido_encontrada}
            label="Restricción de país"
            detail={`Nacionalidad ${app.nacionalidad_codigo} — atención especial migratoria SNM Panamá (Art. 6 Num. 4 DL3/2008).`}
            color="amber"
          />
        </div>
      )}

      {/* ── Contenido principal ───────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Datos del solicitante */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              Datos del solicitante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-1">
            <DataRow icon={User}       label="Nombre completo"     value={`${app.nombres} ${app.apellidos}`} />
            <DataRow icon={Calendar}   label="Fecha de nacimiento" value={new Date(app.fecha_nacimiento).toLocaleDateString("es-PA")} />
            <DataRow icon={Globe}      label="Nacionalidad"        value={app.nacionalidad_codigo} />
            <DataRow icon={CreditCard} label="N.º de pasaporte"    value={app.numero_pasaporte} mono />
            <DataRow icon={Calendar}   label="Vencimiento pasaporte" value={new Date(app.vencimiento_pasaporte).toLocaleDateString("es-PA")} />
            <DataRow icon={ClipboardCheck} label="Categoría migratoria" value={app.categoria_migratoria} />
            <DataRow icon={Wallet}     label="Monto de subsistencia"
              value={`USD ${Number(app.monto_subsistencia).toLocaleString("es-PA", { minimumFractionDigits: 2 })}`}
            />
          </CardContent>
        </Card>

        {/* Panel derecho: riesgo + documentos */}
        <div className="flex flex-col gap-4 lg:col-span-2">

          {/* Indicadores de riesgo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                Análisis de riesgo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-1">
              <RiskIndicator active={app.interpol_alerta_encontrada} label="INTERPOL Red Notice" />
              <RiskIndicator active={app.ofac_alerta_encontrada}     label="OFAC SDN" />
              <RiskIndicator active={app.pais_restringido_encontrada} label={`País restringido (${app.nacionalidad_codigo})`} />
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Documentos adjuntos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-1">
              {app.url_solvencia ? (
                <a href={app.url_solvencia} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-dashed p-3 text-sm transition-colors hover:border-institutional/50 hover:bg-muted/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Comprobante de solvencia</p>
                    <p className="text-[11px] text-muted-foreground">PDF · Ver documento</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-dashed p-3 opacity-50">
                  <ShieldX className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Solvencia no disponible</p>
                </div>
              )}
              {app.url_antecedentes ? (
                <a href={app.url_antecedentes} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-dashed p-3 text-sm transition-colors hover:border-institutional/50 hover:bg-muted/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Antecedentes penales</p>
                    <p className="text-[11px] text-muted-foreground">PDF · Ver documento</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-dashed p-3 opacity-50">
                  <ShieldX className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Antecedentes no disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Esperando corrección del solicitante ──────────────── */}
      {esperandoCorrecion && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <RotateCcw className="h-5 w-5 shrink-0 animate-spin text-amber-600" style={{ animationDuration: "3s" }} />
          <div>
            <p className="text-sm font-semibold text-amber-800">Subsanación pendiente</p>
            <p className="text-xs text-amber-700/80">
              Se solicitó corrección de documentos. El expediente volverá a evaluación una vez que el solicitante suba el documento corregido.
            </p>
          </div>
        </div>
      )}

      {/* ── No asignado ───────────────────────────────────────── */}
      {!esAsignado && !submitted && app && ["PENDIENTE", "EN_EVALUACION"].includes(app.estado) && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            Este expediente está asignado a otro agente. Solo el agente asignado puede emitir el dictamen.
          </p>
        </div>
      )}

      {/* ── Dictamen ──────────────────────────────────────────── */}
      {puedeEmitir && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="rounded-t-xl border-b bg-slate-50 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-5 w-5 text-institutional" />
              Emitir dictamen
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                Art. 6 Num. 4 · Art. 50 DL3/2008
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">

            {/* Decisión — botones visuales */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Decisión <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision("APROBADO")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-4 text-sm font-semibold transition-all",
                    decision === "APROBADO"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-border bg-background text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50/50",
                  )}
                >
                  <Check className={cn("h-5 w-5", decision === "APROBADO" ? "text-emerald-600" : "text-muted-foreground")} />
                  Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => setDecision("RECHAZADO")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-4 text-sm font-semibold transition-all",
                    decision === "RECHAZADO"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-border bg-background text-muted-foreground hover:border-red-300 hover:bg-red-50/50",
                  )}
                >
                  <X className={cn("h-5 w-5", decision === "RECHAZADO" ? "text-red-600" : "text-muted-foreground")} />
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={() => setDecision("SUBSANACION")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-4 text-sm font-semibold transition-all",
                    decision === "SUBSANACION"
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-border bg-background text-muted-foreground hover:border-amber-300 hover:bg-amber-50/50",
                  )}
                >
                  <RotateCcw className={cn("h-5 w-5", decision === "SUBSANACION" ? "text-amber-600" : "text-muted-foreground")} />
                  Subsanar
                </button>
              </div>
            </div>

            {/* Campos subsanación */}
            {decision === "SUBSANACION" && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      Motivo de subsanación <span className="text-red-500">*</span>
                    </Label>
                    <span className={cn(
                      "text-xs tabular-nums",
                      motivoSubsanacion.trim().length === 0 && "text-muted-foreground",
                      motivoSubsanacion.trim().length > 0 && motivoSubsanacion.trim().length < 20 && "text-red-500 font-medium",
                      motivoSubsanacion.trim().length >= 20 && "text-emerald-600 font-medium",
                    )}>
                      {motivoSubsanacion.trim().length} / 20 mín.
                    </span>
                  </div>
                  <Textarea
                    rows={3}
                    placeholder="Indique qué documento o información debe corregir el solicitante…"
                    value={motivoSubsanacion}
                    onChange={(e) => setMotivoSubsanacion(e.target.value)}
                    className={cn(
                      "resize-none",
                      motivoSubsanacion.trim().length > 0 && motivoSubsanacion.trim().length < 20 && "border-red-400 focus-visible:ring-red-400",
                      motivoSubsanacion.trim().length >= 20 && "border-amber-400",
                    )}
                  />
                </div>
              </>
            )}

            {/* Campos dictamen (no subsanación) */}
            {decision !== "SUBSANACION" && (
              <>
                <Separator />

                {/* Artículo */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Artículo legal citado <span className="text-red-500">*</span>
                  </Label>
                  <Select value={articulo} onValueChange={setArticulo}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccione el artículo aplicable…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Art. 28 DL3/2008">Art. 28 — Aprobación de ingreso</SelectItem>
                      <SelectItem value="Art. 43 Num. 2 DL3/2008">Art. 43 Num. 2 — Pasaporte inválido o vencido</SelectItem>
                      <SelectItem value="Art. 50 Num. 1 DL3/2008">Art. 50 Num. 1 — Insolvencia económica</SelectItem>
                      <SelectItem value="Art. 50 Num. 4 DL3/2008">Art. 50 Num. 4 — Antecedentes penales internacionales</SelectItem>
                      <SelectItem value="Art. 50 Num. 5 DL3/2008">Art. 50 Num. 5 — Riesgo a la seguridad nacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Justificación */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      Justificación <span className="text-red-500">*</span>
                    </Label>
                    <span className={cn(
                      "text-xs tabular-nums",
                      justificacion.trim().length === 0 && "text-muted-foreground",
                      justificacion.trim().length > 0 && justificacion.trim().length < 20 && "text-red-500 font-medium",
                      justificacion.trim().length >= 20 && "text-emerald-600 font-medium",
                    )}>
                      {justificacion.trim().length} / 20 mín.
                    </span>
                  </div>
                  <Textarea
                    rows={4}
                    placeholder="Detalle la fundamentación jurídica de la decisión (mínimo 20 caracteres)…"
                    value={justificacion}
                    onChange={(e) => setJustificacion(e.target.value)}
                    className={cn(
                      "resize-none",
                      justificacion.trim().length > 0 && justificacion.trim().length < 20 && "border-red-400 focus-visible:ring-red-400",
                      justificacion.trim().length >= 20 && "border-emerald-400",
                    )}
                  />
                </div>
              </>
            )}

            {/* Confirmar */}
            <Button
              disabled={
                submitting ||
                !decision ||
                (decision === "SUBSANACION" && motivoSubsanacion.trim().length < 20) ||
                (decision !== "SUBSANACION" && (!articulo || justificacion.trim().length < 20))
              }
              onClick={handleVerdict}
              className={cn(
                "h-11 w-full text-sm font-semibold",
                decision === "APROBADO" && "bg-emerald-600 hover:bg-emerald-700 text-white",
                decision === "RECHAZADO" && "bg-red-600 hover:bg-red-700 text-white",
                decision === "SUBSANACION" && "bg-amber-600 hover:bg-amber-700 text-white",
                !decision && "bg-primary",
              )}
            >
              {submitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando…</>
                : decision === "APROBADO"
                  ? <><Check className="mr-2 h-4 w-4" /> Confirmar aprobación</>
                  : decision === "RECHAZADO"
                    ? <><X className="mr-2 h-4 w-4" /> Confirmar rechazo</>
                    : decision === "SUBSANACION"
                      ? <><RotateCcw className="mr-2 h-4 w-4" /> Solicitar subsanación</>
                      : "Confirmar dictamen"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Dictamen emitido ──────────────────────────────────── */}
      {submitted && (
        <div className={cn(
          "flex items-center gap-4 rounded-2xl border p-5",
          app.estado === "APROBADO" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50",
        )}>
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            app.estado === "APROBADO" ? "bg-emerald-100" : "bg-red-100",
          )}>
            {app.estado === "APROBADO"
              ? <Check className="h-6 w-6 text-emerald-600" />
              : <X className="h-6 w-6 text-red-600" />}
          </div>
          <div>
            <p className={cn("font-semibold", app.estado === "APROBADO" ? "text-emerald-800" : "text-red-800")}>
              Dictamen emitido — {estadoCfg.label}
            </p>
            <p className={cn("text-sm", app.estado === "APROBADO" ? "text-emerald-700/80" : "text-red-700/80")}>
              Registrado en el log de auditoría WORM. Redirigiendo…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
