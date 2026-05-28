import { useState } from "react";
import { LoginView } from "./LoginView";
import { AppShell } from "./AppShell";
import { getSession, logout, type LoginResponse } from "@/lib/api";

export type View = "login" | "solicitante" | "agente" | "admin";

function getInitialView(): View {
  const session = getSession();
  if (!session) return "login";
  return session.rol === "ADMIN" ? "admin" : "agente";
}

export function MigraCheckApp() {
  const [currentView, setCurrentView] = useState<View>(getInitialView);
  const [userName, setUserName] = useState<string>(() => getSession()?.nombre ?? "");

  function handleLogin(view: View, session: LoginResponse) {
    setUserName(session.nombre);
    setCurrentView(view);
  }

  function handleSwitchView(view: View) {
    if (view === "login") {
      logout();
      setUserName("");
    }
    setCurrentView(view);
  }

  if (currentView === "login") {
    return <LoginView onLogin={handleLogin} switchView={handleSwitchView} />;
  }

  return <AppShell role={currentView} switchView={handleSwitchView} userName={userName} />;
}
