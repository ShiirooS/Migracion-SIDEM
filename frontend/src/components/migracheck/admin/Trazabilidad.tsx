import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock } from "lucide-react";

const LOG = [
  { id: "0xA9F31B2", agente: "SNM-A-0421", accion: "APROBAR_EXPEDIENTE #PAN-2026-8830", ts: "2026-05-09T11:42:18.221Z" },
  { id: "0xA9F31B1", agente: "SNM-A-0418", accion: "RECHAZAR_EXPEDIENTE #PAN-2026-8821 (Art. 50)", ts: "2026-05-08T16:20:04.881Z" },
  { id: "0xA9F31B0", agente: "SNM-A-0392", accion: "SUBSANACION_REQ #PAN-2026-8815", ts: "2026-05-08T09:11:59.012Z" },
  { id: "0xA9F31AF", agente: "SNM-ADMIN-01", accion: "SYNC_LIST Interpol_Red_Notices", ts: "2026-05-09T06:00:00.000Z" },
  { id: "0xA9F31AE", agente: "SNM-A-0421", accion: "LOGIN_2FA_OK", ts: "2026-05-09T05:58:12.331Z" },
  { id: "0xA9F31AD", agente: "SNM-ADMIN-01", accion: "CREATE_AGENT SNM-A-0428", ts: "2026-05-08T22:11:07.553Z" },
];

export function Trazabilidad() {
  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-serif text-lg">Log de Auditoría</CardTitle>
          <p className="text-sm text-muted-foreground">Registro inmutable de todas las acciones del sistema.</p>
        </div>
        <Badge className="bg-institutional text-gold">
          <Lock className="mr-1 h-3 w-3" /> Inmutable
        </Badge>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-900 hover:bg-zinc-900">
                <TableHead className="pl-6 font-mono text-xs text-zinc-300">ID Log</TableHead>
                <TableHead className="font-mono text-xs text-zinc-300">Agente</TableHead>
                <TableHead className="font-mono text-xs text-zinc-300">Acción realizada</TableHead>
                <TableHead className="pr-6 font-mono text-xs text-zinc-300">Timestamp (UTC)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LOG.map((l) => (
                <TableRow key={l.id} className="font-mono text-xs">
                  <TableCell className="pl-6 text-institutional">{l.id}</TableCell>
                  <TableCell>{l.agente}</TableCell>
                  <TableCell className="text-foreground/80">{l.accion}</TableCell>
                  <TableCell className="pr-6 text-muted-foreground">{l.ts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
