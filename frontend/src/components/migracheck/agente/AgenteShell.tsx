import escudo from "@/assets/escudo-panama.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  Inbox,
  ClipboardCheck,
  History,
  BarChart3,
} from "lucide-react";
import type { Rol } from "../MigraCheckApp";

interface Session {
  token: string;
  rol: Rol;
  nombre: string;
}

interface Props {
  session: Session;
  onLogout: () => void;
}

const MODULOS_AGENTE = [
  {
    titulo: "Cola de expedientes",
    descripcion: "Expedientes asignados ordenados por nivel de riesgo (ALTO primero).",
    icono: Inbox,
    scrum: "SCRUM-36",
    artículo: "Art. 6 Num. 4 DL3/2008",
  },
  {
    titulo: "Dictamen legislativo",
    descripcion: "Visor de documentos PDF + formulario APROBAR / RECHAZAR con artículo legal citado.",
    icono: ClipboardCheck,
    scrum: "SCRUM-37",
    artículo: "Art. 6 Num. 4, Art. 50 DL3/2008",
  },
  {
    titulo: "Historial de dictámenes",
    descripcion: "Resoluciones emitidas con fecha, expediente y fundamento legal.",
    icono: History,
    scrum: "SCRUM-36",
    artículo: "Art. 6 Num. 2 DL3/2008",
  },
];

const MODULOS_ADMIN = [
  {
    titulo: "Métricas SNM",
    descripcion: "Indicadores operativos: expedientes procesados, tiempos de respuesta, distribución de riesgo.",
    icono: BarChart3,
    scrum: "SCRUM-40",
    artículo: "Art. 6 Num. 2 DL3/2008",
  },
  {
    titulo: "Log de auditoría (WORM)",
    descripcion: "Registro inmutable de todas las acciones sobre expedientes. Triggers SQL impiden DELETE/UPDATE.",
    icono: ClipboardCheck,
    scrum: "SCRUM-39",
    artículo: "Art. 6 Num. 2 DL3/2008",
  },
];

export function AgenteShell({ session, onLogout }: Props) {
  const modulos = session.rol === "ADMIN"
    ? [...MODULOS_AGENTE, ...MODULOS_ADMIN]
    : MODULOS_AGENTE;

  return (
    <div className="min-h-screen bg-surface">

      {/* Sidebar */}
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

          {/* Info del usuario autenticado */}
          <div className="mt-4 rounded-md bg-institutional-hover/30 px-3 py-2.5">
            <p className="text-xs font-semibold text-institutional-foreground">
              {session.nombre}
            </p>
            <Badge
              variant="outline"
              className="mt-1 border-gold/40 bg-gold/10 text-[10px] text-gold"
            >
              {session.rol}
            </Badge>
          </div>
        </div>

        {/* Nav — en desarrollo */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Módulos
          </p>
          {[
            { label: "Cola de expedientes", icon: Inbox },
            { label: "Dictamen legislativo", icon: ClipboardCheck },
            { label: "Historial", icon: History },
            ...(session.rol === "ADMIN"
              ? [{ label: "Auditoría", icon: BarChart3 }]
              : []),
          ].map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/40"
              title="Disponible en próximas iteraciones del sprint"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              <span className="ml-auto rounded bg-sidebar-border px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                Dev
              </span>
            </div>
          ))}
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
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-8 py-5 backdrop-blur">
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Bienvenido, {session.nombre.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Panel de {session.rol === "ADMIN" ? "Administración" : "Agente de Cumplimiento Migratorio"}
          </p>
        </header>

        <main className="flex-1 px-8 py-8 space-y-6">
          {/* Cards de módulos */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Módulos
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modulos.map((m) => {
                const Icon = m.icono;
                return (
                  <Card key={m.titulo} className="border-dashed opacity-70">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-muted p-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">{m.titulo}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{m.descripcion}</p>
                      <p className="text-[10px] italic text-muted-foreground/70">{m.artículo}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
