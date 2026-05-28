import type { LoginRequest, LoginResponse } from '../types/auth.types';
import type { ApplicationsResponse, ApplicationResponse } from '../types/application.types';
import type { AuditLogsResponse } from '../types/audit.types';
import { authUsersMock } from '../mocks/auth.mock';
import { applicationsMock } from '../mocks/applications.mock';
import { logsMock } from '../mocks/logs.mock';

const randomDelay = async (): Promise<void> => {
  const ms = 200 + Math.floor(Math.random() * 600);
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const shouldFail = (): boolean => Math.random() < 0.12;

const failIfNeeded = (): void => {
  if (shouldFail()) {
    throw new Error('Mock network error');
  }
};

export const login = async (email: LoginRequest['email']): Promise<LoginResponse> => {
  await randomDelay();
  failIfNeeded();
  const user = authUsersMock.find((u) => u.email === email);
  if (!user) {
    throw new Error('Credenciales invalidas');
  }
  return { user };
};

export const getApplications = async (): Promise<ApplicationsResponse> => {
  await randomDelay();
  failIfNeeded();
  return { items: applicationsMock };
};

export const getApplicationById = async (id: string): Promise<ApplicationResponse> => {
  await randomDelay();
  failIfNeeded();
  const item = applicationsMock.find((app) => app.id === id);
  if (!item) {
    throw new Error('Expediente no encontrado');
  }
  return { item };
};

export const getLogs = async (): Promise<AuditLogsResponse> => {
  await randomDelay();
  failIfNeeded();
  return { items: logsMock };
};
