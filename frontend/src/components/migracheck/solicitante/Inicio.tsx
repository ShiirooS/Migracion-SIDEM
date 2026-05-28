import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Recepción", state: "done" as const },
  { label: "Verificación documental", state: "done" as const },
  { label: "Análisis de riesgo", state: "current" as const },
  { label: "Dictamen del agente", state: "pending" as const },
  { label: "Resolución final", state: "pending" as const },
];

export function Inicio() {
  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-gold shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-serif text-xl">Buenos días, María Fernández</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Última actualización: hoy a las 09:42 (hora de Panamá)
              </p>
            </div>
            <Badge variant="outline" className="border-warning bg-warning/10 text-warning-foreground">
              <Clock className="mr-1 h-3 w-3" /> En evaluación
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Ticket actual</p>
            <p className="font-mono text-lg font-semibold text-institutional">#PAN-2026-8942</p>
            <p className="mt-1 text-sm text-muted-foreground">Categoría: Residencia temporal · Art. 28 DL 3/2008</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Estado del trámite</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-6 border-l-2 border-border pl-6">
            {STEPS.map((s, i) => (
              <li key={s.label} className="relative">
                <span
                  className={cn(
                    "absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full border-2",
                    s.state === "done" && "border-success bg-success text-success-foreground",
                    s.state === "current" && "border-gold bg-gold text-gold-foreground",
                    s.state === "pending" && "border-border bg-background text-muted-foreground",
                  )}
                >
                  {s.state === "done" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : s.state === "current" ? (
                    <Clock className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </span>
                <p className={cn("text-sm font-medium", s.state === "pending" && "text-muted-foreground")}>
                  Paso {i + 1}. {s.label}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button className="bg-institutional text-gold hover:bg-institutional-hover">
            <FileText className="mr-2 h-4 w-4" /> Ver expediente completo
          </Button>
          <Button variant="outline">Descargar comprobante</Button>
        </CardContent>
      </Card>
    </div>
  );
}
