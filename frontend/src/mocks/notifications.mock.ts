import type { Notification } from '../types/notification.types';

export const notificationsMock: Notification[] = [
  {
    id: 'notif_001',
    tipo: 'INFO',
    titulo: 'Solicitud recibida',
    mensaje: 'Tu expediente fue registrado con exito.',
    leido: false,
    timestamp: '2026-05-20T15:10:05Z',
  },
  {
    id: 'notif_002',
    tipo: 'WARN',
    titulo: 'Revision pendiente',
    mensaje: 'Tu solicitud sigue en evaluacion.',
    leido: true,
    timestamp: '2026-05-21T09:00:00Z',
  },
];
