import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const ROWS = [
  { id: "RF05", fecha: "2026-04-12", tipo: "Residencia temporal", estado: "Pendiente", tone: "warning" },
  { id: "RF04", fecha: "2026-03-29", tipo: "Renovación", estado: "Aprobado", tone: "success" },
  { id: "RF03", fecha: "2026-02-18", tipo: "Subsanación", estado: "En revisión", tone: "info" },
  { id: "RF02", fecha: "2026-01-07", tipo: "Turismo prolongado", estado: "Rechazado", tone: "danger" },
  { id: "RF01", fecha: "2025-11-22", tipo: "Residencia temporal", estado: "Aprobado", tone: "success" },
] as const;

const toneCls: Record<string, string> = {
  warning: "border-warning bg-warning/10 text-warning-foreground",
  success: "border-success bg-success/10 text-success",
  danger: "border-danger bg-danger/10 text-danger",
  info: "border-institutional bg-institutional/10 text-institutional",
};

export function MisTramites() {
  return (
    <Card className="overflow-hidden shadow-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="font-semibold">Ticket</TableHead>
            <TableHead className="font-semibold">Fecha</TableHead>
            <TableHead className="font-semibold">Tipo de trámite</TableHead>
            <TableHead className="font-semibold">Estado</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono font-medium text-institutional">#{r.id}</TableCell>
              <TableCell className="text-muted-foreground">{r.fecha}</TableCell>
              <TableCell>{r.tipo}</TableCell>
              <TableCell>
                <Badge variant="outline" className={toneCls[r.tone]}>{r.estado}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost" className="text-institutional">
                  <Eye className="mr-1 h-3.5 w-3.5" /> Ver
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
