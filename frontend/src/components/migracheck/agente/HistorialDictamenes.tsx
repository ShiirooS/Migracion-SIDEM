import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const ROWS = [
  { fecha: "2026-05-09 11:42", exp: "PAN-2026-8830", dictamen: "Aprobado", art: "Art. 28", tone: "success" },
  { fecha: "2026-05-08 16:20", exp: "PAN-2026-8821", dictamen: "Rechazado", art: "Art. 50", tone: "danger" },
  { fecha: "2026-05-08 09:11", exp: "PAN-2026-8815", dictamen: "Subsanación", art: "Art. 28", tone: "warning" },
  { fecha: "2026-05-07 14:55", exp: "PAN-2026-8807", dictamen: "Aprobado", art: "Art. 38", tone: "success" },
  { fecha: "2026-05-06 10:03", exp: "PAN-2026-8790", dictamen: "Aprobado", art: "Art. 28", tone: "success" },
] as const;

const tones: Record<string, string> = {
  success: "border-success bg-success/10 text-success",
  danger: "border-danger bg-danger/10 text-danger",
  warning: "border-warning bg-warning/10 text-warning-foreground",
};

export function HistorialDictamenes() {
  return (
    <Card className="overflow-hidden shadow-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead>Fecha y hora</TableHead>
            <TableHead>Expediente</TableHead>
            <TableHead>Dictamen</TableHead>
            <TableHead>Sustento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((r) => (
            <TableRow key={r.exp}>
              <TableCell className="font-mono text-xs text-muted-foreground">{r.fecha}</TableCell>
              <TableCell className="font-mono font-medium text-institutional">#{r.exp}</TableCell>
              <TableCell>
                <Badge variant="outline" className={tones[r.tone]}>{r.dictamen}</Badge>
              </TableCell>
              <TableCell className="text-sm">{r.art}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
