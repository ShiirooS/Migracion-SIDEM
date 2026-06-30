-- Agregar campo pais_restringido_encontrada para mostrar restricción de país en expedientes
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS pais_restringido_encontrada BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill para expedientes existentes
UPDATE applications a
SET pais_restringido_encontrada = TRUE
WHERE EXISTS (
  SELECT 1 FROM control_lists cl
  WHERE cl.tipo_lista = 'PAIS_RESTRINGIDO'
    AND cl.activo = TRUE
    AND cl.codigo_pais = a.nacionalidad_codigo
)
AND pais_restringido_encontrada = FALSE;
