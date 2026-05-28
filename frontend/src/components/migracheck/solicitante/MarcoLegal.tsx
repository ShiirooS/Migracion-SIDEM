import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";

const ARTICULOS = [
  {
    art: "Artículo 15",
    body: "Faculta la reglamentación de las condiciones y requisitos que deben cumplirse para aplicar a las categorías migratorias.",
  },
  {
    art: "Artículo 43 (Numeral 2)",
    body: "Establece como requisito obligatorio para ingresar al territorio nacional presentar pasaporte o documento de viaje vigente.",
  },
  {
    art: "Artículo 50 (Numeral 1)",
    body: "Permite negar el ingreso a extranjeros que no cuenten con la solvencia económica para sufragar sus gastos de manutención.",
  },
  {
    art: "Artículo 50 (Numerales 4 y 5)",
    body: "Establece como causal de rechazo de ingreso el tener antecedentes penales del país de origen o constituir un riesgo a la seguridad nacional.",
  },
];

export function MarcoLegal() {
  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-institutional shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-institutional/10 p-2">
              <Scale className="h-5 w-5 text-institutional" />
            </div>
            <div>
              <CardTitle className="font-serif">Decreto Ley 3 del 22 de febrero de 2008</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gaceta Oficial 25986 — Servicio Nacional de Migración de Panamá
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-foreground/80">
          El diseño y las validaciones de negocio del sistema SIDEM-PAN se fundamentan estrictamente
          en el Decreto Ley 3 del 22 de febrero de 2008:
        </CardContent>
      </Card>

      <div className="space-y-3">
        {ARTICULOS.map((a) => (
          <Card key={a.art} className="shadow-md">
            <CardContent className="flex gap-4 pt-6">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-institutional" />
              <div>
                <p className="font-serif text-sm font-bold text-institutional">{a.art}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/80">{a.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <footer className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
        <p className="font-medium">versión 1</p>
        <p className="mt-1">© 2026 Servicio Nacional de Migración. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
