import { useState, useEffect } from "react";
import { getMetrics, type Metrics } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Loader2, AlertTriangle, BarChart3, FileText, Clock,
  CheckCircle, XCircle, RefreshCw, Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricasSNM() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMetrics();
      setMetrics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar métricas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-danger/40 bg-danger/10">
        <AlertTriangle className="h-4 w-4 text-danger" />
        <AlertDescription className="text-danger">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!metrics) return null;

  const stats = [
    { label: "Total expedientes", value: metrics.total, icon: BarChart3, color: "text-institutional" },
    { label: "Ingresados hoy", value: metrics.hoy, icon: Clock, color: "text-blue-600" },
    { label: "Pendientes", value: metrics.pendientes, icon: Inbox, color: "text-warning-foreground" },
    { label: "En evaluación", value: metrics.en_evaluacion, icon: FileText, color: "text-blue-500" },
    { label: "Aprobados", value: metrics.aprobados, icon: CheckCircle, color: "text-success" },
    { label: "Rechazados", value: metrics.rechazados, icon: XCircle, color: "text-danger" },
  ];

  const riesgos = [
    { nivel: "ALTO", color: "bg-danger" },
    { nivel: "MEDIO", color: "bg-warning" },
    { nivel: "BAJO", color: "bg-success" },
    { nivel: "SIN_SCORE", color: "bg-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold">Métricas operativas SNM</h2>
        <Button variant="outline" size="sm" onClick={cargar} disabled={loading}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" /> Actualizar
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <Icon className={cn("h-5 w-5", s.color)} />
                </div>
                <p className="mt-2 text-3xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribución por nivel de riesgo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {riesgos.map(({ nivel, color }) => {
              const count = metrics.por_riesgo[nivel] ?? 0;
              const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
              return (
                <div key={nivel}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{nivel.replace("_", " ")}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className={cn("h-2 rounded-full transition-all", color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribución por categoría migratoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(metrics.por_categoria)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => {
                const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="max-w-[60%] truncate text-muted-foreground">{cat}</span>
                    <span className="font-semibold">
                      {count}{" "}
                      <span className="font-normal text-muted-foreground">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            {Object.keys(metrics.por_categoria).length === 0 && (
              <p className="text-xs text-muted-foreground">Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
