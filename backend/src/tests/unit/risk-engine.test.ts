// SCRUM-50: Unit tests for risk-engine — all Supabase calls are mocked
// so these run fully offline without a DB connection.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mock setup --------------------------------------------------------
// We mock both the supabase client AND the cache so the risk-engine module
// can be imported without real env vars.

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('../../services/control-lists-cache', () => ({
  getControlLists: vi.fn(),
}));

import { supabase } from '../../lib/supabase';
import { getControlLists } from '../../services/control-lists-cache';
import { calcularRiesgo } from '../../services/risk-engine';

const mockGetControlLists = vi.mocked(getControlLists);
const mockRpc = vi.mocked(supabase.rpc);

const BASE_PARAMS = {
  nombres: 'Juan',
  apellidos: 'Pérez',
  numero_pasaporte: 'AB123456',
  nacionalidad_codigo: 'COL',
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no RPC name match
  mockRpc.mockResolvedValue({ data: [], error: null } as never);
});

// Helper to configure what each list type returns
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
    if (tipo === 'INTERPOL_RED_NOTICE') {
      return interpolByPassport
        ? [{ numero_pasaporte: BASE_PARAMS.numero_pasaporte, descripcion_alerta: 'Red Notice test' }]
        : [];
    }
    if (tipo === 'OFAC_SDN') {
      return ofac
        ? [{ numero_pasaporte: BASE_PARAMS.numero_pasaporte, descripcion_alerta: 'SDN match' }]
        : [];
    }
    if (tipo === 'PAIS_RESTRINGIDO') {
      return paisRestringido ? [{ codigo_pais: BASE_PARAMS.nacionalidad_codigo }] : [];
    }
    return [];
  });
}

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

  it('returns MEDIO with score 40 for OFAC SDN match', async () => {
    setupLists({ ofac: true });

    const result = await calcularRiesgo(BASE_PARAMS);

    expect(result.score).toBe(40);
    expect(result.nivel).toBe('MEDIO');
    expect(result.ofac_alerta_encontrada).toBe(true);
    expect(result.interpol_alerta_encontrada).toBe(false);
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

  it('returns ALTO with score 50 for INTERPOL name match via RPC (no passport match)', async () => {
    setupLists({});
    mockRpc.mockResolvedValue({
      data: [{ descripcion_alerta: 'Red Notice por nombre' }],
      error: null,
    } as never);

    const result = await calcularRiesgo(BASE_PARAMS);

    expect(result.score).toBe(50);
    expect(result.nivel).toBe('ALTO');
    expect(result.interpol_alerta_tipo).toBe('INTERPOL_RED_NOTICE');
    expect(result.interpol_alerta_detalle).toBe('Red Notice por nombre');
    // RPC should have been called with the full name
    expect(mockRpc).toHaveBeenCalledWith('buscar_interpol_nombre', {
      p_nombre: 'Juan Pérez',
    });
  });

  it('returns ALTO with score 100 when all checks hit (INTERPOL + OFAC + país restringido)', async () => {
    setupLists({ interpolByPassport: true, ofac: true, paisRestringido: true });

    const result = await calcularRiesgo(BASE_PARAMS);

    // 50 (INTERPOL) + 40 (OFAC) + 10 (pais) = 100
    expect(result.score).toBe(100);
    expect(result.nivel).toBe('ALTO');
    expect(result.interpol_alerta_encontrada).toBe(true);
    // INTERPOL takes priority in the alert type (found first)
    expect(result.interpol_alerta_tipo).toBe('INTERPOL_RED_NOTICE');
  });
});
