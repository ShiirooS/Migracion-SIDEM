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

async function subirPDF(buffer: Buffer, filename: string): Promise<string> {
  const path = `uploads/${Date.now()}-${filename}`;
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

    // CA-01: Pasaporte vigente mínimo 6 meses (Art. 43 DL3/2008)
    const venc = new Date(vencimiento_pasaporte);
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    if (venc < sixMonths) {
      res.status(422).json({
        error: 'El pasaporte debe tener al menos 6 meses de vigencia (Art. 43, Decreto Ley 3 de 2008)',
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
    if (solvenciaFile.mimetype !== 'application/pdf' || antecedentesFile.mimetype !== 'application/pdf') {
      res.status(422).json({ error: 'Los archivos deben ser PDF' });
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

      // Generar ticket único (CA-03)
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
        accion: 'SOLICITUD_CREADA',
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
router.get('/', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { estado, cursor, limit: limitStr } = req.query as {
    estado?: string;
    cursor?: string;
    limit?: string;
  };

  // SCRUM-52: cursor-based pagination
  const limit = Math.min(parseInt(limitStr ?? '20', 10) || 20, 100);

  let query = supabase
    .from('applications')
    .select(
      'id,ticket_number,nombres,apellidos,nacionalidad_codigo,categoria_migratoria,estado,nivel_riesgo,score_riesgo,interpol_alerta_encontrada,interpol_alerta_tipo,interpol_alerta_detalle,created_at,numero_pasaporte,fecha_nacimiento,vencimiento_pasaporte,monto_subsistencia'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (estado) query = query.eq('estado', estado);
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
 */
// GET /api/applications/status — SCRUM-38 (público)
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  const { pasaporte, ticket } = req.query as { pasaporte?: string; ticket?: string };

  if (!pasaporte || !ticket) {
    res.status(400).json({ error: 'Pasaporte y ticket son requeridos' });
    return;
  }

  // SCRUM-48: encrypt the lookup value to match stored ciphertext
  const encPasaporte = encrypt(pasaporte);

  const { data, error } = await supabase
    .from('applications')
    .select('ticket_number,estado,nivel_riesgo,categoria_migratoria,created_at')
    .eq('ticket_number', ticket)
    .eq('numero_pasaporte', encPasaporte)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Solicitud no encontrada' });
    return;
  }

  res.json(data);
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

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Expediente no encontrado' });
    return;
  }

  // SCRUM-48: Decrypt PII before returning
  const decrypted = decryptRow(data as Record<string, unknown>);

  // URL firmada para los PDFs
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

  if (!decision || !articulo_citado || !justificacion?.trim()) {
    res.status(400).json({ error: 'Decisión, artículo citado y justificación son requeridos' });
    return;
  }

  if (!['APROBADO', 'RECHAZADO'].includes(decision)) {
    res.status(400).json({ error: 'Decisión inválida' });
    return;
  }

  try {
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('id,estado')
      .eq('id', id)
      .single();

    if (appError || !app) {
      res.status(404).json({ error: 'Expediente no encontrado' });
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
