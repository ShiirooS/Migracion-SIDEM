-- SCRUM-52: Performance indexes
-- Composite index for the agent dashboard query (filter by agent + state, sort by risk/date)
CREATE INDEX IF NOT EXISTS idx_applications_agente_estado
  ON applications(agente_asignado_id, estado, nivel_riesgo DESC, created_at ASC);

-- Index for the /status public lookup (ticket + encrypted passport)
CREATE INDEX IF NOT EXISTS idx_applications_ticket_pasaporte
  ON applications(ticket_number, numero_pasaporte);

-- Index for risk-engine queries on control_lists (tipo + activo filter)
CREATE INDEX IF NOT EXISTS idx_control_lists_tipo_activo
  ON control_lists(tipo_lista, activo);

-- Index for audit log retrieval per expediente (WORM table, DESC for latest-first)
CREATE INDEX IF NOT EXISTS idx_audit_log_expediente
  ON audit_log(expediente_id, created_at DESC);
