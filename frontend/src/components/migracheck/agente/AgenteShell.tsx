import { useState } from "react";
import escudo from "@/assets/escudo-panama.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Inbox, ClipboardCheck, History, BarChart3, Shield } from "lucide-react";
import type { Rol } from "../MigraCheckApp";
import { ColaExpedientes } from "./ColaExpedientes";
import { ExpedienteDetalle } from "./ExpedienteDetalle";
import { AuditLogViewer } from "./AuditLogViewer";
import { MetricasSNM } from "./MetricasSNM";
import { AsignacionExpedientes } from "./AsignacionExpedientes";
import { cn } from "@/lib/utils";

interface Session {
  token: string;
  rol: Rol;
  nombre: string;
  id: string;
}

interface Props {
  session: Session;
  onLogout: () => void;
}

type View = "cola" | "detalle" | "historial" | "auditoria" | "metricas" | "asignacion";

const NAV_AGENTE = [
  { id: "cola" as View, label: "Cola de expedientes", icon: Inbox },
  { id: "historial" as View, label: "Historial", icon: History },
];

const NAV_ADMIN = [
  { id: "metricas" as View, label: "Métricas SNM", icon: BarChart3 },
  { id: "asignacion" as View, label: "Asignar expedientes", icon: ClipboardCheck },
  { id: "auditoria" as View, label: "Auditoría WORM", icon: Shield },
];

export function AgenteShell({ session, onLogout }: Props) {
  const [view, setView] = useState<View>("cola");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const navItems = session.rol === "ADMIN"
    ? [...NAV_AGENTE, ...NAV_ADMIN]
    : NAV_AGENTE;

  function irADetalle(id: string) {
    setSelectedId(id);
    setView("detalle");
  }

  function volverACola() {
    setSelectedId(null);
    setView("cola");
  }

  function renderView() {
    switch (view) {
      case "cola":
        return <ColaExpedientes key="cola" session={session} onSeleccionar={irADetalle} />;
      case "detalle":
        return selectedId
          ? <ExpedienteDetalle applicationId={selectedId} session={session} onVolver={volverACola} />
          : <ColaExpedientes key="cola" session={session} onSeleccionar={irADetalle} />;
      case "historial":
        return <ColaExpedientes key="historial" modoHistorial session={session} onSeleccionar={irADetalle} />;
      case "auditoria":
        return <AuditLogViewer />;
      case "metricas":
        return <MetricasSNM />;
      case "asignacion":
        return <AsignacionExpedientes />;
    }
  }

  const viewTitle = {
    cola: "Cola de expedientes",
    detalle: "Detalle de expediente",
    historial: "Historial de dictámenes",
    auditoria: "Log de auditoría WORM",
    metricas: "Métricas operativas SNM",
    asignacion: "Asignación de expedientes",
  }[view];

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        {/* Brand */}
        <div className="border-b border-sidebar-border px-5 py-5">
          <div className="flex items-center gap-3">
            <img src={escudo} alt="SNM" className="h-8 w-8 object-contain drop-shadow" />
            <div className="leading-tight">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gold/90">
                República de Panamá · SNM
              </p>
              <p className="font-serif text-base font-bold text-institutional-foreground">
                SIDEM-PAN
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-sidebar-border/50 bg-institutional-hover/20 px-3 py-2.5">
            <p className="text-xs font-semibold text-institutional-foreground">{session.nombre}</p>
            <Badge
              variant="outline"
              className="mt-1 border-gold/50 bg-gold/10 text-[10px] font-semibold text-gold"
            >
              {session.rol}
            </Badge>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Módulos
          </p>

          {/* Expedientes */}
          {[
            { id: "cola" as View, label: "Cola de expedientes", icon: Inbox },
            { id: "historial" as View, label: "Historial de dictámenes", icon: History },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = view === id || (view === "detalle" && id === "cola");
            return (
              <div key={id} className="relative">
                {isActive && (
                  <div className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-gold" />
                )}
                <button
                  onClick={() => { setView(id); setSelectedId(null); }}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-md py-2.5 text-sm transition-colors duration-150",
                    isActive
                      ? "bg-sidebar-accent pl-4 font-medium text-sidebar-foreground"
                      : "pl-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </button>
              </div>
            );
          })}

          {/* Dictamen (acceso rápido desde cola) */}
          {view === "detalle" && (
            <div className="relative">
              <div className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-gold" />
              <button
                className="flex w-full cursor-pointer items-center gap-3 rounded-md bg-sidebar-accent py-2.5 pl-4 text-sm font-medium text-sidebar-foreground"
                disabled
              >
                <ClipboardCheck className="h-4 w-4 shrink-0" />
                <span>Dictamen</span>
              </button>
            </div>
          )}

          {session.rol === "ADMIN" && (
            <>
              <p className="mb-2 mt-4 px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                Administración
              </p>
              {NAV_ADMIN.map(({ id, label, icon: Icon }) => {
                const isActive = view === id;
                return (
                  <div key={id} className="relative">
                    {isActive && (
                      <div className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-gold" />
                    )}
                    <button
                      onClick={() => { setView(id); setSelectedId(null); }}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-md py-2.5 text-sm transition-colors duration-150",
                        isActive
                          ? "bg-sidebar-accent pl-4 font-medium text-sidebar-foreground"
                          : "pl-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="ml-64 flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/98 px-8 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/90">
          <h1 className="font-serif text-2xl font-bold text-foreground">{viewTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Panel de {session.rol === "ADMIN" ? "Administración" : "Agente de Cumplimiento Migratorio"}
            {" · "}{session.nombre.split(" ")[0]}
          </p>
        </header>

        <main className="flex-1 px-8 py-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
