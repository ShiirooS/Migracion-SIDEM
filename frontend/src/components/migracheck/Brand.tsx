import escudo from "@/assets/escudo-panama.png";
import { cn } from "@/lib/utils";

export function Brand({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img src={escudo} alt="Escudo SNM Panamá" style={{ width: size, height: size }} className="object-contain drop-shadow" />
      <div className="leading-tight">
        <p className="whitespace-nowrap text-[9px] uppercase tracking-[0.14em] text-gold/90 font-semibold">República de Panamá · SNM</p>
        <p className="font-serif text-base font-bold text-institutional-foreground">SIDEM-PAN</p>
      </div>
    </div>
  );
}
