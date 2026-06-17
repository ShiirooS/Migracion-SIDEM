import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/agentes — lista de agentes activos (solo ADMIN)
router.get('/', requireAuth('ADMIN'), async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('agentes')
    .select('id, nombre_completo, email, rol')
    .eq('activo', true)
    .order('nombre_completo');
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
