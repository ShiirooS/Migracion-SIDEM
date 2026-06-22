import { test, expect } from '@playwright/test';
import {
  crearSolicitud,
  loginAgente,
  logout,
  createTempPDF,
  cleanupTempFiles,
  SOLICITUD,
} from './helpers';

let ticketNumber: string;

test.describe.serial('Flujo completo SIDEM-PAN', () => {
  test.afterAll(() => {
    cleanupTempFiles();
  });

  test('1. Ciudadano crea solicitud de evaluación', async ({ page }) => {
    ticketNumber = await crearSolicitud(page);

    expect(ticketNumber).toMatch(/^PAN-\d{4}-\d{5}$/);
    console.log(`Ticket generado: ${ticketNumber}`);
  });

  test('2. Agente hace login y ve cola de expedientes', async ({ page }) => {
    await loginAgente(page);

    await expect(page.getByText('Cola de expedientes')).toBeVisible();
    await expect(page.getByText(ticketNumber)).toBeVisible();
  });

  test('3. Agente abre detalle del expediente', async ({ page }) => {
    await loginAgente(page);

    const row = page.getByText(ticketNumber);
    await row.click();

    await expect(page.getByText(SOLICITUD.nombres)).toBeVisible();
    await expect(page.getByText(SOLICITUD.apellidos)).toBeVisible();
    await expect(page.getByText(SOLICITUD.numeroPasaporte)).toBeVisible();
  });

  test('4. Agente emite dictamen APROBADO', async ({ page }) => {
    await loginAgente(page);

    const row = page.getByText(ticketNumber);
    await row.click();

    await page.getByRole('combobox').filter({ hasText: /seleccionar/i }).first().click();
    await page.getByRole('option', { name: 'APROBADO' }).click();
    await page.getByLabel(/artículo/i).fill('Art. 50 Num. 1 DL3/2008');
    await page.getByLabel(/justificación/i).fill('Solicitante cumple con todos los requisitos de solvencia económica.');

    await page.getByRole('button', { name: /confirmar dictamen/i }).click();

    await expect(page.getByText('Dictamen emitido')).toBeVisible({ timeout: 10_000 });
  });

  test('5. Ciudadano consulta estado y verifica aprobación', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Ciudadano Extranjero' }).click();
    await page.getByRole('button', { name: 'Consultar estado de trámite' }).click();

    await page.getByLabel(/ticket/i).fill(ticketNumber);
    await page.getByLabel(/pasaporte/i).fill(SOLICITUD.numeroPasaporte);
    await page.getByRole('button', { name: /consultar/i }).click();

    await expect(page.getByText('APROBADO')).toBeVisible({ timeout: 10_000 });
  });
});
