import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/audit-log — SCRUM-39/RF10 (admin only)
router.get('/', requireAuth('ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { fecha_desde, fecha_hasta, agente_id, expediente_id } = req.query as Record<string, string>;

  let query = supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (fecha_desde) query = query.gte('created_at', fecha_desde);
  if (fecha_hasta) query = query.lte('created_at', fecha_hasta);
  if (agente_id)   query = query.eq('usuario_id', agente_id);
  if (expediente_id) query = query.eq('expediente_id', expediente_id);

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

export default router;
