import { Router, Request, Response } from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';
import { calcularRiesgo } from '../services/risk-engine';
import { logAction } from '../services/audit';
import {
  enviarNotificacion,
  templateExpedienteCreado,
  templateDictamenAprobado,
  templateDictamenRechazado,
  templateSubsanacionPendiente,
} from '../services/notifications';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function generarTicket(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `PAN-${year}-${num}`;
}

function sanitizarNombre(filename: string): string {
  const base = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

// POST /api/applications — SCRUM-33 (público)
router.post(
  '/',
  upload.fields([
    { name: 'comprobante_solvencia', maxCount: 1 },
    { name: 'antecedentes_penales', maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const ip = req.ip ?? null;
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    const {
      nombres, apellidos, fecha_nacimiento, nacionalidad_codigo,
      numero_pasaporte, vencimiento_pasaporte, categoria_migratoria, monto_subsistencia,
      correo_electronico,
    } = req.body as Record<string, string>;

    if (!nombres || !apellidos || !fecha_nacimiento || !nacionalidad_codigo ||
        !numero_pasaporte || !vencimiento_pasaporte || !categoria_migratoria || !monto_subsistencia) {
      res.status(400).json({ error: 'Todos los campos son requeridos' });
      return;
    }

    const venc = new Date(vencimiento_pasaporte);
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    if (venc < sixMonths) {
      res.status(422).json({
        error: 'El pasaporte debe tener al menos 6 meses de vigencia (Art. 43, Decreto Ley 3 de 2008)',
      });
      return;
    }

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
      const [rutaSolvencia, rutaAntecedentes] = await Promise.all([
        subirPDF(solvenciaFile.buffer, solvenciaFile.originalname),
        subirPDF(antecedentesFile.buffer, antecedentesFile.originalname),
      ]);

      const riesgo = await calcularRiesgo({ nombres, apellidos, numero_pasaporte, nacionalidad_codigo });

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

      const insertData: Record<string, unknown> = {
        ticket_number,
        nombres,
        apellidos,
        fecha_nacimiento,
        nacionalidad_codigo,
        numero_pasaporte,
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
      };

      if (correo_electronico && correo_electronico.trim()) {
        insertData.email_solicitante = correo_electronico.trim().toLowerCase();
      }

      const { data: app, error } = await supabase
        .from('applications')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      await logAction({
        accion: 'SOLICITUD_CREADA',
        expediente_id: app.id,
        detalles: { ticket_number, nivel_riesgo: riesgo.nivel, score: riesgo.score },
        ip_origen: ip ?? undefined,
      });

      if (correo_electronico && correo_electronico.trim()) {
        const tmpl = templateExpedienteCreado(ticket_number, app.categoria_migratoria);
        enviarNotificacion({
          to: correo_electronico.trim().toLowerCase(),
          subject: tmpl.subject,
          html: tmpl.html,
          expediente_id: app.id,
          evento: 'EXPEDIENTE_CREADO',
        });
      }

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

// GET /api/applications — SCRUM-36 (agente/admin)
router.get('/', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { estado } = req.query as { estado?: string };

    let query = supabase
      .from('applications')
      .select('id,ticket_number,nombres,apellidos,nacionalidad_codigo,categoria_migratoria,estado,nivel_riesgo,score_riesgo,interpol_alerta_encontrada,interpol_alerta_tipo,interpol_alerta_detalle,created_at,numero_pasaporte,fecha_nacimiento,vencimiento_pasaporte,monto_subsistencia')
      .order('score_riesgo', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data, error } = await query;
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch (err) {
    console.error('GET /applications error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/applications/status — SCRUM-38 (público)
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { pasaporte, ticket } = req.query as { pasaporte?: string; ticket?: string };

    if (!pasaporte || !ticket) {
      res.status(400).json({ error: 'Pasaporte y ticket son requeridos' });
      return;
    }

    const { data, error } = await supabase
      .from('applications')
      .select('ticket_number,estado,nivel_riesgo,categoria_migratoria,created_at,razon_subsanacion,fecha_subsanacion_solicitada')
      .eq('ticket_number', ticket)
      .eq('numero_pasaporte', pasaporte)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Solicitud no encontrada' });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error('GET /applications/status error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/applications/:id — SCRUM-37 (agente/admin)
router.get('/:id', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
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

    const [signedSolvencia, signedAntecedentes] = await Promise.all([
      data.ruta_comprobante_solvencia
        ? supabase.storage.from('documents').createSignedUrl(data.ruta_comprobante_solvencia, 300)
        : Promise.resolve({ data: null }),
      data.ruta_antecedentes_penales
        ? supabase.storage.from('documents').createSignedUrl(data.ruta_antecedentes_penales, 300)
        : Promise.resolve({ data: null }),
    ]);

    res.json({
      ...data,
      url_solvencia: signedSolvencia?.data?.signedUrl ?? null,
      url_antecedentes: signedAntecedentes?.data?.signedUrl ?? null,
    });
  } catch (err) {
    console.error('GET /applications/:id error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/applications/:id/verdict — SCRUM-37 (agente/admin)
router.post('/:id/verdict', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { decision, articulo_citado, justificacion } = req.body as {
    decision: 'APROBADO' | 'RECHAZADO';
    articulo_citado: string;
    justificacion: string;
  };
  const ip = req.ip ?? null;

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
      .select('id,estado,email_solicitante,ticket_number')
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
      ip_origen: ip ?? undefined,
    });

    if (app.email_solicitante) {
      const tmpl = decision === 'APROBADO'
        ? templateDictamenAprobado(articulo_citado)
        : templateDictamenRechazado(articulo_citado, justificacion);
      enviarNotificacion({
        to: app.email_solicitante,
        subject: tmpl.subject,
        html: tmpl.html,
        expediente_id: id,
        evento: 'DICTAMEN_EMITIDO',
      });
    }

    res.json({ ok: true, decision });
  } catch (err) {
    console.error('POST /verdict error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/applications/:id/request-subsanacion — RF07 (agente/admin)
router.post('/:id/request-subsanacion', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { razon } = req.body as { razon?: string };
  const ip = req.ip ?? null;

  if (!razon?.trim()) {
    res.status(400).json({ error: 'La razón de subsanación es requerida' });
    return;
  }

  try {
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('id,estado,ticket_number,email_solicitante')
      .eq('id', id)
      .single();

    if (appError || !app) {
      res.status(404).json({ error: 'Expediente no encontrado' });
      return;
    }

    if (!['PENDIENTE', 'EN_EVALUACION'].includes(app.estado)) {
      res.status(422).json({ error: 'Solo se puede solicitar subsanación en expedientes pendientes o en evaluación' });
      return;
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({
        estado: 'SUBSANACION_PENDIENTE',
        razon_subsanacion: razon.trim(),
        fecha_subsanacion_solicitada: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    await logAction({
      accion: 'SUBSANACION_SOLICITADA',
      usuario_id: req.user!.id,
      expediente_id: id,
      detalles: { razon: razon.trim(), ticket_number: app.ticket_number },
      ip_origen: ip ?? undefined,
    });

    if (app.email_solicitante) {
      const tmpl = templateSubsanacionPendiente(razon.trim(), app.ticket_number);
      enviarNotificacion({
        to: app.email_solicitante,
        subject: tmpl.subject,
        html: tmpl.html,
        expediente_id: id,
        evento: 'SUBSANACION_PENDIENTE',
      });
    }

    res.json({ ok: true, estado: 'SUBSANACION_PENDIENTE' });
  } catch (err) {
    console.error('POST /request-subsanacion error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/applications/:id/subsanar — RF07 (público, ticket+pasaporte)
router.post(
  '/:id/subsanar',
  upload.fields([
    { name: 'comprobante_solvencia', maxCount: 1 },
    { name: 'antecedentes_penales', maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { ticket_number, numero_pasaporte } = req.body as Record<string, string>;
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    if (!ticket_number || !numero_pasaporte) {
      res.status(400).json({ error: 'Ticket y pasaporte son requeridos' });
      return;
    }

    try {
      const { data: app, error: appError } = await supabase
        .from('applications')
        .select('id,estado,ticket_number,numero_pasaporte,ruta_comprobante_solvencia,ruta_antecedentes_penales')
        .eq('id', id)
        .eq('ticket_number', ticket_number)
        .eq('numero_pasaporte', numero_pasaporte)
        .single();

      if (appError || !app) {
        res.status(404).json({ error: 'Expediente no encontrado' });
        return;
      }

      if (app.estado !== 'SUBSANACION_PENDIENTE') {
        res.status(422).json({ error: 'Este expediente no está en estado de subsanación' });
        return;
      }

      const updateData: Record<string, unknown> = {
        estado: 'EN_EVALUACION',
        razon_subsanacion: null,
        fecha_subsanacion_solicitada: null,
      };

      const solvenciaFile = files?.comprobante_solvencia?.[0];
      const antecedentesFile = files?.antecedentes_penales?.[0];

      if (solvenciaFile) {
        if (solvenciaFile.mimetype !== 'application/pdf') {
          res.status(422).json({ error: 'Los archivos deben ser PDF' });
          return;
        }
        updateData.ruta_comprobante_solvencia = await subirPDF(solvenciaFile.buffer, solvenciaFile.originalname);
      }

      if (antecedentesFile) {
        if (antecedentesFile.mimetype !== 'application/pdf') {
          res.status(422).json({ error: 'Los archivos deben ser PDF' });
          return;
        }
        updateData.ruta_antecedentes_penales = await subirPDF(antecedentesFile.buffer, antecedentesFile.originalname);
      }

      const { error: updateError } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      await logAction({
        accion: 'SUBSANACION_ENVIADA',
        expediente_id: id,
        detalles: {
          ticket_number: app.ticket_number,
          archivos_subidos: {
            comprobante_solvencia: !!solvenciaFile,
            antecedentes_penales: !!antecedentesFile,
          },
        },
        ip_origen: req.ip ?? undefined,
      });

      res.json({ ok: true, ticket_number: app.ticket_number, estado: 'EN_EVALUACION' });
    } catch (err) {
      console.error('POST /subsanar error:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

export default router;
