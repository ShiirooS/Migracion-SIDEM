import { Resend } from 'resend';
import { supabase } from '../lib/supabase';

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'SIDEM-PAN <notificaciones@sidem-pan.gob.pa>';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface NotificacionParams {
  to: string;
  subject: string;
  html: string;
  expediente_id?: string;
  evento: string;
}

async function logEmail(params: {
  expediente_id?: string;
  destinatario: string;
  asunto: string;
  evento: string;
  estado_envio: 'ENVIADO' | 'ERROR';
  error_mensaje?: string;
}): Promise<void> {
  const { error } = await supabase.from('email_logs').insert({
    expediente_id: params.expediente_id ?? null,
    destinatario: params.destinatario,
    asunto: params.asunto,
    evento: params.evento,
    estado_envio: params.estado_envio,
    error_mensaje: params.error_mensaje ?? null,
  });

  if (error) {
    console.error('email_logs insert error:', error.message);
  }
}

export async function enviarNotificacion(params: NotificacionParams): Promise<void> {
  if (!resendApiKey || !resend) {
    console.warn('RESEND_API_KEY no configurada — email no enviado:', params.evento);
    await logEmail({
      expediente_id: params.expediente_id,
      destinatario: params.to,
      asunto: params.subject,
      evento: params.evento,
      estado_envio: 'ERROR',
      error_mensaje: 'RESEND_API_KEY no configurada',
    });
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    await logEmail({
      expediente_id: params.expediente_id,
      destinatario: params.to,
      asunto: params.subject,
      evento: params.evento,
      estado_envio: 'ENVIADO',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Email send error:', msg);
    await logEmail({
      expediente_id: params.expediente_id,
      destinatario: params.to,
      asunto: params.subject,
      evento: params.evento,
      estado_envio: 'ERROR',
      error_mensaje: msg,
    });
  }
}

// ─── Templates de email ───────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-size:20px;color:#1a237e;margin:0;">SIDEM-PAN</h1>
          <p style="font-size:12px;color:#666;margin:4px 0 0;">Sistema de Debida Diligencia Migratoria — República de Panamá</p>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #e0e0e0;">
          ${content}
        </div>
        <p style="font-size:11px;color:#999;text-align:center;margin-top:16px;">
          Este es un correo automático del sistema SIDEM-PAN. No responda a este mensaje.
        </p>
      </div>
    </body>
    </html>
  `;
}

export function templateExpedienteCreado(ticketNumber: string, categoria: string): { subject: string; html: string } {
  return {
    subject: `Solicitud recibida #${ticketNumber}`,
    html: baseTemplate(`
      <h2 style="font-size:16px;color:#1a237e;margin:0 0 16px;">Solicitud registrada exitosamente</h2>
      <p style="font-size:14px;color:#333;margin:0 0 12px;">Su evaluación migratoria ha sido recibida por el sistema.</p>
      <table style="width:100%;font-size:14px;color:#333;">
        <tr><td style="padding:8px 0;color:#666;">Número de ticket</td><td style="padding:8px 0;font-weight:bold;font-family:monospace;">${ticketNumber}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Categoría</td><td style="padding:8px 0;">${categoria}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Estado</td><td style="padding:8px 0;">PENDIENTE</td></tr>
      </table>
      <p style="font-size:13px;color:#666;margin:16px 0 0;">Guarde su número de ticket. Lo necesitará para consultar el estado de su trámite.</p>
    `),
  };
}

export function templateDictamenAprobado(articulo: string): { subject: string; html: string } {
  return {
    subject: 'Su solicitud migratoria ha sido APROBADA',
    html: baseTemplate(`
      <h2 style="font-size:16px;color:#2e7d32;margin:0 0 16px;">Solicitud aprobada</h2>
      <p style="font-size:14px;color:#333;margin:0 0 12px;">Su trámite migratorio ha sido aprobado por la Secretaría Nacional de Migración.</p>
      <table style="width:100%;font-size:14px;color:#333;">
        <tr><td style="padding:8px 0;color:#666;">Resultado</td><td style="padding:8px 0;font-weight:bold;color:#2e7d32;">APROBADO</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Fundamento legal</td><td style="padding:8px 0;">${articulo}</td></tr>
      </table>
      <p style="font-size:13px;color:#666;margin:16px 0 0;">Comuníquese con la SNM para continuar el proceso.</p>
    `),
  };
}

export function templateDictamenRechazado(articulo: string, justificacion: string): { subject: string; html: string } {
  return {
    subject: 'Su solicitud migratoria ha sido RECHAZADA',
    html: baseTemplate(`
      <h2 style="font-size:16px;color:#c62828;margin:0 0 16px;">Solicitud rechazada</h2>
      <p style="font-size:14px;color:#333;margin:0 0 12px;">Su trámite migratorio ha sido rechazado por la Secretaría Nacional de Migración.</p>
      <table style="width:100%;font-size:14px;color:#333;">
        <tr><td style="padding:8px 0;color:#666;">Resultado</td><td style="padding:8px 0;font-weight:bold;color:#c62828;">RECHAZADO</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Fundamento legal</td><td style="padding:8px 0;">${articulo}</td></tr>
      </table>
      <div style="margin-top:16px;padding:12px;background:#fff3f0;border-radius:6px;border:1px solid #ffcdd2;">
        <p style="font-size:13px;color:#c62828;margin:0;"><strong>Motivo:</strong> ${justificacion}</p>
      </div>
    `),
  };
}

export function templateSubsanacionPendiente(razon: string, ticketNumber: string): { subject: string; html: string } {
  return {
    subject: 'Se requieren documentos adicionales',
    html: baseTemplate(`
      <h2 style="font-size:16px;color:#e65100;margin:0 0 16px;">Documentos adicionales requeridos</h2>
      <p style="font-size:14px;color:#333;margin:0 0 12px;">Se han identificado documentos que requieren corrección o son ilegibles.</p>
      <table style="width:100%;font-size:14px;color:#333;">
        <tr><td style="padding:8px 0;color:#666;">Ticket</td><td style="padding:8px 0;font-weight:bold;font-family:monospace;">${ticketNumber}</td></tr>
      </table>
      <div style="margin-top:16px;padding:12px;background:#fff3e0;border-radius:6px;border:1px solid #ffcc80;">
        <p style="font-size:13px;color:#e65100;margin:0;"><strong>¿Qué debe subir?</strong></p>
        <p style="font-size:13px;color:#333;margin:8px 0 0;">${razon}</p>
      </div>
      <p style="font-size:13px;color:#666;margin:16px 0 0;">Para subsanar, consulte el estado de su trámite en el sistema SIDEM-PAN y siga las instrucciones.</p>
    `),
  };
}
