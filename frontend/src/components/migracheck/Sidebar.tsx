import { cn } from "@/lib/utils";
import { Brand } from "./Brand";
import { TestMenu } from "./TestMenu";
import type { View } from "./MigraCheckApp";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";

export type NavItem = { id: string; label: string; icon: LucideIcon };

export function Sidebar({
  role,
  items,
  currentPage,
  onNavigate,
  switchView,
  userName,
}: {
  role: View;
  items: NavItem[];
  currentPage: string;
  onNavigate: (id: string) => void;
  switchView: (v: View) => void;
  userName?: string;
}) {
  const roleLabel =
    role === "solicitante" ? "Portal del Solicitante" : role === "agente" ? "Agente SNM" : "Administración";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-5 py-5">
        <Brand />
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/80">
          {roleLabel}
        </p>
        {userName && (
          <p className="mt-1 truncate text-[11px] text-institutional-foreground/60">{userName}</p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = item.id === currentPage;
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  {active && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r bg-gold" />}
                  <Icon className={cn("h-4 w-4", active ? "text-gold" : "text-sidebar-foreground/60")} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-sidebar-border p-3">
        <button
          onClick={() => switchView("login")}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
        </button>
        <TestMenu current={role} onChange={switchView} />
      </div>
    </aside>
  );
}
