import { useState, useEffect } from "react";
import { getApplications, getAgentes, assignAgent, type Application, type Agente } from "@/lib/api";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, RefreshCw, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export function AsignacionExpedientes() {
  const [apps, setApps] = useState<Application[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selecciones, setSelecciones] = useState<Record<string, string>>({});

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const [appsData, agentesData] = await Promise.all([
        getApplications(),
        getAgentes(),
      ]);
      // Solo mostrar pendientes y en evaluación
      setApps(appsData.filter(a => ["PENDIENTE", "EN_EVALUACION"].includes(a.estado)));
      setAgentes(agentesData.filter(a => a.rol === "AGENTE"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function handleAssign(appId: string) {
    const agenteId = selecciones[appId];
    if (!agenteId) { toast.error("Seleccione un agente primero"); return; }
    setAssigning(appId);
    try {
      await assignAgent(appId, agenteId);
      const agente = agentes.find(a => a.id === agenteId);
      toast.success(`Expediente asignado a ${agente?.nombre_completo ?? "agente"}`);
      await cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al asignar");
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-institutional" />
          <h2 className="font-serif text-lg font-bold">Asignación de expedientes</h2>
          <span className="rounded bg-institutional/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-institutional">
            Art. 6 Num. 4 DL3/2008
          </span>
        </div>
        <Button variant="outline" size="icon" onClick={cargar} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
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
      ) : apps.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No hay expedientes pendientes de asignación.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Riesgo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Agente asignado</TableHead>
                <TableHead>Asignar a</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((app) => {
                const currentAgent = (app as Application & { agente_asignado_id?: string }).agente_asignado_id;
                const currentAgentName = agentes.find(a => a.id === currentAgent)?.nombre_completo;
                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-xs">{app.ticket_number}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {app.nombres} {app.apellidos}
                    </TableCell>
                    <TableCell><RiskBadge nivel={app.nivel_riesgo} /></TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase",
                        app.estado === "PENDIENTE" ? "bg-warning/15 text-warning-foreground" : "bg-blue-500/15 text-blue-700"
                      )}>
                        {app.estado.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {currentAgentName ?? <span className="italic">Sin asignar</span>}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selecciones[app.id] ?? ""}
                        onValueChange={(v) => setSelecciones(prev => ({ ...prev, [app.id]: v }))}
                      >
                        <SelectTrigger className="h-8 w-44 text-xs">
                          <SelectValue placeholder="Seleccionar agente..." />
                        </SelectTrigger>
                        <SelectContent>
                          {agentes.map(a => (
                            <SelectItem key={a.id} value={a.id} className="text-xs">
                              {a.nombre_completo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={!selecciones[app.id] || assigning === app.id}
                        className="bg-institutional text-gold hover:bg-institutional-hover h-8 text-xs"
                        onClick={() => handleAssign(app.id)}
                      >
                        {assigning === app.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : "Asignar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
