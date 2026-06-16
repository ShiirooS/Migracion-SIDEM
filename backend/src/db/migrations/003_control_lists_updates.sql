-- SCRUM-49: Historial de importaciones de listas de control
CREATE TABLE IF NOT EXISTS control_lists_updates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_lista      text NOT NULL,
  fecha_importacion timestamptz NOT NULL DEFAULT now(),
  fecha_dataset   date NOT NULL,
  registros_insertados integer NOT NULL DEFAULT 0,
  registros_con_error  integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_control_lists_updates_tipo
  ON control_lists_updates(tipo_lista, created_at DESC);
