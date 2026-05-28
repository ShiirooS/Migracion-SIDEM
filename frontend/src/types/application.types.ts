import type { RiskLevel } from './risk.types';

export type ApplicationStatus =
  | 'PENDIENTE'
  | 'EN_REVISION'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'SUBSANACION_PENDIENTE';

export interface DocumentoAdjunto {
  id: string;
  tipo: 'PASAPORTE' | 'SOLVENCIA' | 'ANTECEDENTES';
  nombre: string;
  url: string;
  size: number;
}

export interface Expediente {
  id: string;
  ticket_number: string;
  nombres: string;
  apellidos: string;
  nacionalidad: string;
  numero_pasaporte: string;
  categoria_migratoria: 'TURISMO' | 'RESIDENCIA_TEMPORAL' | 'RESIDENCIA_PERMANENTE' | 'TRABAJO' | 'ESTUDIO';
  fecha_registro: string;
  score_riesgo: number;
  nivel_riesgo: RiskLevel;
  estado: ApplicationStatus;
  interpol_alerta_encontrada: boolean;
  interpol_alerta_tipo: 'INTERPOL_RED_NOTICE' | null;
  interpol_alerta_detalle: string | null;
  documentos: DocumentoAdjunto[];
}

export interface ApplicationsResponse {
  items: Expediente[];
}

export interface ApplicationResponse {
  item: Expediente;
}
