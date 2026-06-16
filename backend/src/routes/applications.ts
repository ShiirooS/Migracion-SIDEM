import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';
import { calcularRiesgo } from '../services/risk-engine';
import { logAction } from '../services/audit';
import { encrypt, decrypt } from '../utils/crypto';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Per-IP failure counter for /status (3 fallos -> bloqueo 5 min)
const rateLimitMap = new Map<string, { count: number; blockedUntil: number }>();

function normalizeIp(ip: string): string {
  return ip.replace(/^::ffff:/, '');
}

function checkRateLimit(ip: string): { blocked: boolean; remainingMs?: number } {
  const key = normalizeIp(ip);
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (entry && now < entry.blockedUntil) {
    return { blocked: true, remainingMs: entry.blockedUntil - now };
  }
  return { blocked: false };
}

function recordFailedAttempt(ip: string): void {
  const key = normalizeIp(ip);
  const now = Date.now();
  const entry = rateLimitMap.get(key) ?? { count: 0, blockedUntil: 0 };
  if (entry.blockedUntil > 0 && now >= entry.blockedUntil) entry.count = 0;
  entry.count += 1;
  if (entry.count >= 3) {
    entry.blockedUntil = now + 5 * 60 * 1000;
    entry.count = 0;
  }
  rateLimitMap.set(key, entry);
}

function resetFailedAttempts(ip: string): void {
  rateLimitMap.delete(normalizeIp(ip));
}

// SCRUM-51: Zod schema for POST body validation
const SolicitudSchema = z.object({
  nombres: z
    .string()
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,150}$/, 'Nombres invalidos'),
  apellidos: z
    .string()
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,150}$/, 'Apellidos invalidos'),
  numero_pasaporte: z
    .string()
    .regex(/^[a-zA-Z0-9]{6,20}$/, 'Numero de pasaporte invalido (6-20 caracteres alfanumericos)'),
  vencimiento_pasaporte: z.string().datetime({ offset: true }).or(z.string().date()),
  fecha_nacimiento: z.string().datetime({ offset: true }).or(z.string().date()),
  nacionalidad_codigo: z.string().min(2).max(3),
  categoria_migratoria: z.string().min(1),
  monto_subsistencia: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'monto_subsistencia debe ser un numero positivo',
    }),
});

function generarTicket(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `PAN-${year}-${num}`;
}

function sanitizarNombre(filename: string): string {
  const base = filename.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function subirPDF(buffer: Buffer, filename: string): Promise<string> {
  const path = `uploads/${Date.now()}-${sanitizarNombre(filename)}`;
  const { error } = await supabase.storage.from('documents').upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (error) throw new Error(`Storage error: ${error.message}`);
  return path;
}

function decryptRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    nombres: typeof row.nombres === 'string' ? decrypt(row.nombres) : row.nombres,
    apellidos: typeof row.apellidos === 'string' ? decrypt(row.apellidos) : row.apellidos,
    numero_pasaporte:
      typeof row.numero_pasaporte === 'string' ? decrypt(row.numero_pasaporte) : row.numero_pasaporte,
    fecha_nacimiento:
      typeof row.fecha_nacimiento === 'string' ? decrypt(row.fecha_nacimiento) : row.fecha_nacimiento,
  };
}

// POST /api/applications — RF01 + RF02 + RF04 (publico)
router.post(
  '/',
  upload.fields([
    { name: 'comprobante_solvencia', maxCount: 1 },
    { name: 'antecedentes_penales', maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const ip = req.ip ?? 'unknown';
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    const parsed = SolicitudSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ error: 'Validacion fallida', detalles: parsed.error.flatten().fieldErrors });
      return;
    }

    const {
      nombres,
      apellidos,
      fecha_nacimiento,
      nacionalidad_codigo,
      numero_pasaporte,
      vencimiento_pasaporte,
      categoria_migratoria,
      monto_subsistencia,
    } = parsed.data;

    // RF02: Edad >= 18
    const nacimiento = new Date(fecha_nacimiento);
    const hoy = new Date();
    const edad =
      hoy.getFullYear() -
      nacimiento.getFullYear() -
      (hoy.getMonth() < nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())
        ? 1
        : 0);
    if (edad < 18) {
      res.status(422).json({ error: 'El solicitante debe ser mayor de edad' });
      return;
    }

    // CA-01: Pasaporte vigente minimo 6 meses (Art. 43 DL3/2008)
    const venc = new Date(vencimiento_pasaporte);
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    if (venc < sixMonths) {
      res.status(422).json({
        error: 'El pasaporte debe tener al menos 6 meses de vigencia (Art. 43, Decreto Ley 3 de 2008)',
        field: 'vencimiento_pasaporte',
      });
      return;
    }

    const solvenciaFile = files?.comprobante_solvencia?.[0];
    const antecedentesFile = files?.antecedentes_penales?.[0];
    if (!solvenciaFile || !antecedentesFile) {
      res.status(400).json({
        error: 'Se requieren ambos documentos PDF',
        fields: { comprobante_solvencia: !solvenciaFile, antecedentes_penales: !antecedentesFile },
      });
      return;
    }
    if (solvenciaFile.mimetype !== 'application/pdf' || antecedentesFile.mimetype !== 'application/pdf') {
      res.status(422).json({
        error: 'Los archivos deben ser PDF',
        fields: {
          comprobante_solvencia: solvenciaFile.mimetype !== 'application/pdf',
          antecedentes_penales: antecedentesFile.mimetype !== 'application/pdf',
        },
      });
      return;
    }

    try {
      const [rutaSolvencia, rutaAntecedentes] = await Promise.all([
        subirPDF(solvenciaFile.buffer, solvenciaFile.originalname),
        subirPDF(antecedentesFile.buffer, antecedentesFile.originalname),
      ]);

      const riesgo = await calcularRiesgo({ nombres, apellidos, numero_pasaporte, nacionalidad_codigo });

      // SCRUM-48: Encrypt PII before storing
      const encNombres = encrypt(nombres);
      const encApellidos = encrypt(apellidos);
      const encPasaporte = encrypt(numero_pasaporte);
      const encFechaNac = encrypt(fecha_nacimiento);

      let ticket_number = generarTicket();
      let intentos = 0;
      while (intentos < 5) {
        const { data: existing } = await supabase
          .from('applications')
          .select('id')
          .eq('ticket_number', ticket_number)
          .single();
        if (!existing) break;
        ticket_number = generarTicket();
        intentos++;
      }

      const { data: app, error } = await supabase
        .from('applications')
        .insert({
          ticket_number,
          nombres: encNombres,
          apellidos: encApellidos,
          fecha_nacimiento: encFechaNac,
          nacionalidad_codigo,
          numero_pasaporte: encPasaporte,
          vencimiento_pasaporte,
          categoria_migratoria,
          monto_subsistencia: parseFloat(monto_subsistencia),
          ruta_comprobante_solvencia: rutaSolvencia,
          ruta_antecedentes_penales: rutaAntecedentes,
          estado: 'PENDIENTE',
          nivel_riesgo: riesgo.nivel,
          score_riesgo: riesgo.score,
          interpol_alerta_encontrada: riesgo.interpol_alerta_encontrada,
          interpol_alerta_tipo: riesgo.interpol_alerta_tipo,
          interpol_alerta_detalle: riesgo.interpol_alerta_detalle,
        })
        .select()
        .single();

      if (error) throw error;

      await logAction({
        accion: 'EXPEDIENTE_CREADO',
        expediente_id: app.id,
        detalles: { ticket_number, nivel_riesgo: riesgo.nivel, score: riesgo.score },
        ip_origen: ip,
      });

      res.status(201).json({
        ticket_number: app.ticket_number,
        estado: app.estado,
        categoria_migratoria: app.categoria_migratoria,
      });
    } catch (err: unknown) {
      console.error('POST /applications error:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// GET /api/applications — SCRUM-36/52 (agente/admin) — cursor pagination
router.get('/', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { estado, agente_id, cursor, limit: limitStr } = req.query as {
    estado?: string;
    agente_id?: string;
    cursor?: string;
    limit?: string;
  };

  const limit = Math.min(parseInt(limitStr ?? '20', 10) || 20, 100);

  let query = supabase
    .from('applications')
    .select(
      'id,ticket_number,nombres,apellidos,nacionalidad_codigo,categoria_migratoria,estado,nivel_riesgo,score_riesgo,interpol_alerta_encontrada,interpol_alerta_tipo,interpol_alerta_detalle,created_at,numero_pasaporte,fecha_nacimiento,vencimiento_pasaporte,monto_subsistencia,agente_asignado_id'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (estado) query = query.eq('estado', estado);
  if (agente_id) query = query.eq('agente_asignado_id', agente_id);
  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const rows = (data ?? []).map(decryptRow);
  const nextCursor = rows.length === limit ? (rows[rows.length - 1].created_at as string) : null;

  res.json({ data: rows, nextCursor });
});

// GET /api/applications/status — SCRUM-38 (publico)
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  const { pasaporte, ticket } = req.query as { pasaporte?: string; ticket?: string };
  const ip = req.ip ?? 'unknown';

  if (!pasaporte || !ticket) {
    res.status(400).json({ error: 'Pasaporte y ticket son requeridos' });
    return;
  }

  const rl = checkRateLimit(ip);
  if (rl.blocked) {
    const mins = Math.ceil((rl.remainingMs ?? 0) / 60000);
    res.status(429).json({ error: `Demasiados intentos fallidos. Intente en ${mins} minuto(s).` });
    return;
  }

  // SCRUM-48: AES-GCM usa IV aleatorio — no podemos hacer .eq() en columna cifrada.
  // Buscamos por ticket_number (unico) y comparamos el descifrado en memoria.
  const { data, error } = await supabase
    .from('applications')
    .select(
      'ticket_number,estado,nivel_riesgo,categoria_migratoria,created_at,numero_pasaporte,dictamenes(articulo_citado)'
    )
    .eq('ticket_number', ticket)
    .single();

  if (error || !data) {
    recordFailedAttempt(ip);
    res.status(404).json({ error: 'Solicitud no encontrada' });
    return;
  }

  const pasaporteDecrypted = decrypt(data.numero_pasaporte as string);
  if (pasaporteDecrypted !== pasaporte) {
    recordFailedAttempt(ip);
    res.status(404).json({ error: 'Solicitud no encontrada' });
    return;
  }

  resetFailedAttempts(ip);
  const { numero_pasaporte: _omit, ...responseData } = data;
  res.json(responseData);
});

// GET /api/applications/:id — SCRUM-37 (agente/admin)
router.get('/:id', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabase.from('applications').select('*').eq('id', id).single();

  if (error || !data) {
    res.status(404).json({ error: 'Expediente no encontrado' });
    return;
  }

  // RF06: Auto-transicion PENDIENTE -> EN_EVALUACION al abrir expediente asignado
  if (data.estado === 'PENDIENTE' && data.agente_asignado_id) {
    await supabase.from('applications').update({ estado: 'EN_EVALUACION' }).eq('id', id);
    data.estado = 'EN_EVALUACION';
    await logAction({
      accion: 'EXPEDIENTE_ABIERTO',
      usuario_id: req.user!.id,
      expediente_id: id,
      detalles: { transicion: 'PENDIENTE -> EN_EVALUACION' },
      ip_origen: req.ip ?? 'unknown',
    });
  }

  const decrypted = decryptRow(data as Record<string, unknown>);

  let urlSolvencia: string | null = null;
  let urlAntecedentes: string | null = null;

  if (data.ruta_comprobante_solvencia) {
    const { data: signed } = await supabase.storage
      .from('documents')
      .createSignedUrl(data.ruta_comprobante_solvencia, 300);
    urlSolvencia = signed?.signedUrl ?? null;
  }
  if (data.ruta_antecedentes_penales) {
    const { data: signed } = await supabase.storage
      .from('documents')
      .createSignedUrl(data.ruta_antecedentes_penales, 300);
    urlAntecedentes = signed?.signedUrl ?? null;
  }

  res.json({ ...decrypted, url_solvencia: urlSolvencia, url_antecedentes: urlAntecedentes });
});

// PATCH /api/applications/:id/assign — SCRUM-39 (ADMIN only)
router.patch('/:id/assign', requireAuth('ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { agente_id } = req.body as { agente_id?: string };

  if (!agente_id) {
    res.status(400).json({ error: 'agente_id es requerido' });
    return;
  }

  const { error } = await supabase
    .from('applications')
    .update({ agente_asignado_id: agente_id, estado: 'PENDIENTE' })
    .eq('id', id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  await logAction({
    accion: 'EXPEDIENTE_ASIGNADO',
    usuario_id: req.user!.id,
    expediente_id: id,
    detalles: { agente_id },
    ip_origen: req.ip ?? 'unknown',
  });

  res.json({ ok: true });
});

// POST /api/applications/:id/verdict — SCRUM-37 (agente/admin)
router.post('/:id/verdict', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { decision, articulo_citado, justificacion } = req.body as {
    decision: 'APROBADO' | 'RECHAZADO';
    articulo_citado: string;
    justificacion: string;
  };
  const ip = req.ip ?? 'unknown';

  if (!decision || !articulo_citado || !justificacion?.trim()) {
    res.status(400).json({ error: 'Decision, articulo citado y justificacion son requeridos' });
    return;
  }

  // CA-08: Justificacion minimo 20 caracteres
  if (justificacion.trim().length < 20) {
    res.status(422).json({ error: 'La justificacion debe tener al menos 20 caracteres (CA-08)' });
    return;
  }

  if (!['APROBADO', 'RECHAZADO'].includes(decision)) {
    res.status(400).json({ error: 'Decision invalida' });
    return;
  }

  try {
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('id,estado,agente_asignado_id')
      .eq('id', id)
      .single();

    if (appError || !app) {
      res.status(404).json({ error: 'Expediente no encontrado' });
      return;
    }

    // RBAC: agente solo puede dictaminar su expediente asignado
    if (req.user!.rol === 'AGENTE' && app.agente_asignado_id !== req.user!.id) {
      res.status(403).json({ error: 'No autorizado para dictaminar este expediente' });
      return;
    }

    const [{ error: dictError }, { error: updateError }] = await Promise.all([
      supabase.from('dictamenes').insert({
        expediente_id: id,
        agente_id: req.user!.id,
        decision,
        articulo_citado,
        justificacion,
      }),
      supabase.from('applications').update({ estado: decision }).eq('id', id),
    ]);

    if (dictError) throw dictError;
    if (updateError) throw updateError;

    await logAction({
      accion: 'DICTAMEN_EMITIDO',
      usuario_id: req.user!.id,
      expediente_id: id,
      detalles: { decision, articulo_citado },
      ip_origen: ip,
    });

    res.json({ ok: true, decision });
  } catch (err) {
    console.error('POST /verdict error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
