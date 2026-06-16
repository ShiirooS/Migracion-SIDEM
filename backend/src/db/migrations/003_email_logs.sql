-- RF08: Notificaciones por correo electrónico
-- Agregar columna de email del solicitante

ALTER TABLE applications
  ADD COLUMN email_solicitante VARCHAR(255);

-- Tabla de logs de envío de emails (separada de audit_log WORM)

CREATE TABLE IF NOT EXISTS email_logs (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id  UUID         REFERENCES applications(id),
  destinatario   VARCHAR(255) NOT NULL,
  asunto         VARCHAR(255) NOT NULL,
  evento         VARCHAR(50)  NOT NULL,
  estado_envio   VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
                   CHECK (estado_envio IN ('PENDIENTE','ENVIADO','ERROR')),
  error_mensaje  TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_expediente ON email_logs(expediente_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
