import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: string;
  email: string;
  rol: 'AGENTE' | 'ADMIN';
}

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(...roles: Array<'AGENTE' | 'ADMIN'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const token = authHeader.slice(7);

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        res.status(500).json({ error: 'Servidor mal configurado' });
        return;
      }
      const payload = jwt.verify(token, secret) as JwtPayload;

      if (roles.length > 0 && !roles.includes(payload.rol)) {
        res.status(403).json({ error: 'No tienes permisos para esta acción' });
        return;
      }

      req.user = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
}
