-- ============================================================
-- SIDEM-PAN — Migración 001: Esquema completo + triggers WORM
-- Decreto Ley 3 del 22 de febrero de 2008
-- ============================================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Secuencia para ticket_number (PAN-AAAA-NNNNN)
CREATE SEQUENCE IF NOT EXISTS ticket_seq START 1;

-- ============================================================
-- TABLA: agentes (usuarios del sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS agentes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            VARCHAR(255) UNIQUE NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  nombre_completo  VARCHAR(200) NOT NULL,
  rol              VARCHAR(20)  NOT NULL CHECK (rol IN ('AGENTE', 'ADMIN')),
  activo           BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: applications (expedientes migratorios)
-- Art. 6 Num. 2 — El SNM lleva el registro nacional de extranjería
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id                           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number                VARCHAR(20)  UNIQUE NOT NULL,
  nombres                      VARCHAR(150) NOT NULL,
  apellidos                    VARCHAR(150) NOT NULL,
  fecha_nacimiento             DATE         NOT NULL,
  nacionalidad_codigo          CHAR(2)      NOT NULL,
  numero_pasaporte             VARCHAR(20)  NOT NULL,
  vencimiento_pasaporte        DATE         NOT NULL,
  categoria_migratoria         VARCHAR(50)  NOT NULL,
  monto_subsistencia           DECIMAL(10,2) NOT NULL,
  ruta_comprobante_solvencia   VARCHAR(500),
  ruta_antecedentes_penales    VARCHAR(500),
  estado                       VARCHAR(30)  NOT NULL DEFAULT 'PENDIENTE'
                                 CHECK (estado IN ('PENDIENTE','EN_EVALUACION','APROBADO','RECHAZADO','SUBSANACION_PENDIENTE')),
  nivel_riesgo                 VARCHAR(10)  CHECK (nivel_riesgo IN ('BAJO','MEDIO','ALTO')),
  score_riesgo                 INTEGER,
  interpol_alerta_encontrada   BOOLEAN      NOT NULL DEFAULT FALSE,
  interpol_alerta_tipo         VARCHAR(50),
  interpol_alerta_detalle      TEXT,
  agente_asignado_id           UUID         REFERENCES agentes(id),
  created_at                   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- ============================================================
-- TABLA: dictamenes (decisiones del agente)
-- Art. 6 Num. 4 — El SNM autoriza, niega o prohíbe la entrada
-- ============================================================
CREATE TABLE IF NOT EXISTS dictamenes (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id  UUID        NOT NULL REFERENCES applications(id),
  agente_id      UUID        NOT NULL REFERENCES agentes(id),
  decision       VARCHAR(10) NOT NULL CHECK (decision IN ('APROBADO','RECHAZADO')),
  articulo_citado VARCHAR(100) NOT NULL,
  justificacion  TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: control_lists (listas INTERPOL, OFAC, países restringidos)
-- Art. 50 Num. 4 y 5 — Causales de rechazo por antecedentes y riesgo
-- ============================================================
CREATE TABLE IF NOT EXISTS control_lists (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_lista        VARCHAR(50) NOT NULL
                      CHECK (tipo_lista IN ('INTERPOL_RED_NOTICE','OFAC_SDN','PAIS_RESTRINGIDO')),
  numero_pasaporte  VARCHAR(20),
  nombre_completo   VARCHAR(300),
  codigo_pais       CHAR(2),
  descripcion_alerta TEXT,
  activo            BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_cl_nombre_trgm
  ON control_lists USING gin(nombre_completo gin_trgm_ops)
  WHERE nombre_completo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cl_tipo_activo
  ON control_lists(tipo_lista)
  WHERE activo = TRUE;

CREATE INDEX IF NOT EXISTS idx_cl_pais
  ON control_lists(codigo_pais)
  WHERE tipo_lista = 'PAIS_RESTRINGIDO' AND activo = TRUE;

CREATE INDEX IF NOT EXISTS idx_cl_pasaporte
  ON control_lists(numero_pasaporte)
  WHERE numero_pasaporte IS NOT NULL AND activo = TRUE;

-- ============================================================
-- TABLA: audit_log (WORM — Write-Once-Read-Many)
-- Art. 6 Num. 2 — Trazabilidad completa e inmutable
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  accion         VARCHAR(50) NOT NULL,
  usuario_id     UUID,
  expediente_id  UUID,
  detalles       JSONB,
  ip_origen      INET,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WORM: prohibir DELETE en audit_log
CREATE OR REPLACE FUNCTION fn_prevent_audit_delete()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Los registros de auditoría no pueden eliminarse (Art. 6 DL3/2008)';
END;
$$ LANGUAGE plpgsql;

-- WORM: prohibir UPDATE en audit_log
CREATE OR REPLACE FUNCTION fn_prevent_audit_update()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Los registros de auditoría no pueden modificarse (Art. 6 DL3/2008)';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_no_delete_audit ON audit_log;
CREATE TRIGGER trg_no_delete_audit
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_delete();

DROP TRIGGER IF EXISTS trg_no_update_audit ON audit_log;
CREATE TRIGGER trg_no_update_audit
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_update();

-- ============================================================
-- SEED: Países con atención especial en Panamá (PAIS_RESTRINGIDO)
-- Dec. Ej. 521/2018, Dec. Ej. 22/2025, Dec. Ej. 196/2024
-- ============================================================
INSERT INTO control_lists (tipo_lista, codigo_pais, descripcion_alerta, activo)
VALUES
  -- América
  ('PAIS_RESTRINGIDO', 'CU', 'Cuba — visa de tránsito especial obligatoria (Dec. Ej. No. 22 de 25 ago 2025, SNM Panamá).', TRUE),
  ('PAIS_RESTRINGIDO', 'VE', 'Venezuela — requisitos adicionales según Dec. Ej. 196 de 28 oct 2024, SNM Panamá.', TRUE),
  -- Asia
  ('PAIS_RESTRINGIDO', 'AF', 'Afganistán — lista de atención especial migratoria SNM Panamá (embassyofpanama.org/visas).', TRUE),
  ('PAIS_RESTRINGIDO', 'PK', 'Pakistán — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'IN', 'India — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'BD', 'Bangladesh — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'NP', 'Nepal — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'LK', 'Sri Lanka — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'AZ', 'Azerbaiyán — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'GE', 'Georgia — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'KZ', 'Kazajistán — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'KG', 'Kirguistán — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'TJ', 'Tayikistán — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'TM', 'Turkmenistán — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'UZ', 'Uzbekistán — lista de atención especial migratoria SNM Panamá.', TRUE),
  -- África
  ('PAIS_RESTRINGIDO', 'NG', 'Nigeria — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'SO', 'Somalia — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'SD', 'Sudán — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'ET', 'Etiopía — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'GH', 'Ghana — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'SN', 'Senegal — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'CM', 'Camerún — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'CD', 'R.D. Congo — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'ML', 'Mali — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'BF', 'Burkina Faso — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'NE', 'Níger — lista de atención especial migratoria SNM Panamá.', TRUE),
  ('PAIS_RESTRINGIDO', 'MR', 'Mauritania — lista de atención especial migratoria SNM Panamá.', TRUE)
ON CONFLICT DO NOTHING;
