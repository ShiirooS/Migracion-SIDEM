-- ============================================================
-- SIDEM-PAN — Migración 002: Corrección alertas INTERPOL/OFAC
-- Fix: función RPC buscar_interpol_nombre + columnas OFAC separadas
-- ============================================================

-- 1. Función fuzzy para búsqueda INTERPOL por nombre
--    pg_trgm ya habilitado en migración 001
CREATE OR REPLACE FUNCTION buscar_interpol_nombre(p_nombre VARCHAR)
RETURNS TABLE (
  numero_pasaporte   VARCHAR,
  nombre_completo    VARCHAR,
  descripcion_alerta TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.numero_pasaporte,
    cl.nombre_completo,
    cl.descripcion_alerta
  FROM control_lists cl
  WHERE cl.tipo_lista = 'INTERPOL_RED_NOTICE'
    AND cl.activo = TRUE
    AND cl.nombre_completo IS NOT NULL
    AND SIMILARITY(cl.nombre_completo, p_nombre) > 0.85
  ORDER BY SIMILARITY(cl.nombre_completo, p_nombre) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Columnas dedicadas para alerta OFAC en applications
--    Antes, la alerta OFAC se descartaba silenciosamente si INTERPOL también coincidía
--    (el campo interpol_alerta_tipo solo almacenaba una de las dos)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS ofac_alerta_encontrada BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ofac_alerta_detalle    TEXT;
