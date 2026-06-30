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
  id: string;
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
  localStorage.setItem("sidem_user", JSON.stringify({ rol: data.rol, nombre: data.nombre, id: data.id }));
}

export function getSession(): { rol: "AGENTE" | "ADMIN"; nombre: string; id: string } | null {
  const raw = localStorage.getItem("sidem_user");
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!parsed.id) return null;
  return parsed;
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
  ofac_alerta_encontrada: boolean;
  ofac_alerta_detalle: string | null;
  pais_restringido_encontrada: boolean;
  created_at: string;
  numero_pasaporte: string;
  fecha_nacimiento: string;
  vencimiento_pasaporte: string;
  monto_subsistencia: string;
  agente_asignado_id: string | null;
}

export async function getApplications(params?: { estado?: string; agente_id?: string; grupo?: "ACTIVOS" | "RESUELTOS" }): Promise<Application[]> {
  const qs = new URLSearchParams();
  if (params?.estado) qs.set("estado", params.estado);
  if (params?.agente_id) qs.set("agente_id", params.agente_id);
  if (params?.grupo) qs.set("grupo", params.grupo);
  const q = qs.toString() ? `?${qs}` : "";
  const res = await request<{ data: Application[]; nextCursor: string | null }>(`/applications${q}`);
  return res.data;
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

export async function getApplicationStatus(pasaporte: string, ticket: string) {
  return request(`/applications/status?pasaporte=${encodeURIComponent(pasaporte)}&ticket=${encodeURIComponent(ticket)}`);
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

// ─── Subsanación (RF07) ───────────────────────────────────────────────────────

export async function requestSubsanacion(applicationId: string, motivo: string) {
  return request(`/applications/${applicationId}/subsanacion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo }),
  });
}

export async function uploadCorrection(
  applicationId: string,
  data: { ticket_number: string; numero_pasaporte: string; tipo_documento: "solvencia" | "antecedentes"; file: File },
) {
  const formData = new FormData();
  formData.append("ticket_number", data.ticket_number);
  formData.append("numero_pasaporte", data.numero_pasaporte);
  formData.append("tipo_documento", data.tipo_documento);
  formData.append("documento", data.file);

  const res = await fetch(`${BASE}/applications/${applicationId}/upload-correction`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.error ?? "Error del servidor");
  }
  return res.json();
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export async function getAuditLog(params?: { fecha_desde?: string; fecha_hasta?: string; agente_id?: string; expediente_id?: string }) {
  const clean = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== ""),
  );
  const qs = new URLSearchParams(clean as Record<string, string>).toString();
  return request(`/audit-log${qs ? "?" + qs : ""}`);
}

// ─── Agentes ─────────────────────────────────────────────────────────────────

export interface Agente {
  id: string;
  nombre_completo: string;
  email: string;
  rol: "AGENTE" | "ADMIN";
}

export async function getAgentes(): Promise<Agente[]> {
  return request<Agente[]>("/agentes");
}

export async function assignAgent(applicationId: string, agente_id: string) {
  return request(`/applications/${applicationId}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agente_id }),
  });
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
