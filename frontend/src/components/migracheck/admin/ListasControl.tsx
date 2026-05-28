import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadCloud, FileSpreadsheet, RefreshCw } from "lucide-react";

const LISTS = [
  { name: "Interpol Red Notices", rows: 12480, sync: "2026-05-09 06:00", status: "Sincronizado" },
  { name: "OFAC SDN List", rows: 9024, sync: "2026-05-09 06:01", status: "Sincronizado" },
  { name: "Lista Nacional de Impedidos", rows: 4117, sync: "2026-05-08 22:30", status: "Sincronizado" },
  { name: "Alerta Migratoria Regional", rows: 612, sync: "2026-05-07 18:14", status: "Desfasado" },
];

export function ListasControl() {
  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Cargar nueva lista de control</CardTitle>
          <p className="text-sm text-muted-foreground">
            Suba archivos CSV oficiales para sincronizar las bases de datos de seguridad nacional.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-14 text-center transition-colors hover:border-institutional hover:bg-institutional/5">
            <div className="rounded-full bg-institutional/10 p-3">
              <UploadCloud className="h-7 w-7 text-institutional" />
            </div>
            <p className="text-sm font-medium">Arrastre el archivo CSV aquí</p>
            <p className="text-xs text-muted-foreground">Codificación UTF-8 · Separador "," · Máx. 25 MB</p>
            <Button className="mt-2 bg-institutional text-gold hover:bg-institutional-hover">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Seleccionar archivo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Listas activas</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="pl-6">Lista</TableHead>
                <TableHead>Registros</TableHead>
                <TableHead>Última sincronización</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="pr-6 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LISTS.map((l) => (
                <TableRow key={l.name}>
                  <TableCell className="pl-6 font-medium">{l.name}</TableCell>
                  <TableCell className="font-mono text-sm">{l.rows.toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{l.sync}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        l.status === "Sincronizado"
                          ? "border-success bg-success/10 text-success"
                          : "border-warning bg-warning/10 text-warning-foreground"
                      }
                    >
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button size="sm" variant="ghost"><RefreshCw className="mr-1 h-3.5 w-3.5" /> Sincronizar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
