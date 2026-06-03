import { useState, useEffect } from "react";
import { getApplication, submitVerdict } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2, AlertTriangle, FileText, ArrowLeft, Check, X,
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
  url_solvencia: string | null;
  url_antecedentes: string | null;
}

interface Props {
  applicationId: string;
  onVolver: () => void;
}

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE: "bg-warning/15 text-warning-foreground",
  EN_EVALUACION: "bg-blue-500/15 text-blue-700",
  APROBADO: "bg-success/15 text-success",
  RECHAZADO: "bg-danger/15 text-danger",
};

export function ExpedienteDetalle({ applicationId, onVolver }: Props) {
  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [decision, setDecision] = useState<"APROBADO" | "RECHAZADO" | "">("");
  const [articulo, setArticulo] = useState("");
  const [justificacion, setJustificacion] = useState("");
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al emitir dictamen");
    } finally {
      setSubmitting(false);
    }
  }

  const puedeEmitir = app && ["PENDIENTE", "EN_EVALUACION"].includes(app.estado) && !submitted;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <Alert className="border-danger/40 bg-danger/10">
        <AlertTriangle className="h-4 w-4 text-danger" />
        <AlertDescription className="text-danger">{error ?? "Expediente no encontrado"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onVolver}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Volver a la cola
        </Button>
        <h2 className="font-serif text-lg font-bold">Expediente #{app.ticket_number}</h2>
        <span className={cn(
          "inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase",
          ESTADO_COLOR[app.estado] ?? "bg-muted text-muted-foreground",
        )}>
          {app.estado.replace(/_/g, " ")}
        </span>
      </div>

      {app.interpol_alerta_encontrada && (
        <Alert className="border-danger/60 bg-danger/10">
          <AlertTriangle className="h-4 w-4 text-danger" />
          <AlertTitle className="text-danger">Alerta: {app.interpol_alerta_tipo}</AlertTitle>
          <AlertDescription className="text-danger/80">{app.interpol_alerta_detalle}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Datos del solicitante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Nombre completo" value={`${app.nombres} ${app.apellidos}`} />
            <Row label="Fecha de nacimiento" value={app.fecha_nacimiento} />
            <Row label="Nacionalidad" value={app.nacionalidad_codigo} />
            <Row label="N.º de pasaporte" value={app.numero_pasaporte} mono />
            <Row label="Vencimiento pasaporte" value={app.vencimiento_pasaporte} />
            <Row label="Categoría migratoria" value={app.categoria_migratoria} />
            <Row
              label="Monto subsistencia"
              value={`USD ${Number(app.monto_subsistencia).toLocaleString("es-PA", { minimumFractionDigits: 2 })}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Análisis de riesgo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Nivel de riesgo" value={app.nivel_riesgo ?? "—"} />
            <Row label="Score" value={String(app.score_riesgo ?? "—")} />
            <Row label="Alerta INTERPOL/OFAC" value={app.interpol_alerta_encontrada ? "SÍ" : "No"} />
            {app.interpol_alerta_tipo && (
              <Row label="Tipo de alerta" value={app.interpol_alerta_tipo} />
            )}

            <div className="mt-4 space-y-2 border-t pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Documentos adjuntos
              </p>
              {app.url_solvencia ? (
                <a
                  href={app.url_solvencia}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-institutional hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" /> Comprobante de solvencia
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">Solvencia no disponible</p>
              )}
              {app.url_antecedentes ? (
                <a
                  href={app.url_antecedentes}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-institutional hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" /> Antecedentes penales
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">Antecedentes no disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {puedeEmitir && (
        <Card className="border-institutional/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-institutional">
              Emitir dictamen — Art. 6 Num. 4, Art. 50 DL3/2008
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Decisión <span className="text-danger">*</span></Label>
              <Select value={decision} onValueChange={(v) => setDecision(v as "APROBADO" | "RECHAZADO")}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione decisión..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APROBADO">APROBADO</SelectItem>
                  <SelectItem value="RECHAZADO">RECHAZADO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Artículo legal citado <span className="text-danger">*</span></Label>
              <Input
                placeholder="Ej. Art. 50 Num. 4 DL3/2008"
                value={articulo}
                onChange={(e) => setArticulo(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Justificación <span className="text-danger">*</span></Label>
              <Textarea
                rows={4}
                placeholder="Detalle la fundamentación jurídica de la decisión..."
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                disabled={submitting || !decision}
                className={cn(
                  decision === "APROBADO" && "bg-success text-white hover:bg-success/90",
                  decision === "RECHAZADO" && "bg-danger text-white hover:bg-danger/90",
                  !decision && "opacity-50",
                )}
                onClick={handleVerdict}
              >
                {submitting
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : decision === "RECHAZADO"
                    ? <X className="mr-2 h-4 w-4" />
                    : <Check className="mr-2 h-4 w-4" />}
                Confirmar dictamen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {submitted && (
        <Alert className="border-success/40 bg-success/10">
          <Check className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Dictamen emitido</AlertTitle>
          <AlertDescription>
            El expediente ha sido marcado como {app.estado.replace(/_/g, " ")} y queda registrado en el log de auditoría WORM.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-right", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
