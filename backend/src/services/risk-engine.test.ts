import { describe, it, expect, beforeEach, vi } from 'vitest';

// Estado mutable que controla las respuestas simuladas por tipo de lista.
const state = vi.hoisted(() => ({
  control: {} as Record<string, Array<Record<string, unknown>>>,
  rpc: [] as Array<{ descripcion_alerta?: string }>,
}));

// Mock del módulo de caché de listas de control (SCRUM-52).
vi.mock('./control-lists-cache', () => ({
  getControlLists: vi.fn((tipo: string) => Promise.resolve(state.control[tipo] ?? [])),
}));

// Mock del cliente Supabase — sólo necesario para el RPC de búsqueda por nombre.
vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: () => Promise.resolve({ data: state.rpc }),
  },
}));

import { calcularRiesgo } from './risk-engine';

const persona = {
  nombres: 'Juan',
  apellidos: 'Perez',
  numero_pasaporte: 'AB123456',
  nacionalidad_codigo: 'CO',
};

describe('calcularRiesgo — motor de scoring (RF04)', () => {
  beforeEach(() => {
    state.control = {};
    state.rpc = [];
  });

  it('sin coincidencias en listas → score 0 y nivel BAJO', async () => {
    const r = await calcularRiesgo(persona);
    expect(r.score).toBe(0);
    expect(r.nivel).toBe('BAJO');
    expect(r.interpol_alerta_encontrada).toBe(false);
  });

  it('INTERPOL Red Notice por pasaporte → +50 y nivel ALTO', async () => {
    state.control = {
      INTERPOL_RED_NOTICE: [{ numero_pasaporte: 'AB123456', descripcion_alerta: 'Red Notice activa' }],
    };
    const r = await calcularRiesgo(persona);
    expect(r.score).toBe(50);
    expect(r.nivel).toBe('ALTO');
    expect(r.interpol_alerta_encontrada).toBe(true);
    expect(r.interpol_alerta_tipo).toBe('INTERPOL_RED_NOTICE');
  });

  it('INTERPOL por nombre (fuzzy) cuando no hay match por pasaporte → +50 y ALTO', async () => {
    state.rpc = [{ descripcion_alerta: 'Coincidencia por nombre' }];
    const r = await calcularRiesgo(persona);
    expect(r.score).toBe(50);
    expect(r.nivel).toBe('ALTO');
    expect(r.interpol_alerta_encontrada).toBe(true);
  });

  it('país restringido únicamente → +10 y nivel MEDIO', async () => {
    state.control = { PAIS_RESTRINGIDO: [{ codigo_pais: 'CO' }] };
    const r = await calcularRiesgo(persona);
    expect(r.score).toBe(10);
    expect(r.nivel).toBe('MEDIO');
    expect(r.interpol_alerta_encontrada).toBe(false);
  });

  it('OFAC SDN únicamente → +40 (documenta que un hit de sanciones cae en MEDIO, no ALTO)', async () => {
    state.control = {
      OFAC_SDN: [{ numero_pasaporte: 'AB123456', descripcion_alerta: 'Lista SDN' }],
    };
    const r = await calcularRiesgo(persona);
    expect(r.score).toBe(40);
    expect(r.nivel).toBe('MEDIO');
    expect(r.interpol_alerta_tipo).toBe('OFAC_SDN');
  });

  it('INTERPOL + país restringido → suma acumulada 60 y nivel ALTO', async () => {
    state.control = {
      INTERPOL_RED_NOTICE: [{ numero_pasaporte: 'AB123456', descripcion_alerta: 'Red Notice' }],
      PAIS_RESTRINGIDO: [{ codigo_pais: 'CO' }],
    };
    const r = await calcularRiesgo(persona);
    expect(r.score).toBe(60);
    expect(r.nivel).toBe('ALTO');
  });
});
