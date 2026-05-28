import type { InterpolPerson } from '../types/risk.types';

export const interpolPersonMock: InterpolPerson = {
  id: 'int_001',
  nombre: 'Carlos Alvarez',
  numero_pasaporte: 'PA1234567',
  nacionalidad: 'CO',
  alerta_tipo: 'INTERPOL_RED_NOTICE',
  alerta_detalle: 'Red Notice activa por fraude internacional',
};

export const interpolMock: InterpolPerson[] = [interpolPersonMock];
