import type { User } from '../types/auth.types';

export const agenteMock: User = {
  id: 'usr_agente_001',
  nombre: 'Ana Torres',
  email: 'agente@sidem.local',
  rol: 'AGENTE',
  token: 'token_agente_mock',
};

export const adminMock: User = {
  id: 'usr_admin_001',
  nombre: 'Luis Mendoza',
  email: 'admin@sidem.local',
  rol: 'ADMIN',
  token: 'token_admin_mock',
};

export const authUsersMock: User[] = [agenteMock, adminMock];
