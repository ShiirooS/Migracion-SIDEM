import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/metrics — SCRUM-40 (admin only)
router.get('/', requireAuth('ADMIN'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data: apps, error } = await supabase
      .from('applications')
      .select('estado, nivel_riesgo, created_at, categoria_migratoria');

    if (error) throw error;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const porEstado: Record<string, number> = {};
    const porRiesgo: Record<string, number> = {};
    const porCategoria: Record<string, number> = {};
    let hoyCount = 0;

    for (const app of apps ?? []) {
      porEstado[app.estado] = (porEstado[app.estado] ?? 0) + 1;
      const r = app.nivel_riesgo ?? 'SIN_SCORE';
      porRiesgo[r] = (porRiesgo[r] ?? 0) + 1;
      porCategoria[app.categoria_migratoria] = (porCategoria[app.categoria_migratoria] ?? 0) + 1;
      if (new Date(app.created_at) >= hoy) hoyCount++;
    }

    res.json({
      total: apps?.length ?? 0,
      hoy: hoyCount,
      pendientes: porEstado['PENDIENTE'] ?? 0,
      en_evaluacion: porEstado['EN_EVALUACION'] ?? 0,
      resueltas: (porEstado['APROBADO'] ?? 0) + (porEstado['RECHAZADO'] ?? 0),
      aprobados: porEstado['APROBADO'] ?? 0,
      rechazados: porEstado['RECHAZADO'] ?? 0,
      por_estado: porEstado,
      por_riesgo: porRiesgo,
      por_categoria: porCategoria,
    });
  } catch (err) {
    console.error('GET /metrics error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
