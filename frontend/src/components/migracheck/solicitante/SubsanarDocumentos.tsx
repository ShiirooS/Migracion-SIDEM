import { useRef, useState } from "react";
import { getApplicationStatus, subsanarDocumentos, ApiError } from "@/lib/api";
import escudo from "@/assets/escudo-panama.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft, Loader2, Search, AlertTriangle, UploadCloud,
  FileCheck2, Check, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

interface Props {
  onVolver: () => void;
}

export function SubsanarDocumentos({ onVolver }: Props) {
  const [ticket, setTicket] = useState("");
  const [pasaporte, setPasaporte] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [razonSubsanacion, setRazonSubsanacion] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  const [solvenciaFile, setSolvenciaFile] = useState<File | null>(null);
  const [antecedentesFile, setAntecedentesFile] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState<{ solvencia?: string; antecedentes?: string }>({});

  const solvenciaRef = useRef<HTMLInputElement>(null);
  const antecedentesRef = useRef<HTMLInputElement>(null);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket.trim() || !pasaporte.trim()) {
      setError("Ingrese el número de ticket y el número de pasaporte");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getApplicationStatus(
        pasaporte.trim().toUpperCase(),
        ticket.trim().toUpperCase(),
      );
      if (data.estado !== "SUBSANACION_PENDIENTE") {
        setError("Este expediente no está en estado de subsanación. Si tiene dudas, comuníquese con la SNM.");
        return;
      }
      setApplicationId(data.ticket_number);
      setRazonSubsanacion(data.razon_subsanacion);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("No se encontró ninguna solicitud con esos datos. Verifique el ticket y el pasaporte.");
      } else {
        setError(err instanceof Error ? err.message : "Error al consultar el estado");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleFile(field: "solvencia" | "antecedentes", file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setFileErrors((prev) => ({ ...prev, [field]: "Solo se aceptan archivos PDF" }));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileErrors((prev) => ({ ...prev, [field]: `El archivo no debe superar ${MAX_FILE_MB}MB` }));
      return;
    }
    setFileErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === "solvencia") setSolvenciaFile(file);
    else setAntecedentesFile(file);
  }

  async function handleSubsanar() {
    if (!applicationId) return;
    if (!solvenciaFile && !antecedentesFile) {
      setError("Debe subir al menos un documento corregido");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await subsanarDocumentos(applicationId, {
        ticket_number: ticket.trim().toUpperCase(),
        numero_pasaporte: pasaporte.trim().toUpperCase(),
        comprobante_solvencia: solvenciaFile ?? undefined,
        antecedentes_penales: antecedentesFile ?? undefined,
      });
      setExito(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar documentos");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={escudo} alt="SNM" className="h-7 w-7 object-contain" />
            <div className="leading-tight">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                República de Panamá · SNM
              </p>
              <p className="font-serif text-sm font-bold text-foreground">SIDEM-PAN</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onVolver}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
        <div>
          <h1 className="font-serif text-2xl font-bold">Subsanar documentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Si se le solicitaron documentos adicionales, ingrese sus datos y suba los PDFs corregidos.
          </p>
        </div>

        {!applicationId && !exito && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos de consulta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={buscar} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Número de ticket <span className="text-danger">*</span></Label>
                  <Input
                    placeholder="PAN-2026-00001"
                    className="font-mono uppercase"
                    value={ticket}
                    onChange={(e) => setTicket(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Número de pasaporte <span className="text-danger">*</span></Label>
                  <Input
                    placeholder="AB123456"
                    className="font-mono uppercase"
                    value={pasaporte}
                    onChange={(e) => setPasaporte(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <Alert className="border-danger/40 bg-danger/10">
                    <AlertTriangle className="h-4 w-4 text-danger" />
                    <AlertDescription className="text-danger">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-institutional text-gold hover:bg-institutional-hover"
                  disabled={loading}
                >
                  {loading
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Search className="mr-2 h-4 w-4" />}
                  Buscar expediente
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {applicationId && !exito && (
          <>
            {razonSubsanacion && (
              <Alert className="border-warning/40 bg-warning/10">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertTitle className="text-warning-foreground">Documento requerido</AlertTitle>
                <AlertDescription className="text-foreground/80">{razonSubsanacion}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subir documentos corregidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Seleccione los documentos que desea subir. Solo se aceptan PDFs de máximo {MAX_FILE_MB}MB.
                </p>

                <div className="space-y-1.5">
                  <Label>Comprobante de solvencia (PDF, máx. {MAX_FILE_MB}MB)</Label>
                  <input
                    ref={solvenciaRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFile("solvencia", e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => solvenciaRef.current?.click()}
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
                      fileErrors.solvencia
                        ? "border-danger bg-danger/5"
                        : solvenciaFile
                          ? "border-success bg-success/5"
                          : "border-border bg-muted/30 hover:border-institutional hover:bg-institutional/5",
                    )}
                  >
                    {solvenciaFile ? (
                      <>
                        <FileCheck2 className="h-5 w-5 text-success" />
                        <p className="text-sm font-medium text-success">{solvenciaFile.name}</p>
                        <p className="text-xs text-muted-foreground">Clic para cambiar</p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm font-medium">Seleccionar archivo</p>
                        <p className="text-xs text-muted-foreground">Solo PDF · Máximo {MAX_FILE_MB} MB</p>
                      </>
                    )}
                  </button>
                  {fileErrors.solvencia && <p className="text-xs text-danger">{fileErrors.solvencia}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Certificado de antecedentes penales (PDF, máx. {MAX_FILE_MB}MB)</Label>
                  <input
                    ref={antecedentesRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFile("antecedentes", e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => antecedentesRef.current?.click()}
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
                      fileErrors.antecedentes
                        ? "border-danger bg-danger/5"
                        : antecedentesFile
                          ? "border-success bg-success/5"
                          : "border-border bg-muted/30 hover:border-institutional hover:bg-institutional/5",
                    )}
                  >
                    {antecedentesFile ? (
                      <>
                        <FileCheck2 className="h-5 w-5 text-success" />
                        <p className="text-sm font-medium text-success">{antecedentesFile.name}</p>
                        <p className="text-xs text-muted-foreground">Clic para cambiar</p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm font-medium">Seleccionar archivo</p>
                        <p className="text-xs text-muted-foreground">Solo PDF · Máximo {MAX_FILE_MB} MB</p>
                      </>
                    )}
                  </button>
                  {fileErrors.antecedentes && <p className="text-xs text-danger">{fileErrors.antecedentes}</p>}
                </div>

                {error && (
                  <Alert className="border-danger/40 bg-danger/10">
                    <AlertTriangle className="h-4 w-4 text-danger" />
                    <AlertDescription className="text-danger">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
                  disabled={enviando || (!solvenciaFile && !antecedentesFile)}
                  onClick={handleSubsanar}
                >
                  {enviando
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <UploadCloud className="mr-2 h-4 w-4" />}
                  Subir documentos corregidos
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {exito && (
          <Card className="border-success/40 bg-success/5">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="rounded-full bg-success/15 p-4">
                <Check className="h-8 w-8 text-success" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">Documentos enviados</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sus documentos corregidos han sido recibidos. El expediente ha vuelto a estado <strong>EN EVALUACIÓN</strong>.
                </p>
              </div>
              <Button variant="outline" onClick={onVolver}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
