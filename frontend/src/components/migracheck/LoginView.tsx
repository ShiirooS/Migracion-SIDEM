import { useState } from "react";
import escudo from "@/assets/escudo-panama.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Lock, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { View } from "./MigraCheckApp";
import { TestMenu } from "./TestMenu";
import { login, saveSession, type LoginResponse } from "@/lib/api";

export function LoginView({
  onLogin,
  switchView,
}: {
  onLogin: (v: View, session: LoginResponse) => void;
  switchView: (v: View) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await login(email, password);
      saveSession(session);
      const view: View = session.rol === "ADMIN" ? "admin" : "agente";
      onLogin(view, session);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      {/* Branding side */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-institutional p-12 text-institutional-foreground lg:flex">
        <div className="flex items-center gap-3">
          <img src={escudo} alt="Escudo" className="h-10 w-10 object-contain" />
          <div className="leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">República de Panamá</p>
            <p className="text-sm font-medium">Servicio Nacional de Migración</p>
          </div>
        </div>

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-8 rounded-full bg-gold/10 p-8 ring-1 ring-gold/30">
            <img src={escudo} alt="Escudo institucional" className="h-40 w-40 object-contain" />
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight">SIDEM-PAN</h1>
          <p className="mt-3 max-w-md text-balance text-base text-institutional-foreground/80">
            Sistema Inteligente de Evaluación Migratoria.
          </p>
          <p className="mt-6 max-w-sm border-t border-gold/30 pt-6 font-serif text-sm italic text-gold">
            "Protegiendo nuestras fronteras."
          </p>
        </div>

        <p className="w-full text-center text-xs text-institutional-foreground/50">
          Plataforma oficial conforme al Decreto Ley 3 de 2008 · Versión 1.0
        </p>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </aside>

      {/* Form side */}
      <main className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="font-serif text-2xl font-bold text-foreground">Acceso al sistema</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Seleccione el tipo de credencial para continuar.
            </p>
          </div>

          <Tabs defaultValue="ciudadano" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ciudadano">Ciudadano Extranjero</TabsTrigger>
              <TabsTrigger value="institucional">Acceso Institucional</TabsTrigger>
            </TabsList>

            {/* Solicitante: sin login */}
            <TabsContent value="ciudadano" className="mt-6 space-y-4">
              <Button
                className="w-full bg-institutional text-gold hover:bg-institutional-hover"
                onClick={() => switchView("solicitante")}
              >
                <Lock className="mr-2 h-4 w-4" /> Ingresar al Portal del Solicitante
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                El portal del solicitante no requiere credenciales.
              </p>
            </TabsContent>

            {/* Agente / Admin: login real contra el backend */}
            <TabsContent value="institucional" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-email">Correo institucional</Label>
                  <Input
                    id="agent-email"
                    type="email"
                    placeholder="agente@sidem-pan.gob.pa"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-pass">Contraseña</Label>
                  <Input
                    id="agent-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 h-4 w-4" />
                  )}
                  Acceder al Sistema
                </Button>
                <Alert className="border-warning/40 bg-warning/10 text-warning-foreground">
                  <ShieldAlert className="h-4 w-4 text-danger" />
                  <AlertTitle className="text-danger">Aviso de seguridad</AlertTitle>
                  <AlertDescription className="text-foreground/80">
                    Solo personal autorizado. Acceso estrictamente auditado conforme al Decreto Ley 3/2008.
                  </AlertDescription>
                </Alert>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-10">
            <TestMenu current="login" onChange={switchView} variant="light" />
          </div>
        </div>
      </main>
    </div>
  );
}
