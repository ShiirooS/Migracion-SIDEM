import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/pool';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  const ip = req.ip ?? 'unknown';

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña son requeridos' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, email, password_hash, nombre_completo, rol
       FROM agentes
       WHERE email = $1 AND activo = TRUE`,
      [email]
    );

    const agente = result.rows[0];
    const valid = agente && (await bcrypt.compare(password, agente.password_hash));

    if (!valid) {
      await pool.query(
        `INSERT INTO audit_log (accion, detalles, ip_origen)
         VALUES ('LOGIN_FALLIDO', $1, $2)`,
        [JSON.stringify({ email }), ip]
      );
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = jwt.sign(
      { id: agente.id, email: agente.email, rol: agente.rol },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as jwt.SignOptions['expiresIn'] }
    );

    await pool.query(
      `INSERT INTO audit_log (accion, usuario_id, detalles, ip_origen)
       VALUES ('LOGIN_EXITOSO', $1, $2, $3)`,
      [agente.id, JSON.stringify({ rol: agente.rol }), ip]
    );

    res.json({ token, rol: agente.rol, nombre: agente.nombre_completo });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
