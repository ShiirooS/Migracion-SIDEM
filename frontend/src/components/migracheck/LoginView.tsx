import { useState } from "react";
import escudo from "@/assets/escudo-panama.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Lock, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { login, saveSession, type LoginResponse } from "@/lib/api";

interface Props {
  onLogin: (data: LoginResponse) => void;
  onSolicitud: () => void;
}

export function LoginView({ onLogin, onSolicitud }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      saveSession(data);
      onLogin(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">

      {/* Panel institucional izquierdo */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-institutional p-12 text-institutional-foreground lg:flex">
        <div className="flex items-center gap-3">
          <img src={escudo} alt="Escudo SNM" className="h-10 w-10 object-contain" />
          <div className="leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              República de Panamá
            </p>
            <p className="text-sm font-medium">Servicio Nacional de Migración</p>
          </div>
        </div>

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-8 rounded-full bg-gold/10 p-8 ring-1 ring-gold/30">
            <img src={escudo} alt="Escudo institucional" className="h-40 w-40 object-contain" />
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight">SIDEM-PAN</h1>
          <p className="mt-3 max-w-md text-balance text-base text-institutional-foreground/80">
            Sistema Inteligente de Evaluación Migratoria
          </p>
          <p className="mt-6 max-w-sm border-t border-gold/30 pt-6 font-serif text-sm italic text-gold">
            "Protegiendo nuestras fronteras."
          </p>
        </div>

        <p className="w-full text-center text-xs text-institutional-foreground/50">
          Plataforma oficial conforme al Decreto Ley 3 de 2008 · Versión 1.0
        </p>

        {/* Decoración de fondo */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </aside>

      {/* Panel de acceso derecho */}
      <main className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">

          {/* Logo móvil */}
          <div className="flex items-center gap-3 lg:hidden">
            <img src={escudo} alt="Escudo SNM" className="h-8 w-8 object-contain" />
            <span className="font-serif text-lg font-bold">SIDEM-PAN</span>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Acceso al sistema</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Seleccione el tipo de acceso para continuar.
            </p>
          </div>

          <Tabs defaultValue="ciudadano" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ciudadano">Ciudadano Extranjero</TabsTrigger>
              <TabsTrigger value="institucional">Acceso Institucional</TabsTrigger>
            </TabsList>

            {/* Solicitante — sin credenciales */}
            <TabsContent value="ciudadano" className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Puede iniciar su evaluación migratoria sin necesidad de crear una cuenta.
                Al finalizar recibirá un número de ticket para dar seguimiento a su trámite.
              </p>
              <Button
                className="w-full bg-institutional text-gold hover:bg-institutional-hover"
                onClick={onSolicitud}
              >
                <Lock className="mr-2 h-4 w-4" />
                Iniciar solicitud de evaluación
              </Button>
            </TabsContent>

            {/* Agente / Admin — login real */}
            <TabsContent value="institucional" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo institucional</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="agente@sidem-pan.gob.pa"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
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
                  {loading
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <KeyRound className="mr-2 h-4 w-4" />}
                  Acceder al sistema
                </Button>

                <Alert className="border-warning/40 bg-warning/10">
                  <ShieldAlert className="h-4 w-4 text-danger" />
                  <AlertTitle className="text-sm font-semibold text-danger">Aviso de seguridad</AlertTitle>
                  <AlertDescription className="text-xs text-foreground/80">
                    Solo personal autorizado. Cada acceso queda registrado en el log de auditoría
                    conforme al Decreto Ley 3/2008.
                  </AlertDescription>
                </Alert>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
