import escudo from "@/assets/escudo-panama.png";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { NuevaSolicitud } from "./NuevaSolicitud";

interface Props {
  onVolver: () => void;
}

export function SolicitudFlow({ onVolver }: Props) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Barra superior institucional */}
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={escudo} alt="SNM" className="h-7 w-7 object-contain" />
            <div className="leading-tight">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                República de Panamá · SNM
              </p>
              <p className="font-serif text-sm font-bold text-foreground">SIDEM-PAN</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onVolver}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </header>

      {/* Wizard */}
      <div className="px-4 py-8">
        <NuevaSolicitud />
      </div>
    </div>
  );
}
