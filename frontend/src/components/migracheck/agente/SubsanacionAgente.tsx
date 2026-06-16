import { useState } from "react";
import { requestSubsanacion } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, FileWarning } from "lucide-react";
import { toast } from "sonner";

interface Props {
  applicationId: string;
  ticketNumber: string;
  onExito: () => void;
  onCancelar: () => void;
}

export function SubsanacionAgente({ applicationId, ticketNumber, onExito, onCancelar }: Props) {
  const [razon, setRazon] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!razon.trim()) {
      setError("Debe indicar qué documento necesita subsanación y por qué");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await requestSubsanacion(applicationId, razon.trim());
      toast.success("Subsanación solicitada correctamente");
      onExito();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al solicitar subsanación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-warning/40 bg-warning/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-warning-foreground">
          <FileWarning className="h-4 w-4" />
          Solicitar subsanación — #{ticketNumber}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Indique qué documento es ilegible o insuficiente y la razón. El solicitante recibirá un correo con las instrucciones.
          </p>

          <div className="space-y-1.5">
            <Label>
              Documento y razón <span className="text-danger">*</span>
            </Label>
            <Textarea
              rows={4}
              placeholder="Ej. El comprobante de solvencia es ilegible — la imagen está borrosa y no se puede verificar el monto. Favor remitir una copia legible."
              value={razon}
              onChange={(e) => { setRazon(e.target.value); setError(null); }}
            />
          </div>

          {error && (
            <Alert className="border-danger/40 bg-danger/10">
              <AlertTriangle className="h-4 w-4 text-danger" />
              <AlertDescription className="text-danger">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="bg-warning text-warning-foreground hover:bg-warning/90">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileWarning className="mr-2 h-4 w-4" />}
              Solicitar subsanación
            </Button>
            <Button type="button" variant="outline" onClick={onCancelar} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
