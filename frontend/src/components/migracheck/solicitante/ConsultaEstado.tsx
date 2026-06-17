import { useState } from "react";
import { getApplicationStatus, ApiError } from "@/lib/api";
import escudo from "@/assets/escudo-panama.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Search, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusResult {
  ticket_number: string;
  estado: string;
  nivel_riesgo: string | null;
  categoria_migratoria: string;
  created_at: string;
  articulo_citado: string | null;
}

interface Props {
  onVolver: () => void;
}

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE: "text-warning-foreground",
  EN_EVALUACION: "text-blue-600",
  APROBADO: "text-success",
  RECHAZADO: "text-danger",
};

const ESTADO_DESC: Record<string, string> = {
  PENDIENTE: "Su solicitud está en espera de ser asignada a un agente.",
  EN_EVALUACION: "Un agente está revisando su expediente.",
  APROBADO: "Su solicitud ha sido aprobada. Comuníquese con la SNM para continuar el proceso.",
  RECHAZADO: "Su solicitud ha sido rechazada. Consulte la notificación oficial para conocer el fundamento.",
  SUBSANACION_PENDIENTE: "Se requiere información adicional. Comuníquese con la SNM.",
};

export function ConsultaEstado({ onVolver }: Props) {
  const [ticket, setTicket] = useState("");
  const [pasaporte, setPasaporte] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket.trim() || !pasaporte.trim()) {
      setError("Ingrese el número de ticket y el número de pasaporte");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getApplicationStatus(
        pasaporte.trim().toUpperCase(),
        ticket.trim().toUpperCase(),
      ) as StatusResult;
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("No se encontró ninguna solicitud con esos datos. Verifique el ticket y el pasaporte.");
      } else {
        setError(err instanceof Error ? err.message : "Error al consultar el estado");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={escudo} alt="SNM" className="h-7 w-7 object-contain" />
            <div className="leading-tight">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                República de Panamá · SNM
              </p>
              <p className="font-serif text-sm font-bold text-foreground">SIDEM-PAN</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onVolver}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
        <div>
          <h1 className="font-serif text-2xl font-bold">Consulta de estado</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingrese su número de ticket y pasaporte para consultar el estado de su trámite.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={buscar} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Número de ticket <span className="text-danger">*</span></Label>
                <Input
                  placeholder="PAN-2026-00001"
                  className="font-mono uppercase"
                  value={ticket}
                  onChange={(e) => setTicket(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Número de pasaporte <span className="text-danger">*</span></Label>
                <Input
                  placeholder="AB123456"
                  className="font-mono uppercase"
                  value={pasaporte}
                  onChange={(e) => setPasaporte(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert className="border-danger/40 bg-danger/10">
                  <AlertTriangle className="h-4 w-4 text-danger" />
                  <AlertDescription className="text-danger">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-institutional text-gold hover:bg-institutional-hover"
                disabled={loading}
              >
                {loading
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Search className="mr-2 h-4 w-4" />}
                Consultar estado
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardContent className="space-y-4 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resultado de la consulta
              </p>
              <div className="space-y-3 text-sm">
                <Row label="Ticket" value={result.ticket_number} mono />
                <Row label="Categoría" value={result.categoria_migratoria} />
                <Row label="Fecha de registro" value={new Date(result.created_at).toLocaleDateString("es-PA")} />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <span className={cn("font-bold uppercase", ESTADO_COLOR[result.estado] ?? "text-foreground")}>
                    {result.estado.replace(/_/g, " ")}
                  </span>
                </div>
                {result.articulo_citado && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Fundamento legal</span>
                    <span className="font-medium text-right text-xs max-w-[55%]">{result.articulo_citado}</span>
                  </div>
                )}
              </div>
              {ESTADO_DESC[result.estado] && (
                <p className="rounded-md border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                  {ESTADO_DESC[result.estado]}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
