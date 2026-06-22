import path from 'path';
import fs from 'fs';
import type { Page } from '@playwright/test';

export const CREDENCIALES = {
  agente: {
    email: 'agente1@sidem-pan.gob.pa',
    password: 'Admin2026!',
  },
  admin: {
    email: 'admin@sidem-pan.gob.pa',
    password: 'Admin2026!',
  },
} as const;

export const SOLICITUD = {
  nombres: 'Juan Carlos',
  apellidos: 'Perez Lopez',
  fechaNacimiento: '1990-05-15',
  nacionalidad: 'Colombia',
  numeroPasaporte: 'AB123456',
  vencimientoPasaporte: '2030-12-31',
  categoriaMigratoria: 'Residencia temporal',
  correoElectronico: 'juan.perez@test.com',
  montoSubsistencia: '1500',
} as const;

const PDF_HEADER = '%PDF-1.4';
const MINIMAL_PDF = Buffer.from(
  `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 3 3]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF`,
  'ascii',
);

export function createTempPDF(name: string): string {
  const dir = path.join(__dirname, '.tmp');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, MINIMAL_PDF);
  return filePath;
}

export function cleanupTempFiles(): void {
  const dir = path.join(__dirname, '.tmp');
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((f) => fs.unlinkSync(path.join(dir, f)));
    fs.rmdirSync(dir);
  }
}

export async function loginAgente(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Acceso Institucional' }).click();
  await page.getByLabel('Correo institucional').fill(CREDENCIALES.agente.email);
  await page.getByLabel('Contraseña').fill(CREDENCIALES.agente.password);
  await page.getByRole('button', { name: 'Acceder al sistema' }).click();
  await page.waitForSelector('text=Cola de expedientes', { timeout: 10_000 });
}

export async function loginAdmin(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Acceso Institucional' }).click();
  await page.getByLabel('Correo institucional').fill(CREDENCIALES.admin.email);
  await page.getByLabel('Contraseña').fill(CREDENCIALES.admin.password);
  await page.getByRole('button', { name: 'Acceder al sistema' }).click();
  await page.waitForSelector('text=Cola de expedientes', { timeout: 10_000 });
}

export async function logout(page: Page): Promise<void> {
  const logoutBtn = page.getByRole('button', { name: /cerrar sesión|logout/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForSelector('text=Acceso al sistema', { timeout: 5_000 });
  }
}

export async function crearSolicitud(page: Page): Promise<string> {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Ciudadano Extranjero' }).click();
  await page.getByRole('button', { name: 'Iniciar solicitud de evaluación' }).click();

  await page.waitForSelector('text=Wizard de Evaluación Migratoria', { timeout: 10_000 });

  await page.getByLabel('Nombres').fill(SOLICITUD.nombres);
  await page.getByLabel('Apellidos').fill(SOLICITUD.apellidos);
  await page.getByLabel('Fecha de nacimiento').fill(SOLICITUD.fechaNacimiento);
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: SOLICITUD.nacionalidad }).click();
  await page.getByLabel('N.º de Pasaporte').fill(SOLICITUD.numeroPasaporte);
  await page.getByLabel('Fecha de vencimiento del pasaporte').fill(SOLICITUD.vencimientoPasaporte);
  await page.getByRole('combobox').last().click();
  await page.getByRole('option', { name: SOLICITUD.categoriaMigratoria }).click();
  await page.getByLabel('Correo electrónico').fill(SOLICITUD.correoElectronico);
  await page.getByRole('button', { name: 'Siguiente' }).click();

  await page.getByLabel('Monto declarado').fill(SOLICITUD.montoSubsistencia);
  const solvenciaPath = createTempPDF('solvencia.pdf');
  await page.locator('input[type="file"]').first().setInputFiles(solvenciaPath);
  await page.getByRole('button', { name: 'Siguiente' }).click();

  const antecedentesPath = createTempPDF('antecedentes.pdf');
  await page.locator('input[type="file"]').first().setInputFiles(antecedentesPath);
  await page.getByRole('button', { name: 'Someter Evaluación' }).click();

  await page.waitForSelector('text=Solicitud recibida', { timeout: 15_000 });
  const ticketText = await page.locator('.font-mono.text-2xl').textContent();
  const ticket = ticketText?.replace('#', '').trim() ?? '';
  return ticket;
}
