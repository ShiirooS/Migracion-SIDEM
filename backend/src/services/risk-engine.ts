import { supabase } from '../lib/supabase';
import { getControlLists } from './control-lists-cache';

export interface RiskResult {
  score: number;
  nivel: 'BAJO' | 'MEDIO' | 'ALTO';
  interpol_alerta_encontrada: boolean;
  interpol_alerta_tipo: string | null;
  interpol_alerta_detalle: string | null;
  ofac_alerta_encontrada: boolean;
  ofac_alerta_detalle: string | null;
  pais_restringido_encontrada: boolean;
}

// Minimal shape we need from a control_lists row
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
  let ofac_alerta_encontrada = false;
  let ofac_alerta_detalle: string | null = null;
  let pais_restringido_encontrada = false;

  const nombreCompleto = `${params.nombres} ${params.apellidos}`;

  // SCRUM-52: Use cached lists instead of direct Supabase queries.
  // The cache key is the tipo_lista string; each list type is fetched once per 6h.
  const [interpolRows, ofacRows, paisRows] = await Promise.all([
    getControlLists('INTERPOL_RED_NOTICE') as Promise<ControlListRow[]>,
    getControlLists('OFAC_SDN') as Promise<ControlListRow[]>,
    getControlLists('PAIS_RESTRINGIDO') as Promise<ControlListRow[]>,
  ]);

  // Verificar INTERPOL Red Notice por pasaporte exacto
  const interpolPasaporte = interpolRows.filter(
    (r) => r.numero_pasaporte === params.numero_pasaporte
  );

  if (interpolPasaporte.length > 0) {
    score += 50;
    interpol_alerta_encontrada = true;
    interpol_alerta_tipo = 'INTERPOL_RED_NOTICE';
    interpol_alerta_detalle = interpolPasaporte[0].descripcion_alerta ?? 'Red Notice encontrada';
  }

  // Verificar INTERPOL por nombre (fuzzy) via RPC — not cacheable as it's a full-text search
  if (!interpol_alerta_encontrada) {
    const { data: interpolNombre } = await supabase.rpc('buscar_interpol_nombre', {
      p_nombre: nombreCompleto,
    });

    if (interpolNombre && interpolNombre.length > 0) {
      score += 50;
      interpol_alerta_encontrada = true;
      interpol_alerta_tipo = 'INTERPOL_RED_NOTICE';
      interpol_alerta_detalle = interpolNombre[0].descripcion_alerta ?? 'Red Notice por nombre';
    }
  }

  // Verificar OFAC SDN por pasaporte
  // BUG FIX: antes la guarda if (!interpol_alerta_encontrada) descartaba silenciosamente
  // la alerta OFAC cuando INTERPOL ya había coincidido. Ahora se guardan siempre.
  const ofacMatch = ofacRows.filter((r) => r.numero_pasaporte === params.numero_pasaporte);
  if (ofacMatch.length > 0) {
    score += 40;
    ofac_alerta_encontrada = true;
    ofac_alerta_detalle = ofacMatch[0].descripcion_alerta ?? 'Lista SDN OFAC';
    // Rellenar campos legacy solo si INTERPOL no los ocupó (retrocompatibilidad)
    if (!interpol_alerta_encontrada) {
      interpol_alerta_encontrada = true;
      interpol_alerta_tipo = 'OFAC_SDN';
      interpol_alerta_detalle = ofac_alerta_detalle;
    }
  }

  // Verificar país restringido
  const paisMatch = paisRows.filter((r) => r.codigo_pais === params.nacionalidad_codigo);
  if (paisMatch.length > 0) {
    score += 10;
    pais_restringido_encontrada = true;
  }

  const nivel: 'BAJO' | 'MEDIO' | 'ALTO' =
    score >= 50 ? 'ALTO' : score >= 10 ? 'MEDIO' : 'BAJO';

  return {
    score,
    nivel,
    interpol_alerta_encontrada,
    interpol_alerta_tipo,
    interpol_alerta_detalle,
    ofac_alerta_encontrada,
    ofac_alerta_detalle,
    pais_restringido_encontrada,
  };
}
