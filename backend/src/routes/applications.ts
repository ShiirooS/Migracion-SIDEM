import { Router, Request, Response } from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';
import { calcularRiesgo } from '../services/risk-engine';
import { logAction } from '../services/audit';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── Rate limiting simple para /status (RF03 — CA: bloquear IP tras 3 fallos) ──
const rateLimitMap = new Map<string, { count: number; blockedUntil: number }>();

// Normalizar IPs IPv4-mapped-IPv6 a formato consistente
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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── POST /api/applications — RF01 + RF02 + RF04 (público) ────────────────────
router.post(
  '/',
  upload.fields([
    { name: 'comprobante_solvencia', maxCount: 1 },
    { name: 'antecedentes_penales', maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const ip = req.ip ?? 'unknown';
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    const {
      nombres, apellidos, fecha_nacimiento, nacionalidad_codigo,
      numero_pasaporte, vencimiento_pasaporte, categoria_migratoria, monto_subsistencia,
    } = req.body as Record<string, string>;

    // RF02: Campos obligatorios
    if (!nombres || !apellidos || !fecha_nacimiento || !nacionalidad_codigo ||
        !numero_pasaporte || !vencimiento_pasaporte || !categoria_migratoria || !monto_subsistencia) {
      res.status(400).json({ error: 'Todos los campos son requeridos' });
      return;
    }

    // RF02: Edad ≥ 18
    const nacimiento = new Date(fecha_nacimiento);
    const hoy = new Date();
    const edad = hoy.getFullYear() - nacimiento.getFullYear() -
      (hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate()) ? 1 : 0);
    if (edad < 18) {
      res.status(422).json({ error: 'El solicitante debe ser mayor de edad' });
      return;
    }

    // RF02 / CA-01: Pasaporte vigente mínimo 6 meses (Art. 43 DL3/2008)
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

    // RF02: Monto > 0 (Art. 50 Num. 1)
    const monto = parseFloat(monto_subsistencia);
    if (isNaN(monto) || monto <= 0) {
      res.status(422).json({ error: 'Debe declarar un monto de subsistencia válido (Art. 50, DL3/2008)', field: 'monto_subsistencia' });
      return;
    }

    // RF02 / CA-02: Archivos PDF requeridos
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

      // RF04: Motor de scoring
      const riesgo = await calcularRiesgo({ nombres, apellidos, numero_pasaporte, nacionalidad_codigo });

      // CA-03: Ticket único
      let ticket_number = generarTicket();
      for (let i = 0; i < 5; i++) {
        const { data: existing } = await supabase.from('applications').select('id').eq('ticket_number', ticket_number).single();
        if (!existing) break;
        ticket_number = generarTicket();
      }

      const { data: app, error } = await supabase
        .from('applications')
        .insert({
          ticket_number, nombres, apellidos, fecha_nacimiento, nacionalidad_codigo,
          numero_pasaporte, vencimiento_pasaporte, categoria_migratoria,
          monto_subsistencia: monto,
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
            ofac: riesgo.interpol_alerta_tipo === 'OFAC_SDN' ? 40 : 0,
            pais_restringido: riesgo.score - (riesgo.interpol_alerta_tipo === 'INTERPOL_RED_NOTICE' ? 50 : riesgo.interpol_alerta_tipo === 'OFAC_SDN' ? 40 : 0),
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

// ── GET /api/applications — RF05 (agente/admin) ───────────────────────────────
router.get('/', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { estado, agente_id, grupo } = req.query as { estado?: string; agente_id?: string; grupo?: string };

  const GRUPOS: Record<string, string[]> = {
    ACTIVOS: ['PENDIENTE', 'EN_EVALUACION', 'SUBSANACION_PENDIENTE'],
    RESUELTOS: ['APROBADO', 'RECHAZADO'],
  };

  let query = supabase
    .from('applications')
    .select('id,ticket_number,nombres,apellidos,nacionalidad_codigo,categoria_migratoria,estado,nivel_riesgo,score_riesgo,interpol_alerta_encontrada,interpol_alerta_tipo,interpol_alerta_detalle,created_at,numero_pasaporte,fecha_nacimiento,vencimiento_pasaporte,monto_subsistencia,agente_asignado_id')
    .order('score_riesgo', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (estado) {
    query = query.eq('estado', estado);
  } else if (grupo && GRUPOS[grupo]) {
    query = query.in('estado', GRUPOS[grupo]);
  }
  if (agente_id) query = query.eq('agente_asignado_id', agente_id);

  const { data, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

// ── GET /api/applications/status — RF03 (público) ────────────────────────────
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

  const { data, error } = await supabase
    .from('applications')
    .select('ticket_number,estado,nivel_riesgo,categoria_migratoria,created_at')
    .eq('ticket_number', ticket.toUpperCase())
    .eq('numero_pasaporte', pasaporte.toUpperCase())
    .single();

  if (error || !data) {
    recordFailedAttempt(ip);
    // RF10: Audit CONSULTA_ESTADO (fallida)
    await logAction({ accion: 'CONSULTA_ESTADO', detalles: { ticket, resultado: 'no_encontrado' }, ip_origen: ip });
    res.status(404).json({ error: 'Solicitud no encontrada' });
    return;
  }

  resetFailedAttempts(ip);

  // RF03: Incluir artículo_citado del dictamen si está resuelto
  let articulo_citado: string | null = null;
  if (data.estado === 'APROBADO' || data.estado === 'RECHAZADO') {
    const { data: dictamen } = await supabase
      .from('dictamenes')
      .select('articulo_citado')
      .eq('expediente_id', (await supabase.from('applications').select('id').eq('ticket_number', data.ticket_number).single()).data?.id ?? '')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    articulo_citado = dictamen?.articulo_citado ?? null;
  }

  // RF10: Audit CONSULTA_ESTADO (exitosa)
  await logAction({ accion: 'CONSULTA_ESTADO', detalles: { ticket, resultado: 'encontrado', estado: data.estado }, ip_origen: ip });

  res.json({ ...data, articulo_citado });
});

// ── GET /api/applications/:id — RF05 + RF06 (agente/admin) ───────────────────
router.get('/:id', requireAuth('AGENTE', 'ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const ip = req.ip ?? 'unknown';

  const { data, error } = await supabase.from('applications').select('*').eq('id', id).single();

  if (error || !data) { res.status(404).json({ error: 'Expediente no encontrado' }); return; }

  // RF06: Cambiar a EN_EVALUACION si estaba PENDIENTE
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

  // URLs firmadas para PDFs (300s = 5 min)
  let urlSolvencia: string | null = null;
  let urlAntecedentes: string | null = null;
  if (data.ruta_comprobante_solvencia) {
    const { data: signed } = await supabase.storage.from('documents').createSignedUrl(data.ruta_comprobante_solvencia, 300);
    urlSolvencia = signed?.signedUrl ?? null;
  }
  if (data.ruta_antecedentes_penales) {
    const { data: signed } = await supabase.storage.from('documents').createSignedUrl(data.ruta_antecedentes_penales, 300);
    urlAntecedentes = signed?.signedUrl ?? null;
  }

  res.json({ ...data, url_solvencia: urlSolvencia, url_antecedentes: urlAntecedentes });
});

// ── POST /api/applications/:id/verdict — RF06 (agente/admin) ─────────────────
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

// ── PATCH /api/applications/:id/assign — RF05 asignación (solo ADMIN) ────────
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
