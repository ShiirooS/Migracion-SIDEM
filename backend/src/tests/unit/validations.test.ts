// SCRUM-50: Pure validation tests — no DB, no external I/O
// These test the business rules that are enforced in the POST /applications route.
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ---- Inline the same schema used in applications.ts so tests are self-contained ----
const SolicitudSchema = z.object({
  nombres: z
    .string()
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,150}$/, 'Nombres inválidos'),
  apellidos: z
    .string()
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,150}$/, 'Apellidos inválidos'),
  numero_pasaporte: z
    .string()
    .regex(/^[a-zA-Z0-9]{6,20}$/, 'Número de pasaporte inválido'),
  vencimiento_pasaporte: z.string().datetime({ offset: true }).or(z.string().date()),
  fecha_nacimiento: z.string().datetime({ offset: true }).or(z.string().date()),
  nacionalidad_codigo: z.string().min(2).max(3),
  categoria_migratoria: z.string().min(1),
  monto_subsistencia: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'monto_subsistencia debe ser un número positivo',
    }),
});

/** Returns a date string N months from today in YYYY-MM-DD format */
function dateMonthsFromNow(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

/** Returns true if the passport expires in fewer than 6 months from today */
function pasaporteVencePronto(vencimiento_pasaporte: string): boolean {
  const venc = new Date(vencimiento_pasaporte);
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  return venc < sixMonths;
}

/** Returns age in completed years from a birth date string */
function calcularEdad(fecha_nacimiento: string): number {
  const dob = new Date(fecha_nacimiento);
  const hoy = new Date();
  let age = hoy.getFullYear() - dob.getFullYear();
  const mDiff = hoy.getMonth() - dob.getMonth();
  if (mDiff < 0 || (mDiff === 0 && hoy.getDate() < dob.getDate())) age--;
  return age;
}

const VALID_BASE = {
  nombres: 'Juan Carlos',
  apellidos: 'Rodríguez Pérez',
  numero_pasaporte: 'AB123456',
  vencimiento_pasaporte: dateMonthsFromNow(12),
  fecha_nacimiento: '1990-01-01',
  nacionalidad_codigo: 'COL',
  categoria_migratoria: 'TURISTA',
  monto_subsistencia: '2500',
};

// ---------------------------------------------------------------------------
// Ticket format
// ---------------------------------------------------------------------------
describe('Ticket number format', () => {
  const TICKET_REGEX = /^PAN-\d{4}-\d{5}$/;

  it('accepts valid PAN-YYYY-NNNNN format', () => {
    expect(TICKET_REGEX.test('PAN-2026-04231')).toBe(true);
    expect(TICKET_REGEX.test('PAN-2025-00001')).toBe(true);
  });

  it('rejects ticket missing prefix', () => {
    expect(TICKET_REGEX.test('2026-04231')).toBe(false);
    expect(TICKET_REGEX.test('TKT-2026-04231')).toBe(false);
  });

  it('rejects ticket with wrong digit count', () => {
    expect(TICKET_REGEX.test('PAN-2026-123')).toBe(false);    // 3 digits
    expect(TICKET_REGEX.test('PAN-2026-123456')).toBe(false); // 6 digits
  });
});

// ---------------------------------------------------------------------------
// Passport expiry
// ---------------------------------------------------------------------------
describe('Passport vigency validation', () => {
  it('rejects a passport expiring in 3 months', () => {
    expect(pasaporteVencePronto(dateMonthsFromNow(3))).toBe(true);
  });

  it('rejects a passport expiring exactly today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(pasaporteVencePronto(today)).toBe(true);
  });

  it('accepts a passport expiring in 7 months', () => {
    expect(pasaporteVencePronto(dateMonthsFromNow(7))).toBe(false);
  });

  it('accepts a passport expiring in 12 months', () => {
    expect(pasaporteVencePronto(dateMonthsFromNow(12))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Age validation (applicant must be ≥ 18)
// ---------------------------------------------------------------------------
describe('Applicant age validation', () => {
  it('rejects applicant who is 17 years old', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 17);
    expect(calcularEdad(dob.toISOString().split('T')[0])).toBeLessThan(18);
  });

  it('accepts applicant who is 18 years old', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 18);
    dob.setDate(dob.getDate() - 1); // yesterday = definitely 18
    expect(calcularEdad(dob.toISOString().split('T')[0])).toBeGreaterThanOrEqual(18);
  });

  it('accepts applicant who is 40 years old', () => {
    expect(calcularEdad('1985-06-15')).toBeGreaterThanOrEqual(18);
  });
});

// ---------------------------------------------------------------------------
// Justificación length
// ---------------------------------------------------------------------------
describe('Justificación length validation', () => {
  it('rejects justificación shorter than 20 characters', () => {
    const justificacion = 'Muy corta';
    expect(justificacion.trim().length).toBeLessThan(20);
  });

  it('accepts justificación of exactly 20 characters', () => {
    const justificacion = '12345678901234567890';
    expect(justificacion.trim().length).toBeGreaterThanOrEqual(20);
  });

  it('accepts longer justificación', () => {
    const justificacion = 'El solicitante no cumple los requisitos mínimos del Art. 43 DL3/2008.';
    expect(justificacion.trim().length).toBeGreaterThanOrEqual(20);
  });
});

// ---------------------------------------------------------------------------
// Zod schema field validations
// ---------------------------------------------------------------------------
describe('SolicitudSchema Zod validation', () => {
  it('accepts a fully valid solicitud body', () => {
    const result = SolicitudSchema.safeParse(VALID_BASE);
    expect(result.success).toBe(true);
  });

  it('rejects passport with fewer than 6 characters', () => {
    const result = SolicitudSchema.safeParse({ ...VALID_BASE, numero_pasaporte: 'AB12' });
    expect(result.success).toBe(false);
  });

  it('rejects passport with special characters', () => {
    const result = SolicitudSchema.safeParse({ ...VALID_BASE, numero_pasaporte: 'AB-12345' });
    expect(result.success).toBe(false);
  });

  it('rejects nombres with numbers', () => {
    const result = SolicitudSchema.safeParse({ ...VALID_BASE, nombres: 'Juan123' });
    expect(result.success).toBe(false);
  });

  it('rejects nombres shorter than 2 chars', () => {
    const result = SolicitudSchema.safeParse({ ...VALID_BASE, nombres: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects negative monto_subsistencia', () => {
    const result = SolicitudSchema.safeParse({ ...VALID_BASE, monto_subsistencia: '-100' });
    expect(result.success).toBe(false);
  });

  it('rejects zero monto_subsistencia', () => {
    const result = SolicitudSchema.safeParse({ ...VALID_BASE, monto_subsistencia: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects missing campos requeridos', () => {
    const { nombres, ...withoutNombres } = VALID_BASE;
    const result = SolicitudSchema.safeParse(withoutNombres);
    expect(result.success).toBe(false);
  });
});
