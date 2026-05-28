import { useState, useMemo } from "react";
import type { View } from "./MigraCheckApp";
import { Sidebar, type NavItem } from "./Sidebar";
import {
  Home, FilePlus, FolderClock, Scale,
  Inbox, FileWarning, BookCheck,
  BarChart3, ListChecks, Users, History,
} from "lucide-react";

import { Inicio } from "./solicitante/Inicio";
import { NuevaSolicitud } from "./solicitante/NuevaSolicitud";
import { MisTramites } from "./solicitante/MisTramites";
import { MarcoLegal } from "./solicitante/MarcoLegal";

import { ColaAuditoria } from "./agente/ColaAuditoria";
import { CasosPendientes } from "./agente/CasosPendientes";
import { HistorialDictamenes } from "./agente/HistorialDictamenes";

import { MetricasSNM } from "./admin/MetricasSNM";
import { ListasControl } from "./admin/ListasControl";
import { CuentasAgentes } from "./admin/CuentasAgentes";
import { Trazabilidad } from "./admin/Trazabilidad";

const NAV: Record<Exclude<View, "login">, NavItem[]> = {
  solicitante: [
    { id: "inicio", label: "Inicio", icon: Home },
    { id: "nueva", label: "Nueva Solicitud", icon: FilePlus },
    { id: "tramites", label: "Mis Trámites", icon: FolderClock },
    { id: "legal", label: "Marco Legal", icon: Scale },
  ],
  agente: [
    { id: "cola", label: "Cola de Auditoría", icon: Inbox },
    { id: "pendientes", label: "Casos Pendientes", icon: FileWarning },
    { id: "historial", label: "Historial de Dictámenes", icon: BookCheck },
  ],
  admin: [
    { id: "metricas", label: "Métricas SNM", icon: BarChart3 },
    { id: "listas", label: "Listas de Control", icon: ListChecks },
    { id: "cuentas", label: "Cuentas de Agentes", icon: Users },
    { id: "traza", label: "Trazabilidad", icon: History },
  ],
};

const HEADERS: Record<string, { title: string; subtitle: string }> = {
  inicio: { title: "Bienvenido al Portal", subtitle: "Resumen de su expediente migratorio" },
  nueva: { title: "Nueva Solicitud", subtitle: "Complete el wizard de evaluación migratoria" },
  tramites: { title: "Mis Trámites", subtitle: "Historial de tickets y estado actual" },
  legal: { title: "Marco Legal", subtitle: "Decreto Ley 3 de 2008 — Servicio Nacional de Migración" },
  cola: { title: "Cola de Auditoría", subtitle: "Expedientes en espera de dictamen" },
  pendientes: { title: "Casos Pendientes", subtitle: "Trámites devueltos a subsanación" },
  historial: { title: "Historial de Dictámenes", subtitle: "Sus resoluciones registradas" },
  metricas: { title: "Métricas SNM", subtitle: "Indicadores operativos institucionales" },
  listas: { title: "Listas de Control", subtitle: "Sincronización de bases de seguridad" },
  cuentas: { title: "Cuentas de Agentes", subtitle: "Gestión de inspectores migratorios" },
  traza: { title: "Trazabilidad", subtitle: "Registro inmutable de auditoría" },
};

export function AppShell({ role, switchView, userName }: { role: Exclude<View, "login">; switchView: (v: View) => void; userName?: string }) {
  const items = NAV[role];
  const [currentPage, setCurrentPage] = useState(items[0].id);

  // ensure valid page when role changes
  const safePage = items.find((i) => i.id === currentPage)?.id ?? items[0].id;

  const content = useMemo(() => {
    if (role === "solicitante") {
      switch (safePage) {
        case "inicio": return <Inicio />;
        case "nueva": return <NuevaSolicitud />;
        case "tramites": return <MisTramites />;
        case "legal": return <MarcoLegal />;
      }
    }
    if (role === "agente") {
      switch (safePage) {
        case "cola": return <ColaAuditoria />;
        case "pendientes": return <CasosPendientes />;
        case "historial": return <HistorialDictamenes />;
      }
    }
    if (role === "admin") {
      switch (safePage) {
        case "metricas": return <MetricasSNM />;
        case "listas": return <ListasControl />;
        case "cuentas": return <CuentasAgentes />;
        case "traza": return <Trazabilidad />;
      }
    }
    return null;
  }, [role, safePage]);

  const header = HEADERS[safePage];

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        role={role}
        items={items}
        currentPage={safePage}
        onNavigate={setCurrentPage}
        switchView={switchView}
        userName={userName}
      />
      <div className="ml-[260px] flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-8 py-5 backdrop-blur">
          <h1 className="font-serif text-2xl font-bold text-foreground">{header.title}</h1>
          <p className="text-sm text-muted-foreground">{header.subtitle}</p>
        </header>
        <main className="flex-1 px-8 py-8">{content}</main>
      </div>
    </div>
  );
}
