import type { UserRole } from './auth.types';

export type AuditAction =
  | 'EXPEDIENTE_CREADO'
  | 'SCORING_CALCULADO'
  | 'EXPEDIENTE_ABIERTO'
  | 'DICTAMEN_EMITIDO'
  | 'DICTAMEN_RECHAZADO'
  | 'LOGIN_EXITOSO'
  | 'LOGIN_FALLIDO'
  | 'CONSULTA_ESTADO';

export interface AuditUser {
  id: string;
  nombre: string;
  rol: UserRole;
}

export interface AuditLog {
  id: string;
  accion: AuditAction;
  usuario: AuditUser | null;
  timestamp: string;
  detalle: string;
}

export interface AuditLogsResponse {
  items: AuditLog[];
}
