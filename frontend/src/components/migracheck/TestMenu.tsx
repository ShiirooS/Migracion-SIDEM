import type { View } from "./MigraCheckApp";
import { cn } from "@/lib/utils";
import { FlaskConical } from "lucide-react";

const VIEWS: { id: View; label: string }[] = [
  { id: "login", label: "Login" },
  { id: "solicitante", label: "Solicitante" },
  { id: "agente", label: "Agente" },
  { id: "admin", label: "Admin" },
];

export function TestMenu({
  current,
  onChange,
  variant = "dark",
}: {
  current: View;
  onChange: (v: View) => void;
  variant?: "dark" | "light";
}) {
  const dark = variant === "dark";
  return (
    <div
      className={cn(
        "rounded-md border p-3 text-xs",
        dark
          ? "border-sidebar-border bg-institutional-hover/40 text-institutional-foreground/80"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      <div className="mb-2 flex items-center gap-2 font-semibold uppercase tracking-wider opacity-80">
        <FlaskConical className="h-3.5 w-3.5" />
        Menú de Pruebas
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            className={cn(
              "rounded px-2 py-1 text-left text-[11px] transition-colors",
              current === v.id
                ? dark
                  ? "bg-gold text-gold-foreground font-semibold"
                  : "bg-institutional text-institutional-foreground font-semibold"
                : dark
                  ? "hover:bg-sidebar-accent"
                  : "hover:bg-background",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
