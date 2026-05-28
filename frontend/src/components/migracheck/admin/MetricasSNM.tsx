import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ShieldAlert, FileCheck2, Users2, Activity } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const KPIS = [
  { label: "Trámites procesados (mes)", value: "4,218", delta: "+12.4%", icon: FileCheck2, up: true },
  { label: "Alertas Interpol activas", value: "37", delta: "+3", icon: ShieldAlert, up: false, danger: true },
  { label: "Agentes en línea", value: "84", delta: "−2", icon: Users2, up: false },
  { label: "Tasa de aprobación", value: "71.6%", delta: "+1.8%", icon: Activity, up: true },
];

const DATA = [
  { mes: "Ene", aprobados: 380, rechazados: 110 },
  { mes: "Feb", aprobados: 420, rechazados: 130 },
  { mes: "Mar", aprobados: 510, rechazados: 145 },
  { mes: "Abr", aprobados: 470, rechazados: 160 },
  { mes: "May", aprobados: 540, rechazados: 122 },
];

export function MetricasSNM() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
                  <p className="mt-2 font-serif text-3xl font-bold text-foreground">{k.value}</p>
                </div>
                <div className={`rounded-md p-2 ${k.danger ? "bg-danger/10 text-danger" : "bg-institutional/10 text-institutional"}`}>
                  <k.icon className="h-5 w-5" />
                </div>
              </div>
              <p className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${k.up ? "text-success" : k.danger ? "text-danger" : "text-muted-foreground"}`}>
                {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {k.delta} vs mes anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Dictámenes por mes</CardTitle>
          <p className="text-sm text-muted-foreground">Aprobados vs. rechazados — últimos 5 meses</p>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 255)" />
                <XAxis dataKey="mes" stroke="oklch(0.5 0.03 257)" fontSize={12} />
                <YAxis stroke="oklch(0.5 0.03 257)" fontSize={12} />
                <Tooltip
                  cursor={{ fill: "oklch(0.95 0.01 255)" }}
                  contentStyle={{
                    backgroundColor: "oklch(0.22 0.08 260)",
                    border: "none",
                    borderRadius: 8,
                    color: "white",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "white", fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: "white" }}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(),
                    name === "aprobados" ? "Aprobados" : "Rechazados",
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="square"
                  formatter={(value: string) => (
                    <span className="text-xs text-foreground">
                      {value === "aprobados" ? "Aprobados" : "Rechazados"}
                    </span>
                  )}
                />
                <Bar dataKey="aprobados" name="aprobados" fill="oklch(0.22 0.08 260)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rechazados" name="rechazados" fill="oklch(0.86 0.17 95)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
