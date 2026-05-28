import { useState } from "react";
import { LoginView } from "./LoginView";
import { SolicitudFlow } from "./solicitante/SolicitudFlow";
import { AgenteShell } from "./agente/AgenteShell";
import { getSession, logout, type LoginResponse } from "@/lib/api";

export type Rol = "AGENTE" | "ADMIN";

interface Session {
  token: string;
  rol: Rol;
  nombre: string;
}

function restoreSession(): Session | null {
  const session = getSession();
  const token = localStorage.getItem("sidem_token");
  if (!session || !token) return null;
  return { token, rol: session.rol, nombre: session.nombre };
}

export function MigraCheckApp() {
  const [session, setSession] = useState<Session | null>(restoreSession);
  const [showSolicitud, setShowSolicitud] = useState(false);

  function handleLogin(data: LoginResponse) {
    setSession({ token: data.token, rol: data.rol, nombre: data.nombre });
  }

  function handleLogout() {
    logout();
    setSession(null);
    setShowSolicitud(false);
  }

  // Agente / Admin autenticado
  if (session) {
    return <AgenteShell session={session} onLogout={handleLogout} />;
  }

  // Solicitante sin login → wizard de registro
  if (showSolicitud) {
    return <SolicitudFlow onVolver={() => setShowSolicitud(false)} />;
  }

  // Pantalla de login
  return (
    <LoginView
      onLogin={handleLogin}
      onSolicitud={() => setShowSolicitud(true)}
    />
  );
}
