import type { AuditLog } from '../types/audit.types';
import { agenteMock } from './auth.mock';

export const logsMock: AuditLog[] = [
  {
    id: 'log_001',
    accion: 'EXPEDIENTE_CREADO',
    usuario: null,
    timestamp: '2026-05-20T15:10:02Z',
    detalle: 'Expediente PAN-2026-00042 creado',
  },
  {
    id: 'log_002',
    accion: 'SCORING_CALCULADO',
    usuario: null,
    timestamp: '2026-05-20T15:10:04Z',
    detalle: 'Score 60, nivel ALTO',
  },
  {
    id: 'log_003',
    accion: 'DICTAMEN_RECHAZADO',
    usuario: {
      id: agenteMock.id,
      nombre: agenteMock.nombre,
      rol: agenteMock.rol,
    },
    timestamp: '2026-05-20T16:30:00Z',
    detalle: 'Dictamen RECHAZADO Art. 50 Num. 4',
  },
];
