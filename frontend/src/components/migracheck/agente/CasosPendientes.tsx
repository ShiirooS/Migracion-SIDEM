import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileWarning, ChevronRight } from "lucide-react";

const CASES = [
  { id: "PAN-2026-8901", motivo: "Documento de antecedentes ilegible (página 2 borrosa).", desde: "2 días", solicitante: "Ana L. Pérez" },
  { id: "PAN-2026-8888", motivo: "Falta apostilla del país emisor.", desde: "4 días", solicitante: "Jorge Quintero" },
  { id: "PAN-2026-8854", motivo: "Comprobante de solvencia vencido.", desde: "6 días", solicitante: "Ekaterina Volkova" },
  { id: "PAN-2026-8810", motivo: "Pasaporte con vigencia menor a 6 meses.", desde: "9 días", solicitante: "Hassan Idrissi" },
];

export function CasosPendientes() {
  return (
    <div className="space-y-3">
      {CASES.map((c) => (
        <Card key={c.id} className="shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-md bg-warning/15 p-3">
              <FileWarning className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-institutional">#{c.id}</span>
                <Badge variant="outline" className="border-warning bg-warning/10 text-warning-foreground">
                  Subsanación
                </Badge>
                <span className="text-xs text-muted-foreground">Hace {c.desde}</span>
              </div>
              <p className="mt-1 text-sm text-foreground">{c.motivo}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Solicitante: {c.solicitante}</p>
            </div>
            <Button variant="outline" size="sm">
              Revisar <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
