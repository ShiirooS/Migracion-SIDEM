import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  UploadCloud, Send, ChevronLeft, ChevronRight,
  AlertCircle, Check, Loader2, FileCheck2, Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createApplication } from "@/lib/api";

// ─── Constantes ───────────────────────────────────────────────────────────────

const STEPS = ["Identidad y Pasaporte", "Solvencia Económica", "Antecedentes Penales"];
const MAX_FILE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const NOMBRE_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{3,150}$/;
const PASAPORTE_RE = /^[a-zA-Z0-9]{6,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PAISES: { codigo: string; nombre: string }[] = [
  { codigo: "AR", nombre: "Argentina" },
  { codigo: "AF", nombre: "Afganistán" },
  { codigo: "AO", nombre: "Angola" },
  { codigo: "AZ", nombre: "Azerbaiyán" },
  { codigo: "BD", nombre: "Bangladesh" },
  { codigo: "BO", nombre: "Bolivia" },
  { codigo: "BR", nombre: "Brasil" },
  { codigo: "BF", nombre: "Burkina Faso" },
  { codigo: "BI", nombre: "Burundi" },
  { codigo: "CM", nombre: "Camerún" },
  { codigo: "CA", nombre: "Canadá" },
  { codigo: "CL", nombre: "Chile" },
  { codigo: "CN", nombre: "China" },
  { codigo: "CO", nombre: "Colombia" },
  { codigo: "KR", nombre: "Corea del Sur" },
  { codigo: "CR", nombre: "Costa Rica" },
  { codigo: "CD", nombre: "R.D. Congo" },
  { codigo: "CU", nombre: "Cuba" },
  { codigo: "DZ", nombre: "Argelia" },
  { codigo: "EC", nombre: "Ecuador" },
  { codigo: "EG", nombre: "Egipto" },
  { codigo: "SV", nombre: "El Salvador" },
  { codigo: "ES", nombre: "España" },
  { codigo: "ET", nombre: "Etiopía" },
  { codigo: "FR", nombre: "Francia" },
  { codigo: "GH", nombre: "Ghana" },
  { codigo: "GT", nombre: "Guatemala" },
  { codigo: "GN", nombre: "Guinea" },
  { codigo: "HN", nombre: "Honduras" },
  { codigo: "IN", nombre: "India" },
  { codigo: "IT", nombre: "Italia" },
  { codigo: "JP", nombre: "Japón" },
  { codigo: "KE", nombre: "Kenia" },
  { codigo: "KZ", nombre: "Kazajistán" },
  { codigo: "KG", nombre: "Kirguistán" },
  { codigo: "ML", nombre: "Mali" },
  { codigo: "MX", nombre: "México" },
  { codigo: "MR", nombre: "Mauritania" },
  { codigo: "MA", nombre: "Marruecos" },
  { codigo: "MZ", nombre: "Mozambique" },
  { codigo: "NI", nombre: "Nicaragua" },
  { codigo: "NE", nombre: "Níger" },
  { codigo: "NG", nombre: "Nigeria" },
  { codigo: "NP", nombre: "Nepal" },
  { codigo: "PA", nombre: "Panamá" },
  { codigo: "PY", nombre: "Paraguay" },
  { codigo: "PE", nombre: "Perú" },
  { codigo: "PK", nombre: "Pakistán" },
  { codigo: "PT", nombre: "Portugal" },
  { codigo: "DO", nombre: "República Dominicana" },
  { codigo: "RU", nombre: "Rusia" },
  { codigo: "SN", nombre: "Senegal" },
  { codigo: "SL", nombre: "Sierra Leona" },
  { codigo: "SO", nombre: "Somalia" },
  { codigo: "SD", nombre: "Sudán" },
  { codigo: "LK", nombre: "Sri Lanka" },
  { codigo: "TJ", nombre: "Tayikistán" },
  { codigo: "TG", nombre: "Togo" },
  { codigo: "TM", nombre: "Turkmenistán" },
  { codigo: "TR", nombre: "Turquía" },
  { codigo: "UA", nombre: "Ucrania" },
  { codigo: "UY", nombre: "Uruguay" },
  { codigo: "US", nombre: "Estados Unidos" },
  { codigo: "UZ", nombre: "Uzbekistán" },
  { codigo: "VE", nombre: "Venezuela" },
  { codigo: "VN", nombre: "Vietnam" },
  { codigo: "GB", nombre: "Reino Unido" },
].sort((a, b) => a.nombre.localeCompare(b.nombre));

const CATEGORIAS = [
  "Turismo",
  "Residencia temporal",
  "Residencia permanente",
  "Trabajo",
  "Estudio",
];

// ─── Helpers de validación ────────────────────────────────────────────────────

function esMayorDeEdad(fechaStr: string): boolean {
  if (!fechaStr) return false;
  const hoy = new Date();
  const nacimiento = new Date(fechaStr);
  const edad = hoy.getFullYear() - nacimiento.getFullYear();
  const cumplioEsteAnio =
    hoy.getMonth() > nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
  return edad > 18 || (edad === 18 && cumplioEsteAnio);
}

function pasaporteVigenteSeisM(fechaStr: string): boolean {
  if (!fechaStr) return false;
  const limite = new Date();
  limite.setDate(limite.getDate() + 180);
  return new Date(fechaStr) > limite;
}

function validarPDF(file: File): string | null {
  if (file.type !== "application/pdf") return "Solo se aceptan archivos en formato PDF";
  if (file.size > MAX_FILE_BYTES) return `El archivo no debe superar ${MAX_FILE_MB}MB`;
  return null;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormState {
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  nacionalidad: string;
  numeroPasaporte: string;
  vencimientoPasaporte: string;
  categoriaMigratoria: string;
  correoElectronico: string;
  montoSubsistencia: string;
  comprobanteSolvencia: File | null;
  antecedentePenal: File | null;
}

type Errors = Partial<Record<keyof FormState, string>>;

interface Confirmacion {
  ticket_number: string;
  categoria_migratoria: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function NuevaSolicitud() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);

  const [form, setForm] = useState<FormState>({
    nombres: "",
    apellidos: "",
    fechaNacimiento: "",
    nacionalidad: "",
    numeroPasaporte: "",
    vencimientoPasaporte: "",
    categoriaMigratoria: "",
    correoElectronico: "",
    montoSubsistencia: "",
    comprobanteSolvencia: null,
    antecedentePenal: null,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const solvenciaRef = useRef<HTMLInputElement>(null);
  const antecedentesRef = useRef<HTMLInputElement>(null);

  // ─── Actualización de campos ────────────────────────────────────────────────

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleFile(field: "comprobanteSolvencia" | "antecedentePenal", file: File | undefined) {
    if (!file) return;
    const err = validarPDF(file);
    if (err) {
      setErrors((prev) => ({ ...prev, [field]: err }));
      return;
    }
    setField(field, file);
  }

  // ─── Validación por paso ─────────────────────────────────────────────────────

  function validarPaso0(): Errors {
    const e: Errors = {};
    if (!NOMBRE_RE.test(form.nombres))
      e.nombres = "Solo letras y espacios, entre 3 y 150 caracteres";
    if (!NOMBRE_RE.test(form.apellidos))
      e.apellidos = "Solo letras y espacios, entre 3 y 150 caracteres";
    if (!form.fechaNacimiento)
      e.fechaNacimiento = "Este campo es obligatorio";
    else if (!esMayorDeEdad(form.fechaNacimiento))
      e.fechaNacimiento = "El solicitante debe ser mayor de edad";
    if (!form.nacionalidad)
      e.nacionalidad = "Seleccione un país";
    if (!PASAPORTE_RE.test(form.numeroPasaporte))
      e.numeroPasaporte = "Solo letras y números, sin espacios, entre 6 y 20 caracteres";
    if (!form.vencimientoPasaporte)
      e.vencimientoPasaporte = "Este campo es obligatorio";
    else if (!pasaporteVigenteSeisM(form.vencimientoPasaporte))
      e.vencimientoPasaporte = "El pasaporte debe tener vigencia mínima de 6 meses (Art. 43, Decreto Ley 3/2008)";
    if (!form.categoriaMigratoria)
      e.categoriaMigratoria = "Seleccione una categoría";
    if (form.correoElectronico && !EMAIL_RE.test(form.correoElectronico))
      e.correoElectronico = "Ingrese un correo electrónico válido";
    return e;
  }

  function validarPaso1(): Errors {
    const e: Errors = {};
    const monto = Number(form.montoSubsistencia);
    if (!form.montoSubsistencia || isNaN(monto) || monto <= 0)
      e.montoSubsistencia = "Debe declarar un monto de subsistencia válido (Art. 50, DL3/2008)";
    if (!form.comprobanteSolvencia)
      e.comprobanteSolvencia = "Debe adjuntar el comprobante de solvencia";
    return e;
  }

  function validarPaso2(): Errors {
    const e: Errors = {};
    if (!form.antecedentePenal)
      e.antecedentePenal = "Debe adjuntar el certificado de antecedentes penales";
    return e;
  }

  // ─── Navegación ─────────────────────────────────────────────────────────────

  function avanzar() {
    let errs: Errors = {};
    if (step === 0) errs = validarPaso0();
    if (step === 1) errs = validarPaso1();
    if (step === 2) errs = validarPaso2();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setStep((s) => s + 1);
  }

  // ─── Envío ───────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const errs = validarPaso2();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("nombres", form.nombres);
      fd.append("apellidos", form.apellidos);
      fd.append("fecha_nacimiento", form.fechaNacimiento);
      fd.append("nacionalidad_codigo", form.nacionalidad);
      fd.append("numero_pasaporte", form.numeroPasaporte.toUpperCase());
      fd.append("vencimiento_pasaporte", form.vencimientoPasaporte);
      fd.append("categoria_migratoria", form.categoriaMigratoria);
      fd.append("monto_subsistencia", form.montoSubsistencia);
      if (form.correoElectronico.trim()) fd.append("correo_electronico", form.correoElectronico.trim().toLowerCase());
      if (form.comprobanteSolvencia) fd.append("comprobante_solvencia", form.comprobanteSolvencia);
      if (form.antecedentePenal) fd.append("antecedentes_penales", form.antecedentePenal);

      const res = await createApplication(fd);
      setConfirmacion({ ticket_number: res.ticket_number, categoria_migratoria: res.categoria_migratoria });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  }

  // ─── Pantalla de confirmación ────────────────────────────────────────────────

  if (confirmacion) {
    return (
      <Card className="mx-auto max-w-xl shadow-md">
        <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
          <div className="rounded-full bg-success/15 p-5">
            <Ticket className="h-10 w-10 text-success" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Solicitud recibida</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Su evaluación migratoria ha sido registrada exitosamente.
            </p>
          </div>
          <div className="w-full rounded-lg border bg-muted/40 px-6 py-5 text-left space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Número de ticket</p>
              <p className="mt-1 font-mono text-2xl font-bold text-institutional">
                #{confirmacion.ticket_number}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Categoría solicitada</p>
              <p className="mt-0.5 text-sm font-medium">{confirmacion.categoria_migratoria}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Estado inicial</p>
              <p className="mt-0.5 text-sm font-medium text-warning-foreground">PENDIENTE</p>
            </div>
          </div>
          <Alert className="border-institutional/20 bg-institutional/5 text-left">
            <AlertCircle className="h-4 w-4 text-institutional" />
            <AlertDescription className="text-sm">
              <strong>Guarde este número.</strong> Lo necesitará para consultar el estado de su trámite
              en la sección <em>"Mis Trámites"</em>.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // ─── Wizard ──────────────────────────────────────────────────────────────────

  return (
    <Card className="mx-auto max-w-3xl shadow-md">
      {/* Header con indicador de pasos */}
      <CardHeader className="border-b">
        <CardTitle className="font-serif">Wizard de Evaluación Migratoria</CardTitle>
        <div className="mt-4 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                i < step && "border-success bg-success text-success-foreground",
                i === step && "border-institutional bg-institutional text-gold",
                i > step && "border-border bg-background text-muted-foreground",
              )}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className="hidden flex-1 sm:block">
                <p className={cn("text-xs font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>
                  Paso {i + 1}
                </p>
                <p className={cn("text-[11px]", i === step ? "text-institutional" : "text-muted-foreground")}>
                  {label}
                </p>
              </div>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* ── Paso 0: Identidad y Pasaporte ── */}
        {step === 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FieldWrap label="Nombres" error={errors.nombres} required>
              <Input
                placeholder="María Isabel"
                value={form.nombres}
                onChange={(e) => setField("nombres", e.target.value)}
                className={cn(errors.nombres && "border-danger")}
              />
            </FieldWrap>

            <FieldWrap label="Apellidos" error={errors.apellidos} required>
              <Input
                placeholder="Fernández López"
                value={form.apellidos}
                onChange={(e) => setField("apellidos", e.target.value)}
                className={cn(errors.apellidos && "border-danger")}
              />
            </FieldWrap>

            <FieldWrap label="Fecha de nacimiento" error={errors.fechaNacimiento} required>
              <Input
                type="date"
                value={form.fechaNacimiento}
                onChange={(e) => setField("fechaNacimiento", e.target.value)}
                className={cn(errors.fechaNacimiento && "border-danger")}
              />
            </FieldWrap>

            <FieldWrap label="Nacionalidad" error={errors.nacionalidad} required>
              <Select value={form.nacionalidad} onValueChange={(v) => setField("nacionalidad", v)}>
                <SelectTrigger className={cn(errors.nacionalidad && "border-danger")}>
                  <SelectValue placeholder="Seleccione país" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {PAISES.map((p) => (
                    <SelectItem key={p.codigo} value={p.codigo}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrap>

            <FieldWrap label="N.º de Pasaporte" error={errors.numeroPasaporte} required>
              <Input
                placeholder="AB123456"
                className={cn("font-mono uppercase", errors.numeroPasaporte && "border-danger")}
                value={form.numeroPasaporte}
                onChange={(e) => setField("numeroPasaporte", e.target.value.replace(/\s/g, ""))}
              />
            </FieldWrap>

            <FieldWrap label="Fecha de vencimiento del pasaporte" error={errors.vencimientoPasaporte} required>
              <Input
                type="date"
                value={form.vencimientoPasaporte}
                onChange={(e) => setField("vencimientoPasaporte", e.target.value)}
                className={cn(errors.vencimientoPasaporte && "border-danger")}
              />
            </FieldWrap>

            <FieldWrap label="Categoría migratoria" error={errors.categoriaMigratoria} required className="md:col-span-2">
              <Select value={form.categoriaMigratoria} onValueChange={(v) => setField("categoriaMigratoria", v)}>
                <SelectTrigger className={cn(errors.categoriaMigratoria && "border-danger")}>
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrap>

            <FieldWrap label="Correo electrónico (opcional, recomendado)" error={errors.correoElectronico} className="md:col-span-2">
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.correoElectronico}
                onChange={(e) => setField("correoElectronico", e.target.value)}
                className={cn(errors.correoElectronico && "border-danger")}
              />
              <p className="text-[11px] text-muted-foreground">
                Recibirá notificaciones sobre el estado de su trámite.
              </p>
            </FieldWrap>
          </div>
        )}

        {/* ── Paso 1: Solvencia ── */}
        {step === 1 && (
          <div className="space-y-5">
            <Alert className="border-institutional/20 bg-institutional/5">
              <AlertCircle className="h-4 w-4 text-institutional" />
              <AlertTitle className="text-institutional">Requisito legal — Art. 50 Num. 1</AlertTitle>
              <AlertDescription>
                Debe acreditar medios económicos de subsistencia conforme al Decreto Ley 3/2008.
              </AlertDescription>
            </Alert>

            <FieldWrap label="Monto declarado (USD)" error={errors.montoSubsistencia} required>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                className={cn("font-mono", errors.montoSubsistencia && "border-danger")}
                value={form.montoSubsistencia}
                onChange={(e) => setField("montoSubsistencia", e.target.value)}
              />
            </FieldWrap>

            <FieldWrap label="Comprobante de solvencia (PDF, máx. 5MB)" error={errors.comprobanteSolvencia} required>
              <input
                ref={solvenciaRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile("comprobanteSolvencia", e.target.files?.[0])}
              />
              <DropZone
                file={form.comprobanteSolvencia}
                error={!!errors.comprobanteSolvencia}
                onClick={() => solvenciaRef.current?.click()}
              />
            </FieldWrap>
          </div>
        )}

        {/* ── Paso 2: Antecedentes Penales ── */}
        {step === 2 && (
          <div className="space-y-5">
            <Alert className="border-warning/30 bg-warning/10">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning-foreground">Requisito legal — Art. 50 Num. 4</AlertTitle>
              <AlertDescription className="text-foreground/80">
                El certificado debe estar apostillado y vigente (no mayor a 6 meses desde su emisión).
              </AlertDescription>
            </Alert>

            <FieldWrap label="Certificado de antecedentes penales (PDF, máx. 5MB)" error={errors.antecedentePenal} required>
              <input
                ref={antecedentesRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile("antecedentePenal", e.target.files?.[0])}
              />
              <DropZone
                file={form.antecedentePenal}
                error={!!errors.antecedentePenal}
                onClick={() => antecedentesRef.current?.click()}
              />
            </FieldWrap>

            {submitError && (
              <Alert className="border-danger/40 bg-danger/10">
                <AlertCircle className="h-4 w-4 text-danger" />
                <AlertDescription className="text-danger">{submitError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>

      {/* Footer con navegación */}
      <div className="flex items-center justify-between border-t bg-muted/30 px-6 py-4">
        <Button
          variant="outline"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            className="bg-institutional text-gold hover:bg-institutional-hover"
            onClick={avanzar}
          >
            Siguiente <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="bg-gold text-gold-foreground hover:bg-gold/90"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Someter Evaluación
          </Button>
        )}
      </div>
    </Card>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function FieldWrap({
  label, error, required, children, className,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-danger">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function DropZone({ file, error, onClick }: { file: File | null; error: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
        error
          ? "border-danger bg-danger/5 hover:bg-danger/10"
          : file
            ? "border-success bg-success/5 hover:bg-success/10"
            : "border-border bg-muted/30 hover:border-institutional hover:bg-institutional/5",
      )}
    >
      <div className={cn(
        "rounded-full p-3",
        file ? "bg-success/15" : "bg-institutional/10",
      )}>
        {file
          ? <FileCheck2 className="h-6 w-6 text-success" />
          : <UploadCloud className="h-6 w-6 text-institutional" />}
      </div>
      <div>
        {file ? (
          <>
            <p className="text-sm font-medium text-success">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB · Haga clic para cambiar
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">Haga clic para seleccionar</p>
            <p className="text-xs text-muted-foreground">Solo PDF · Máximo {MAX_FILE_MB} MB</p>
          </>
        )}
      </div>
    </button>
  );
}
