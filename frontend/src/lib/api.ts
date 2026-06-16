const BASE = import.meta.env.VITE_API_URL ?? "/api";

function getToken(): string | null {
  return localStorage.getItem("sidem_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.error ?? "Error del servidor");
  }
  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  rol: "AGENTE" | "ADMIN";
  nombre: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  localStorage.removeItem("sidem_token");
  localStorage.removeItem("sidem_user");
}

export function saveSession(data: LoginResponse) {
  localStorage.setItem("sidem_token", data.token);
  localStorage.setItem("sidem_user", JSON.stringify({ rol: data.rol, nombre: data.nombre }));
}

export function getSession(): { rol: "AGENTE" | "ADMIN"; nombre: string } | null {
  const raw = localStorage.getItem("sidem_user");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem("sidem_user");
    localStorage.removeItem("sidem_token");
    return null;
  }
}

// ─── Applications ─────────────────────────────────────────────────────────────

export interface Application {
  id: string;
  ticket_number: string;
  nombres: string;
  apellidos: string;
  nacionalidad_codigo: string;
  categoria_migratoria: string;
  estado: string;
  nivel_riesgo: "BAJO" | "MEDIO" | "ALTO" | null;
  score_riesgo: number | null;
  interpol_alerta_encontrada: boolean;
  interpol_alerta_tipo: string | null;
  interpol_alerta_detalle: string | null;
  created_at: string;
  numero_pasaporte: string;
  fecha_nacimiento: string;
  vencimiento_pasaporte: string;
  monto_subsistencia: string;
}

export interface ApplicationDetail extends Application {
  url_solvencia: string | null;
  url_antecedentes: string | null;
  razon_subsanacion: string | null;
  fecha_subsanacion_solicitada: string | null;
}

export async function getApplications(params?: { estado?: string }): Promise<Application[]> {
  const qs = params?.estado ? `?estado=${params.estado}` : "";
  return request<Application[]>(`/applications${qs}`);
}

export async function getApplication(id: string): Promise<Application> {
  return request<Application>(`/applications/${id}`);
}

export async function createApplication(formData: FormData): Promise<{ ticket_number: string; estado: string; categoria_migratoria: string }> {
  return request("/applications", {
    method: "POST",
    body: formData,
  });
}

export async function getApplicationStatus(pasaporte: string, ticket: string): Promise<StatusResult> {
  return request<StatusResult>(`/applications/status?pasaporte=${encodeURIComponent(pasaporte)}&ticket=${encodeURIComponent(ticket)}`);
}

// ─── Verdicts ─────────────────────────────────────────────────────────────────

export async function submitVerdict(
  applicationId: string,
  data: { decision: "APROBADO" | "RECHAZADO"; articulo_citado: string; justificacion: string },
) {
  return request(`/applications/${applicationId}/verdict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export async function getAuditLog(params?: { fecha_desde?: string; fecha_hasta?: string; agente_id?: string; expediente_id?: string }) {
  const clean = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== ""),
  );
  const qs = new URLSearchParams(clean as Record<string, string>).toString();
  return request(`/audit-log${qs ? "?" + qs : ""}`);
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface Metrics {
  total: number;
  hoy: number;
  pendientes: number;
  en_evaluacion: number;
  resueltas: number;
  aprobados: number;
  rechazados: number;
  por_estado: Record<string, number>;
  por_riesgo: Record<string, number>;
  por_categoria: Record<string, number>;
}

export async function getMetrics(): Promise<Metrics> {
  return request<Metrics>("/metrics");
}

// ─── Subsanación (RF07) ─────────────────────────────────────────────────────

export interface StatusResult {
  id: string;
  ticket_number: string;
  estado: string;
  nivel_riesgo: string | null;
  categoria_migratoria: string;
  created_at: string;
  razon_subsanacion: string | null;
  fecha_subsanacion_solicitada: string | null;
}

export async function requestSubsanacion(applicationId: string, razon: string): Promise<{ ok: boolean; estado: string }> {
  return request(`/applications/${applicationId}/request-subsanacion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ razon }),
  });
}

export async function subsanarDocumentos(applicationId: string, data: {
  ticket_number: string;
  numero_pasaporte: string;
  comprobante_solvencia?: File;
  antecedentes_penales?: File;
}): Promise<{ ok: boolean; ticket_number: string; estado: string }> {
  const fd = new FormData();
  fd.append("ticket_number", data.ticket_number);
  fd.append("numero_pasaporte", data.numero_pasaporte);
  if (data.comprobante_solvencia) fd.append("comprobante_solvencia", data.comprobante_solvencia);
  if (data.antecedentes_penales) fd.append("antecedentes_penales", data.antecedentes_penales);
  return request(`/applications/${applicationId}/subsanar`, {
    method: "POST",
    body: fd,
  });
}
