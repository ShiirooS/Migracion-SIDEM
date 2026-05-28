import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, FileX, RotateCcw, FileSearch, ChevronLeft, ChevronRight } from "lucide-react";

const RISK = [
  { label: "Riesgo Alto: Art. 50", tone: "danger", icon: AlertTriangle },
  { label: "Antecedente Interpol", tone: "danger", icon: AlertTriangle },
  { label: "Pasaporte Vigente", tone: "neutral", icon: CheckCircle2 },
  { label: "Solvencia OK", tone: "success", icon: CheckCircle2 },
];

const tones: Record<string, string> = {
  danger: "border-danger bg-danger/10 text-danger",
  success: "border-success bg-success/10 text-success",
  neutral: "border-border bg-muted text-muted-foreground",
};

const DATA = [
  ["Expediente", "#PAN-2026-8942"],
  ["Solicitante", "Carlos R. Méndez Vargas"],
  ["Nacionalidad", "Venezolana"],
  ["Pasaporte", "VE-7821934"],
  ["Categoría", "Residencia temporal"],
  ["Fecha de ingreso", "2026-05-02"],
  ["Solvencia", "USD 1,250.00"],
  ["Vencimiento Pasaporte", "2029-08-14"],
];

export function ColaAuditoria() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 rounded-md border bg-background px-4 py-2 shadow-sm">
          <FileSearch className="h-4 w-4 text-institutional" />
          <span className="text-sm font-medium">Expediente 1 de 23</span>
          <span className="text-xs text-muted-foreground">en cola</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><ChevronLeft className="mr-1 h-4 w-4" /> Anterior</Button>
          <Button variant="outline" size="sm">Siguiente <ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* LEFT: Expediente */}
        <Card className="shadow-md">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="font-mono text-lg text-institutional">#PAN-2026-8942</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Recibido: 2026-05-02 · 14:08</p>
              </div>
              <Badge className="bg-warning text-warning-foreground">En auditoría</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Semáforo de Riesgo</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {RISK.map((r) => (
                  <Badge key={r.label} variant="outline" className={tones[r.tone] + " gap-1"}>
                    <r.icon className="h-3 w-3" /> {r.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Datos del expediente</Label>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border bg-muted/30 p-4 text-sm">
                {DATA.map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[11px] text-muted-foreground">{k}</p>
                    <p className="font-medium text-foreground">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="just" className="text-xs uppercase tracking-wider text-muted-foreground">
                Justificación legal <span className="text-danger">*</span>
              </Label>
              <Textarea
                id="just"
                rows={4}
                placeholder="Indique el sustento legal del dictamen (Art. y motivación)…"
                className="resize-none font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Obligatorio. Será registrado en el log inmutable de trazabilidad.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: Visor PDF */}
        <Card className="overflow-hidden shadow-md">
          <CardHeader className="border-b bg-muted/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Visor de documentos</CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">antecedentes_VE7821934.pdf</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative flex h-[520px] items-center justify-center bg-zinc-900 text-zinc-400">
              <div className="absolute inset-4 rounded border border-zinc-700/60 bg-zinc-800/40" />
              <div className="relative text-center">
                <FileSearch className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p className="font-mono text-xs uppercase tracking-widest">Visor PDF embebido</p>
                <p className="mt-1 text-[11px] text-zinc-500">Documento cargado · 2 páginas · 1.4 MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action bar */}
      <Card className="shadow-md">
        <CardContent className="flex flex-wrap items-center justify-end gap-3 py-4">
          <Button className="bg-warning text-warning-foreground hover:bg-warning/90">
            <RotateCcw className="mr-2 h-4 w-4" /> Pedir Subsanación
          </Button>
          <Button className="bg-danger text-danger-foreground hover:bg-danger/90">
            <FileX className="mr-2 h-4 w-4" /> Rechazar Expediente
          </Button>
          <Button className="bg-success text-success-foreground hover:bg-success/90">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Aprobar Ingreso
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
