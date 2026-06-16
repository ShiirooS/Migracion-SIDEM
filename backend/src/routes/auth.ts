import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';
import { logAction } from '../services/audit';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticación de agentes/admins
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso, retorna JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Campos faltantes
 *       401:
 *         description: Credenciales inválidas
 */
// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  const ip = req.ip ?? 'unknown';

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son requeridos' });
    return;
  }

  try {
    const { data: agente, error } = await supabase
      .from('agentes')
      .select('id, email, password_hash, nombre_completo, rol')
      .eq('email', email)
      .eq('activo', true)
      .single();

    const valid = agente && !error && (await bcrypt.compare(password, agente.password_hash));

    if (!valid) {
      await logAction({ accion: 'LOGIN_FALLIDO', detalles: { email }, ip_origen: ip });
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = jwt.sign(
      { id: agente.id, email: agente.email, rol: agente.rol },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as jwt.SignOptions['expiresIn'] }
    );

    await logAction({
      accion: 'LOGIN_EXITOSO',
      usuario_id: agente.id,
      detalles: { rol: agente.rol },
      ip_origen: ip,
    });

    res.json({ token, rol: agente.rol, nombre: agente.nombre_completo });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
