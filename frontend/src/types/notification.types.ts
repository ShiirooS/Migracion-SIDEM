export type NotificationType = 'INFO' | 'WARN' | 'ERROR';

export interface Notification {
  id: string;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  leido: boolean;
  timestamp: string;
}
