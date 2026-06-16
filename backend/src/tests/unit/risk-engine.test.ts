// SCRUM-50: Unit tests for risk-engine — all Supabase calls are mocked
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Chainable mock builder for supabase queries
function makeChain(resolve: () => { data: unknown[] }) {
  const b: Record<string, unknown> = {
    select: () => b,
    eq: () => b,
    not: () => Promise.resolve(resolve()),
    limit: () => Promise.resolve(resolve()),
  };
  return b;
}

// Mutable state for what direct Supabase queries return (fuzzy name fallback)
let mockInterpolNameRows: { nombre_completo: string; descripcion_alerta: string }[] = [];
let mockOfacNameRows: { nombre_completo: string; descripcion_alerta: string }[] = [];

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'control_lists') {
        // For fuzzy name queries we need different data per tipo_lista.
        // We track the last eq() call to decide which rows to return.
        let tipoLista = '';
        const b: Record<string, unknown> = {
          select: () => b,
          eq: (_col: string, val: string) => {
            if (val === 'INTERPOL_RED_NOTICE' || val === 'OFAC_SDN') tipoLista = val;
            return b;
          },
          not: () =>
            Promise.resolve({
              data:
                tipoLista === 'INTERPOL_RED_NOTICE'
                  ? mockInterpolNameRows
                  : tipoLista === 'OFAC_SDN'
                    ? mockOfacNameRows
                    : [],
            }),
          limit: () => Promise.resolve({ data: [] }),
        };
        return b;
      }
      return makeChain(() => ({ data: [] }));
    }),
  },
}));

vi.mock('../../services/control-lists-cache', () => ({
  getControlLists: vi.fn(),
}));

import { getControlLists } from '../../services/control-lists-cache';
import { calcularRiesgo } from '../../services/risk-engine';

const mockGetControlLists = vi.mocked(getControlLists);

const BASE_PARAMS = {
  nombres: 'Juan',
  apellidos: 'Perez',
  numero_pasaporte: 'AB123456',
  nacionalidad_codigo: 'COL',
};

function setupLists({
  interpolByPassport = false,
  ofac = false,
  paisRestringido = false,
}: {
  interpolByPassport?: boolean;
  ofac?: boolean;
  paisRestringido?: boolean;
}) {
  mockGetControlLists.mockImplementation(async (tipo?: string) => {
    if (tipo === 'INTERPOL_RED_NOTICE')
      return interpolByPassport
        ? [{ numero_pasaporte: BASE_PARAMS.numero_pasaporte, descripcion_alerta: 'Red Notice test' }]
        : [];
    if (tipo === 'OFAC_SDN')
      return ofac
        ? [{ numero_pasaporte: BASE_PARAMS.numero_pasaporte, descripcion_alerta: 'SDN match' }]
        : [];
    if (tipo === 'PAIS_RESTRINGIDO')
      return paisRestringido ? [{ codigo_pais: BASE_PARAMS.nacionalidad_codigo }] : [];
    return [];
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockInterpolNameRows = [];
  mockOfacNameRows = [];
});

describe('calcularRiesgo', () => {
  it('returns BAJO with score 0 when no alerts found', async () => {
    setupLists({});
    const result = await calcularRiesgo(BASE_PARAMS);
    expect(result.score).toBe(0);
    expect(result.nivel).toBe('BAJO');
    expect(result.interpol_alerta_encontrada).toBe(false);
    expect(result.interpol_alerta_tipo).toBeNull();
  });

  it('returns MEDIO with score 10 for restricted country only', async () => {
    setupLists({ paisRestringido: true });
    const result = await calcularRiesgo(BASE_PARAMS);
    expect(result.score).toBe(10);
    expect(result.nivel).toBe('MEDIO');
    expect(result.interpol_alerta_encontrada).toBe(false);
  });

  it('returns MEDIO with score 40 for OFAC SDN passport match', async () => {
    setupLists({ ofac: true });
    const result = await calcularRiesgo(BASE_PARAMS);
    expect(result.score).toBe(40);
    expect(result.nivel).toBe('MEDIO');
    expect(result.interpol_alerta_encontrada).toBe(true);
    expect(result.interpol_alerta_tipo).toBe('OFAC_SDN');
  });

  it('returns ALTO with score 50 for INTERPOL passport match', async () => {
    setupLists({ interpolByPassport: true });
    const result = await calcularRiesgo(BASE_PARAMS);
    expect(result.score).toBe(50);
    expect(result.nivel).toBe('ALTO');
    expect(result.interpol_alerta_encontrada).toBe(true);
    expect(result.interpol_alerta_tipo).toBe('INTERPOL_RED_NOTICE');
    expect(result.interpol_alerta_detalle).toBe('Red Notice test');
  });

  it('returns ALTO with score 50 for INTERPOL name match via trigram (no passport match)', async () => {
    setupLists({});
    // Inject a record whose name is identical to BASE_PARAMS -> similarity = 1.0 > 0.7
    mockInterpolNameRows = [
      { nombre_completo: 'Juan Perez', descripcion_alerta: 'Red Notice por nombre' },
    ];

    const result = await calcularRiesgo(BASE_PARAMS);

    expect(result.score).toBe(50);
    expect(result.nivel).toBe('ALTO');
    expect(result.interpol_alerta_tipo).toBe('INTERPOL_RED_NOTICE');
    expect(result.interpol_alerta_detalle).toBe('Red Notice por nombre');
  });

  it('returns ALTO with score 100 when all checks hit (INTERPOL + OFAC + pais restringido)', async () => {
    setupLists({ interpolByPassport: true, ofac: true, paisRestringido: true });
    const result = await calcularRiesgo(BASE_PARAMS);
    expect(result.score).toBe(100);
    expect(result.nivel).toBe('ALTO');
    expect(result.interpol_alerta_encontrada).toBe(true);
    expect(result.interpol_alerta_tipo).toBe('INTERPOL_RED_NOTICE');
  });
});
