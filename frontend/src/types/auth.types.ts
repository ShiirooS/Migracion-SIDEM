export type UserRole = 'SOLICITANTE' | 'AGENTE' | 'ADMIN';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  token: string;
}

export interface LoginRequest {
  email: string;
}

export interface LoginResponse {
  user: User;
}
