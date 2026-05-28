import type { RiskResult } from '../types/risk.types';

export const riesgoAltoMock: RiskResult = {
  score: 60,
  nivel: 'ALTO',
  factores: [
    {
      tipo: 'INTERPOL_RED_NOTICE',
      puntaje: 50,
      descripcion: 'Coincidencia con alerta INTERPOL Red Notice',
    },
    {
      tipo: 'PAIS_RESTRINGIDO',
      puntaje: 10,
      descripcion: 'Pais con atencion especial',
    },
  ],
  interpol_alerta_encontrada: true,
  interpol_alerta_tipo: 'INTERPOL_RED_NOTICE',
  interpol_alerta_detalle: 'Red Notice activa por fraude internacional',
};

export const riesgoMedioMock: RiskResult = {
  score: 40,
  nivel: 'MEDIO',
  factores: [
    {
      tipo: 'OFAC_SDN',
      puntaje: 40,
      descripcion: 'Coincidencia con lista OFAC SDN',
    },
  ],
  interpol_alerta_encontrada: false,
  interpol_alerta_tipo: null,
  interpol_alerta_detalle: null,
};

export const riesgoBajoMock: RiskResult = {
  score: 0,
  nivel: 'BAJO',
  factores: [],
  interpol_alerta_encontrada: false,
  interpol_alerta_tipo: null,
  interpol_alerta_detalle: null,
};
