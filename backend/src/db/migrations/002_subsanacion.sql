-- RF07: Flujo de subsanación de documentos
-- Agregar columnas para razon y fecha de subsanación

ALTER TABLE applications
  ADD COLUMN razon_subsanacion TEXT,
  ADD COLUMN fecha_subsanacion_solicitada TIMESTAMPTZ;
