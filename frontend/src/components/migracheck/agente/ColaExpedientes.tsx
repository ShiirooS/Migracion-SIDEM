import { useState, useEffect } from "react";
import { getApplications, type Application } from "@/lib/api";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  modoHistorial?: boolean;
  onSeleccionar: (id: string) => void;
}

const ESTADOS = ["PENDIENTE", "EN_EVALUACION", "APROBADO", "RECHAZADO", "SUBSANACION_PENDIENTE"];

function RiskBadge({ nivel }: { nivel: string | null }) {
  const cfg = {
    ALTO: "border-danger/40 bg-danger/10 text-danger",
    MEDIO: "border-warning/40 bg-warning/10 text-warning-foreground",
    BAJO: "border-success/40 bg-success/10 text-success",
  }[nivel ?? ""] ?? "border-border bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", cfg)}>
      {nivel ?? "—"}
    </span>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = {
    PENDIENTE: "bg-warning/15 text-warning-foreground",
    EN_EVALUACION: "bg-blue-500/15 text-blue-700",
    APROBADO: "bg-success/15 text-success",
    RECHAZADO: "bg-danger/15 text-danger",
    SUBSANACION_PENDIENTE: "bg-muted text-muted-foreground",
  }[estado] ?? "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase", cfg)}>
      {estado.replace(/_/g, " ")}
    </span>
  );
}

export function ColaExpedientes({ modoHistorial = false, onSeleccionar }: Props) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState<string>(modoHistorial ? "APROBADO" : "TODOS");

  async function cargar(estado?: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await getApplications(estado ? { estado } : undefined);
      setApps(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar expedientes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar(estadoFiltro === "TODOS" ? undefined : estadoFiltro);
  }, [estadoFiltro]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold">
          {modoHistorial ? "Historial de dictámenes" : "Cola de expedientes"}
        </h2>
        <div className="flex items-center gap-3">
          <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              {ESTADOS.map((e) => (
                <SelectItem key={e} value={e}>{e.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => cargar(estadoFiltro === "TODOS" ? undefined : estadoFiltro)}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-danger/40 bg-danger/10">
          <AlertTriangle className="h-4 w-4 text-danger" />
          <AlertDescription className="text-danger">{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : apps.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No hay expedientes para mostrar.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Riesgo</TableHead>
                <TableHead>INTERPOL / OFAC</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((app) => (
                <TableRow
                  key={app.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSeleccionar(app.id)}
                >
                  <TableCell className="font-mono text-xs">{app.ticket_number}</TableCell>
                  <TableCell className="font-medium">
                    {app.nombres} {app.apellidos}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {app.categoria_migratoria}
                  </TableCell>
                  <TableCell>
                    <RiskBadge nivel={app.nivel_riesgo} />
                  </TableCell>
                  <TableCell>
                    {app.interpol_alerta_encontrada ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-danger">
                        <AlertTriangle className="h-3 w-3" />
                        {app.interpol_alerta_tipo}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={app.estado} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(app.created_at).toLocaleDateString("es-PA")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onSeleccionar(app.id); }}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
