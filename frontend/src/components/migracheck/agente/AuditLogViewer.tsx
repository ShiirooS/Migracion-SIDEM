import { useState, useEffect } from "react";
import { getAuditLog } from "@/lib/api";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, RefreshCw, Shield } from "lucide-react";

interface AuditEntry {
  id: string;
  accion: string;
  usuario_id: string | null;
  expediente_id: string | null;
  detalles: Record<string, unknown> | null;
  ip_origen: string | null;
  created_at: string;
}

export function AuditLogViewer() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [expedienteId, setExpedienteId] = useState("");

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditLog({
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        expediente_id: expedienteId || undefined,
      }) as AuditEntry[];
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el log de auditoría");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-institutional" />
        <h2 className="font-serif text-lg font-bold">Log de auditoría WORM</h2>
        <span className="ml-2 rounded bg-institutional/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-institutional">
          Inmutable · Art. 6 DL3/2008
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/30 p-4">
        <div className="space-y-1">
          <Label className="text-xs">Desde</Label>
          <Input
            type="datetime-local"
            className="h-8 w-48 text-xs"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hasta</Label>
          <Input
            type="datetime-local"
            className="h-8 w-48 text-xs"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">ID de expediente</Label>
          <Input
            className="h-8 w-56 font-mono text-xs"
            placeholder="UUID del expediente..."
            value={expedienteId}
            onChange={(e) => setExpedienteId(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={cargar} disabled={loading}>
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Filtrar
        </Button>
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
      ) : entries.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No hay registros para los filtros seleccionados.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {entries.length} registro(s) · máx. 500 por consulta
          </p>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha / Hora</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Usuario ID</TableHead>
                  <TableHead>Expediente ID</TableHead>
                  <TableHead>IP Origen</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {new Date(e.created_at).toLocaleString("es-PA")}
                    </TableCell>
                    <TableCell>
                      <span className="rounded bg-institutional/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-institutional">
                        {e.accion}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      {e.usuario_id ? `${e.usuario_id.slice(0, 8)}…` : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      {e.expediente_id ? `${e.expediente_id.slice(0, 8)}…` : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{e.ip_origen ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-[10px] text-muted-foreground">
                      {e.detalles ? JSON.stringify(e.detalles) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
