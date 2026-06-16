import { supabase } from '../lib/supabase';
import { getControlLists } from './control-lists-cache';

export interface RiskResult {
  score: number;
  nivel: 'BAJO' | 'MEDIO' | 'ALTO';
  interpol_alerta_encontrada: boolean;
  interpol_alerta_tipo: string | null;
  interpol_alerta_detalle: string | null;
}

// Trigram similarity in TypeScript — equivalent to pg_trgm similarity()
function trigramSimilarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;

  const trigrams = (s: string): Set<string> => {
    const padded = `  ${s} `;
    const t = new Set<string>();
    for (let i = 0; i < padded.length - 2; i++) t.add(padded.slice(i, i + 3));
    return t;
  };

  const ta = trigrams(na);
  const tb = trigrams(nb);
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  return (2 * intersection) / (ta.size + tb.size);
}

interface ControlListRow {
  numero_pasaporte?: string | null;
  descripcion_alerta?: string | null;
  codigo_pais?: string | null;
  nombre_completo?: string | null;
}

export async function calcularRiesgo(params: {
  nombres: string;
  apellidos: string;
  numero_pasaporte: string;
  nacionalidad_codigo: string;
}): Promise<RiskResult> {
  let score = 0;
  let interpol_alerta_encontrada = false;
  let interpol_alerta_tipo: string | null = null;
  let interpol_alerta_detalle: string | null = null;

  const nombreCompleto = `${params.nombres} ${params.apellidos}`;

  // SCRUM-52: Use cached lists for exact-match lookups (avoids repeated full-table reads)
  const [interpolRows, ofacRows, paisRows] = await Promise.all([
    getControlLists('INTERPOL_RED_NOTICE') as Promise<ControlListRow[]>,
    getControlLists('OFAC_SDN') as Promise<ControlListRow[]>,
    getControlLists('PAIS_RESTRINGIDO') as Promise<ControlListRow[]>,
  ]);

  // Factor 1: INTERPOL Red Notice (50 pts) — exact passport match from cache
  const interpolPasaporte = interpolRows.filter(
    (r) => r.numero_pasaporte === params.numero_pasaporte
  );

  if (interpolPasaporte.length > 0) {
    score += 50;
    interpol_alerta_encontrada = true;
    interpol_alerta_tipo = 'INTERPOL_RED_NOTICE';
    interpol_alerta_detalle = interpolPasaporte[0].descripcion_alerta ?? 'Red Notice encontrada';
  }

  // Factor 1 fallback: fuzzy name match with trigram similarity
  if (!interpol_alerta_encontrada) {
    const { data: interpolRecords } = await supabase
      .from('control_lists')
      .select('nombre_completo, descripcion_alerta')
      .eq('tipo_lista', 'INTERPOL_RED_NOTICE')
      .eq('activo', true)
      .not('nombre_completo', 'is', null);

    if (interpolRecords) {
      let bestMatch: { descripcion_alerta: string | null; similitud: number } | null = null;
      for (const record of interpolRecords) {
        if (!record.nombre_completo) continue;
        const sim = trigramSimilarity(nombreCompleto, record.nombre_completo);
        if (sim > 0.7 && (!bestMatch || sim > bestMatch.similitud)) {
          bestMatch = { descripcion_alerta: record.descripcion_alerta, similitud: sim };
        }
      }
      if (bestMatch) {
        score += 50;
        interpol_alerta_encontrada = true;
        interpol_alerta_tipo = 'INTERPOL_RED_NOTICE';
        interpol_alerta_detalle = bestMatch.descripcion_alerta ?? 'Red Notice por nombre';
      }
    }
  }

  // Factor 2: OFAC SDN (40 pts) — exact passport match from cache
  const ofacMatch = ofacRows.filter((r) => r.numero_pasaporte === params.numero_pasaporte);
  if (ofacMatch.length > 0) {
    score += 40;
    if (!interpol_alerta_encontrada) {
      interpol_alerta_encontrada = true;
      interpol_alerta_tipo = 'OFAC_SDN';
      interpol_alerta_detalle = ofacMatch[0].descripcion_alerta ?? 'Lista SDN OFAC';
    }
  } else {
    // OFAC fallback: fuzzy name match
    const { data: ofacRecords } = await supabase
      .from('control_lists')
      .select('nombre_completo, descripcion_alerta')
      .eq('tipo_lista', 'OFAC_SDN')
      .eq('activo', true)
      .not('nombre_completo', 'is', null);

    if (ofacRecords) {
      for (const record of ofacRecords) {
        if (!record.nombre_completo) continue;
        const sim = trigramSimilarity(nombreCompleto, record.nombre_completo);
        if (sim > 0.7) {
          score += 40;
          if (!interpol_alerta_encontrada) {
            interpol_alerta_encontrada = true;
            interpol_alerta_tipo = 'OFAC_SDN';
            interpol_alerta_detalle = record.descripcion_alerta ?? 'Lista SDN OFAC por nombre';
          }
          break;
        }
      }
    }
  }

  // Factor 3: Pais restringido (10 pts) — from cache
  const paisMatch = paisRows.filter((r) => r.codigo_pais === params.nacionalidad_codigo);
  if (paisMatch.length > 0) {
    score += 10;
  }

  const nivel: 'BAJO' | 'MEDIO' | 'ALTO' =
    score >= 50 ? 'ALTO' : score >= 10 ? 'MEDIO' : 'BAJO';

  return { score, nivel, interpol_alerta_encontrada, interpol_alerta_tipo, interpol_alerta_detalle };
}
