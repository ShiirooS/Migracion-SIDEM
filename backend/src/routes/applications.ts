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

// ── Rate limiting para /status (RF03 — bloquear IP tras 3 fallos) ─────────────
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
    entry.blockedUntil = now + 5 * 60 * 1000; // 5 minutos
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
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,150}$/, 'Nombres inválidos (solo letras, 2-150 caracteres)'),
  apellidos: z
    .string()
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,150}$/, 'Apellidos inválidos (solo letras, 2-150 caracteres)'),
  numero_pasaporte: z
    .string()
    .regex(/^[a-zA-Z0-9]{6,20}$/, 'Número de pasaporte inválido (6-20 caracteres alfanuméricos)'),
  vencimiento_pasaporte: z.string().datetime({ offset: true }).or(z.string().date()),
  fecha_nacimiento: z.string().datetime({ offset: true }).or(z.string().date()),
  nacionalidad_codigo: z.string().min(2).max(3),
  categoria_migratoria: z.string().min(1),
  monto_subsistencia: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'monto_subsistencia debe ser un número positivo',
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

/** Decrypt the PII fields of an application row returned from Supabase. */
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

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Crear nueva solicitud migratoria
 *     tags: [Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/NuevaSolicitud'
 *     responses:
 *       201:
 *         description: Solicitud creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SolicitudCreada'
 *       400:
 *         description: Campos requeridos faltantes
 *       422:
 *         description: Validación fallida (pasaporte vencido, archivos no PDF, etc.)
 */
// POST /api/applications — SCRUM-33 (público)
router.post(
  '/',
  upload.fields([
    { name: 'comprobante_solvencia', maxCount: 1 },
    { name: 'antecedentes_penales', maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const ip = req.ip ?? 'unknown';
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    // SCRUM-51: Zod validation — validate body before business logic
    const parsed = SolicitudSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ error: 'Validación fallida', detalles: parsed.error.flatten().fieldErrors });
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

    // RF02: Edad ≥ 18
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

    // CA-01: Pasaporte vigente mínimo 6 meses (Art. 43 DL3/2008)
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

    // CA-02: Archivos PDF requeridos
    const solvenciaFile = files?.comprobante_solvencia?.[0];
    const antecedentesFile = files?.antecedentes_penales?.[0];
    if (!solvenciaFile || !antecedentesFile) {
      res.status(400).json({ error: 'Se requieren ambos documentos PDF' });
      return;
    }
    if (solvenciaFile.mimetype !== 'application/pdf') {
      res.status(422).json({ error: 'Solo se aceptan archivos en formato PDF', field: 'comprobante_solvencia' });
      return;
    }
    if (antecedentesFile.mimetype !== 'application/pdf') {
      res.status(422).json({ error: 'Solo se aceptan archivos en formato PDF', field: 'antecedentes_penales' });
      return;
    }

    try {
      // Subir PDFs a Supabase Storage
      const [rutaSolvencia, rutaAntecedentes] = await Promise.all([
        subirPDF(solvenciaFile.buffer, solvenciaFile.originalname),
        subirPDF(antecedentesFile.buffer, antecedentesFile.originalname),
      ]);

      // SCRUM-34: Motor de scoring — uses plaintext values for control_lists lookup
      const riesgo = await calcularRiesgo({ nombres, apellidos, numero_pasaporte, nacionalidad_codigo });

      // SCRUM-48: Encrypt PII before storing
      const encNombres = encrypt(nombres);
      const encApellidos = encrypt(apellidos);
      const encPasaporte = encrypt(numero_pasaporte);
      const encFechaNac = encrypt(fecha_nacimiento);

      // CA-03: Generar ticket único
      let ticket_number = generarTicket();
      for (let i = 0; i < 5; i++) {
        const { data: existing } = await supabase
          .from('applications')
          .select('id')
          .eq('ticket_number', ticket_number)
          .single();
        if (!existing) break;
        ticket_number = generarTicket();
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
          ofac_alerta_encontrada: riesgo.ofac_alerta_encontrada,
          ofac_alerta_detalle: riesgo.ofac_alerta_detalle,
          pais_restringido_encontrada: riesgo.pais_restringido_encontrada,
        })
        .select()
        .single();

      if (error) throw error;

      // RF10: Audit EXPEDIENTE_CREADO
      await logAction({
        accion: 'EXPEDIENTE_CREADO',
        expediente_id: app.id,
        detalles: { ticket_number, nivel_riesgo: riesgo.nivel, score: riesgo.score },
        ip_origen: ip,
      });

      // RF10: Audit SCORING_CALCULADO
      await logAction({
        accion: 'SCORING_CALCULADO',
        expediente_id: app.id,
        detalles: {
          score: riesgo.score,
          nivel_riesgo: riesgo.nivel,
          interpol_alerta_encontrada: riesgo.interpol_alerta_encontrada,
          interpol_alerta_tipo: riesgo.interpol_alerta_tipo,
          factores: {
            interpol: riesgo.interpol_alerta_tipo === 'INTERPOL_RED_NOTICE' ? 50 : 0,
            ofac: riesgo.ofac_alerta_encontrada ? 40 : 0,
            pais_restringido: riesgo.pais_restringido_encontrada ? 10 : 0,
          },
        },
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

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Listar expedientes (cursor-based pagination)
 *     tags: [Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *       - in: query
 *         name: cursor
 *         description: ISO timestamp — fetch records older than this
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Lista paginada de expedientes
 */
// GET /api/applications — SCRUM-36/SCRUM-52 (agente/admin) with cursor pagination
const ESTADOS_ACTIVOS = ['PENDIENTE', 'EN_EVALUACION', 'SUBSANACION_PENDIENTE'];
const ESTADOS_RESUELTOS = ['APROBADO', 'RECHAZADO'];

router.get('/', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { estado, cursor, limit: limitStr, grupo, agente_id } = req.query as {
    estado?: string;
    cursor?: string;
    limit?: string;
    grupo?: 'ACTIVOS' | 'RESUELTOS';
    agente_id?: string;
  };

  // SCRUM-52: cursor-based pagination
  const limit = Math.min(parseInt(limitStr ?? '20', 10) || 20, 100);

  let query = supabase
    .from('applications')
    .select(
      'id,ticket_number,nombres,apellidos,nacionalidad_codigo,categoria_migratoria,estado,nivel_riesgo,score_riesgo,interpol_alerta_encontrada,interpol_alerta_tipo,interpol_alerta_detalle,ofac_alerta_encontrada,ofac_alerta_detalle,pais_restringido_encontrada,created_at,numero_pasaporte,fecha_nacimiento,vencimiento_pasaporte,monto_subsistencia,agente_asignado_id'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (estado) {
    query = query.eq('estado', estado);
  } else if (grupo === 'ACTIVOS') {
    query = query.in('estado', ESTADOS_ACTIVOS);
  } else if (grupo === 'RESUELTOS') {
    query = query.in('estado', ESTADOS_RESUELTOS);
  }

  if (agente_id) query = query.eq('agente_asignado_id', agente_id);

  // Cursor: only return rows older than the cursor timestamp
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

/**
 * @swagger
 * /api/applications/status:
 *   get:
 *     summary: Consultar estado de solicitud (público)
 *     tags: [Applications]
 *     parameters:
 *       - in: query
 *         name: pasaporte
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: ticket
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de la solicitud
 *       404:
 *         description: Solicitud no encontrada
 *       429:
 *         description: Demasiados intentos fallidos
 */
// GET /api/applications/status — SCRUM-38 (público)
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip ?? 'unknown';
  const { pasaporte, ticket } = req.query as { pasaporte?: string; ticket?: string };

  if (!pasaporte || !ticket) {
    res.status(400).json({ error: 'Pasaporte y ticket son requeridos' });
    return;
  }

  // RF03: Rate limiting — bloquear IP tras 3 intentos fallidos
  const rl = checkRateLimit(ip);
  if (rl.blocked) {
    const minutosRestantes = Math.ceil((rl.remainingMs ?? 0) / 60000);
    res.status(429).json({
      error: `Demasiados intentos fallidos. Por seguridad, espere ${minutosRestantes} minuto(s) antes de intentar nuevamente.`,
    });
    return;
  }

  // SCRUM-48: AES-GCM uses a random IV per encryption, so ciphertext is non-deterministic —
  // we cannot use .eq() on the encrypted column. Instead fetch by the unique ticket_number
  // (collision-free by construction) and compare the decrypted value in-process.
  const { data, error } = await supabase
    .from('applications')
    .select('ticket_number,estado,nivel_riesgo,categoria_migratoria,created_at,numero_pasaporte')
    .eq('ticket_number', ticket)
    .single();

  if (error || !data) {
    recordFailedAttempt(ip);
    await logAction({ accion: 'CONSULTA_ESTADO', detalles: { ticket, resultado: 'no_encontrado' }, ip_origen: ip });
    res.status(404).json({ error: 'Solicitud no encontrada' });
    return;
  }

  // Decrypt and compare passport to prevent ticket enumeration
  const pasaporteDecrypted = decrypt(data.numero_pasaporte as string);
  if (pasaporteDecrypted !== pasaporte) {
    recordFailedAttempt(ip);
    res.status(404).json({ error: 'Solicitud no encontrada' });
    return;
  }

  resetFailedAttempts(ip);

  // RF10: Audit CONSULTA_ESTADO (exitosa)
  await logAction({
    accion: 'CONSULTA_ESTADO',
    detalles: { ticket, resultado: 'encontrado', estado: data.estado },
    ip_origen: ip,
  });

  // Strip the encrypted passport from the response
  const { numero_pasaporte: _omit, ...responseData } = data;
  res.json(responseData);
});

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Obtener expediente por ID
 *     tags: [Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expediente completo con URLs firmadas de PDFs
 *       404:
 *         description: Expediente no encontrado
 */
// GET /api/applications/:id — SCRUM-37 (agente/admin)
router.get('/:id', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const ip = req.ip ?? 'unknown';

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Expediente no encontrado' });
    return;
  }

  // RF06: Auto-transición a EN_EVALUACION al abrir un expediente PENDIENTE
  if (data.estado === 'PENDIENTE') {
    await supabase.from('applications').update({ estado: 'EN_EVALUACION' }).eq('id', id);
    data.estado = 'EN_EVALUACION';
  }

  // RF10: Audit EXPEDIENTE_ABIERTO
  await logAction({
    accion: 'EXPEDIENTE_ABIERTO',
    usuario_id: req.user!.id,
    expediente_id: id,
    detalles: { ticket_number: data.ticket_number },
    ip_origen: ip,
  });

  // SCRUM-48: Decrypt PII before returning
  const decrypted = decryptRow(data as Record<string, unknown>);

  // URL firmada para los PDFs (300s = 5 min)
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

// POST /api/applications/:id/verdict — SCRUM-37 (agente/admin)
router.post('/:id/verdict', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { decision, articulo_citado, justificacion } = req.body as {
    decision: 'APROBADO' | 'RECHAZADO';
    articulo_citado: string;
    justificacion: string;
  };
  const ip = req.ip ?? 'unknown';

  if (!decision || !articulo_citado?.trim() || !justificacion?.trim()) {
    res.status(400).json({ error: 'Decisión, artículo citado y justificación son requeridos' });
    return;
  }

  // RF06 / CA-08: Mínimo 20 caracteres en justificación
  if (justificacion.trim().length < 20) {
    res.status(422).json({ error: 'La justificación debe tener al menos 20 caracteres', field: 'justificacion' });
    return;
  }

  if (!['APROBADO', 'RECHAZADO'].includes(decision)) {
    res.status(400).json({ error: 'Decisión inválida' });
    return;
  }

  try {
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('id,estado,agente_asignado_id')
      .eq('id', id)
      .single();
    if (appError || !app) { res.status(404).json({ error: 'Expediente no encontrado' }); return; }

    if (!['PENDIENTE', 'EN_EVALUACION'].includes(app.estado)) {
      res.status(422).json({ error: 'El expediente no está en un estado que permita dictamen' });
      return;
    }

    if (req.user!.rol === 'AGENTE' && app.agente_asignado_id !== req.user!.id) {
      res.status(403).json({ error: 'Solo el agente asignado puede emitir un dictamen' });
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

    // RF10: Audit DICTAMEN_EMITIDO
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

// POST /api/applications/:id/subsanacion — RF07: agente solicita corrección de documentos
router.post('/:id/subsanacion', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { motivo } = req.body as { motivo: string };
  const ip = req.ip ?? 'unknown';

  if (!motivo?.trim() || motivo.trim().length < 20) {
    res.status(422).json({ error: 'El motivo debe tener al menos 20 caracteres', field: 'motivo' });
    return;
  }

  try {
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('id,estado,agente_asignado_id')
      .eq('id', id)
      .single();
    if (appError || !app) { res.status(404).json({ error: 'Expediente no encontrado' }); return; }

    if (!['PENDIENTE', 'EN_EVALUACION'].includes(app.estado)) {
      res.status(422).json({ error: 'El expediente no permite solicitar subsanación en su estado actual' });
      return;
    }

    if (req.user!.rol === 'AGENTE' && app.agente_asignado_id !== req.user!.id) {
      res.status(403).json({ error: 'Solo el agente asignado puede solicitar subsanación' });
      return;
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({ estado: 'SUBSANACION_PENDIENTE', subsanacion_motivo: motivo.trim() })
      .eq('id', id);
    if (updateError) throw updateError;

    await logAction({
      accion: 'SUBSANACION_SOLICITADA',
      usuario_id: req.user!.id,
      expediente_id: id,
      detalles: { motivo },
      ip_origen: ip,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('POST /subsanacion error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/applications/:id/upload-correction — RF07: solicitante sube documento corregido (público)
router.post('/:id/upload-correction', upload.single('documento'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { ticket_number, numero_pasaporte, tipo_documento } = req.body as {
    ticket_number: string;
    numero_pasaporte: string;
    tipo_documento: 'solvencia' | 'antecedentes';
  };
  const ip = req.ip ?? 'unknown';

  if (!ticket_number || !numero_pasaporte || !tipo_documento || !req.file) {
    res.status(400).json({ error: 'ticket_number, numero_pasaporte, tipo_documento y documento son requeridos' });
    return;
  }

  if (!['solvencia', 'antecedentes'].includes(tipo_documento)) {
    res.status(400).json({ error: 'tipo_documento debe ser solvencia o antecedentes' });
    return;
  }

  if (req.file.mimetype !== 'application/pdf') {
    res.status(422).json({ error: 'Solo se aceptan archivos PDF' });
    return;
  }

  try {
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('id,estado,numero_pasaporte,ticket_number')
      .eq('id', id)
      .eq('ticket_number', ticket_number)
      .single();
    if (appError || !app) { res.status(404).json({ error: 'Expediente no encontrado' }); return; }

    if (app.estado !== 'SUBSANACION_PENDIENTE') {
      res.status(422).json({ error: 'El expediente no está en estado de subsanación pendiente' });
      return;
    }

    // Verificar identidad descifrando el pasaporte almacenado
    let storedPasaporte: string;
    try {
      storedPasaporte = decrypt(app.numero_pasaporte);
    } catch {
      res.status(500).json({ error: 'Error interno verificando identidad' });
      return;
    }

    if (storedPasaporte.toUpperCase() !== numero_pasaporte.trim().toUpperCase()) {
      res.status(403).json({ error: 'Número de pasaporte incorrecto' });
      return;
    }

    // Subir documento corregido a Storage (guardamos el path, no la URL firmada)
    const storagePath = await subirPDF(req.file.buffer, req.file.originalname);

    const column = tipo_documento === 'solvencia' ? 'ruta_comprobante_solvencia' : 'ruta_antecedentes_penales';
    const { error: updateError } = await supabase
      .from('applications')
      .update({ estado: 'EN_EVALUACION', [column]: storagePath, subsanacion_motivo: null })
      .eq('id', id);
    if (updateError) throw updateError;

    await logAction({
      accion: 'DOCUMENTO_CORREGIDO',
      expediente_id: id,
      detalles: { tipo_documento },
      ip_origen: ip,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('POST /upload-correction error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/applications/:id/assign — RF05 asignación (solo ADMIN)
router.patch('/:id/assign', requireAuth('ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { agente_id } = req.body as { agente_id: string };
  const ip = req.ip ?? 'unknown';

  if (!agente_id) { res.status(400).json({ error: 'agente_id es requerido' }); return; }

  // Verificar que el agente existe y está activo
  const { data: agente, error: agenteError } = await supabase
    .from('agentes').select('id,nombre_completo,rol').eq('id', agente_id).eq('activo', true).single();
  if (agenteError || !agente) { res.status(404).json({ error: 'Agente no encontrado o inactivo' }); return; }

  const { error } = await supabase.from('applications').update({ agente_asignado_id: agente_id }).eq('id', id);
  if (error) { res.status(500).json({ error: error.message }); return; }

  // RF10: Audit EXPEDIENTE_ASIGNADO
  await logAction({
    accion: 'EXPEDIENTE_ASIGNADO',
    usuario_id: req.user!.id,
    expediente_id: id,
    detalles: { agente_id, agente_nombre: agente.nombre_completo },
    ip_origen: ip,
  });

  res.json({ ok: true, agente_id, agente_nombre: agente.nombre_completo });
});

export default router;
