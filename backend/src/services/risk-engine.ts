import { supabase } from '../lib/supabase';

export interface RiskResult {
  score: number;
  nivel: 'BAJO' | 'MEDIO' | 'ALTO';
  interpol_alerta_encontrada: boolean;
  interpol_alerta_tipo: string | null;
  interpol_alerta_detalle: string | null;
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

  // Verificar INTERPOL Red Notice por pasaporte exacto
  const { data: interpolPasaporte } = await supabase
    .from('control_lists')
    .select('*')
    .eq('tipo_lista', 'INTERPOL_RED_NOTICE')
    .eq('numero_pasaporte', params.numero_pasaporte)
    .eq('activo', true)
    .limit(1);

  if (interpolPasaporte && interpolPasaporte.length > 0) {
    score += 50;
    interpol_alerta_encontrada = true;
    interpol_alerta_tipo = 'INTERPOL_RED_NOTICE';
    interpol_alerta_detalle = interpolPasaporte[0].descripcion_alerta ?? 'Red Notice encontrada';
  }

  // Verificar INTERPOL por nombre (fuzzy) si no hubo match por pasaporte
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
  const { data: ofacPasaporte } = await supabase
    .from('control_lists')
    .select('*')
    .eq('tipo_lista', 'OFAC_SDN')
    .eq('numero_pasaporte', params.numero_pasaporte)
    .eq('activo', true)
    .limit(1);

  if (ofacPasaporte && ofacPasaporte.length > 0) {
    score += 40;
    if (!interpol_alerta_encontrada) {
      interpol_alerta_encontrada = true;
      interpol_alerta_tipo = 'OFAC_SDN';
      interpol_alerta_detalle = ofacPasaporte[0].descripcion_alerta ?? 'Lista SDN OFAC';
    }
  }

  // Verificar país restringido
  const { data: paisRestringido } = await supabase
    .from('control_lists')
    .select('*')
    .eq('tipo_lista', 'PAIS_RESTRINGIDO')
    .eq('codigo_pais', params.nacionalidad_codigo)
    .eq('activo', true)
    .limit(1);

  if (paisRestringido && paisRestringido.length > 0) {
    score += 10;
  }

  const nivel: 'BAJO' | 'MEDIO' | 'ALTO' =
    score >= 50 ? 'ALTO' : score >= 10 ? 'MEDIO' : 'BAJO';

  return {
    score,
    nivel,
    interpol_alerta_encontrada,
    interpol_alerta_tipo,
    interpol_alerta_detalle,
  };
}
