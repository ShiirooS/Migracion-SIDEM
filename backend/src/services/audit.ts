import { supabase } from '../lib/supabase';

export async function logAction(params: {
  accion: string;
  usuario_id?: string;
  expediente_id?: string;
  detalles?: Record<string, unknown>;
  ip_origen?: string;
}): Promise<void> {
  const { error } = await supabase.from('audit_log').insert({
    accion: params.accion,
    usuario_id: params.usuario_id ?? null,
    expediente_id: params.expediente_id ?? null,
    detalles: params.detalles ?? null,
    ip_origen: params.ip_origen ?? null,
  });

  if (error) {
    console.error('audit logAction error:', error.message);
  }
}
