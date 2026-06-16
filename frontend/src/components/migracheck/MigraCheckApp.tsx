import { useState } from "react";
import { LoginView } from "./LoginView";
import { SolicitudFlow } from "./solicitante/SolicitudFlow";
import { ConsultaEstado } from "./solicitante/ConsultaEstado";
import { AgenteShell } from "./agente/AgenteShell";
import { getSession, logout, type LoginResponse } from "@/lib/api";

export type Rol = "AGENTE" | "ADMIN";

interface Session {
  token: string;
  rol: Rol;
  nombre: string;
  id: string;
}

function restoreSession(): Session | null {
  const session = getSession();
  const token = localStorage.getItem("sidem_token");
  if (!session || !token || !session.id) return null;
  return { token, rol: session.rol, nombre: session.nombre, id: session.id };
}

type PublicView = "login" | "solicitud" | "consulta";

export function MigraCheckApp() {
  const [session, setSession] = useState<Session | null>(restoreSession);
  const [publicView, setPublicView] = useState<PublicView>("login");

  function handleLogin(data: LoginResponse) {
    setSession({ token: data.token, rol: data.rol, nombre: data.nombre, id: data.id });
    setPublicView("login");
  }

  function handleLogout() {
    logout();
    setSession(null);
    setPublicView("login");
  }

  if (session) {
    return <AgenteShell session={session} onLogout={handleLogout} />;
  }

  if (publicView === "solicitud") {
    return <SolicitudFlow onVolver={() => setPublicView("login")} />;
  }

  if (publicView === "consulta") {
    return <ConsultaEstado onVolver={() => setPublicView("login")} />;
  }

  return (
    <LoginView
      onLogin={handleLogin}
      onSolicitud={() => setPublicView("solicitud")}
      onConsulta={() => setPublicView("consulta")}
    />
  );
}
