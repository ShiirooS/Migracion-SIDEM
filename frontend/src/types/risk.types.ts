export type RiskLevel = 'BAJO' | 'MEDIO' | 'ALTO';

export type RiskFactorType = 'INTERPOL_RED_NOTICE' | 'OFAC_SDN' | 'PAIS_RESTRINGIDO';

export interface RiskFactor {
  tipo: RiskFactorType;
  puntaje: number;
  descripcion: string;
}

export interface RiskResult {
  score: number;
  nivel: RiskLevel;
  factores: RiskFactor[];
  interpol_alerta_encontrada: boolean;
  interpol_alerta_tipo: 'INTERPOL_RED_NOTICE' | null;
  interpol_alerta_detalle: string | null;
}

export interface InterpolPerson {
  id: string;
  nombre: string;
  numero_pasaporte: string;
  nacionalidad: string;
  alerta_tipo: 'INTERPOL_RED_NOTICE';
  alerta_detalle: string;
}
