-- Unificar función buscar_interpol_nombre eliminando overload conflictivo
-- El overload VARCHAR del Sprint 3 y el TEXT creado en la migración 001
-- causaban que PostgREST no pudiera resolver cuál llamar (null silencioso)
DROP FUNCTION IF EXISTS buscar_interpol_nombre(VARCHAR);
DROP FUNCTION IF EXISTS buscar_interpol_nombre(TEXT);

CREATE OR REPLACE FUNCTION buscar_interpol_nombre(p_nombre TEXT)
RETURNS TABLE (
  numero_pasaporte   VARCHAR,
  nombre_completo    VARCHAR,
  descripcion_alerta TEXT
) LANGUAGE sql STABLE AS $$
  SELECT
    cl.numero_pasaporte,
    cl.nombre_completo,
    cl.descripcion_alerta
  FROM control_lists cl
  WHERE cl.tipo_lista = 'INTERPOL_RED_NOTICE'
    AND cl.activo = TRUE
    AND cl.nombre_completo IS NOT NULL
    AND SIMILARITY(cl.nombre_completo, p_nombre) > 0.75
  ORDER BY SIMILARITY(cl.nombre_completo, p_nombre) DESC
  LIMIT 3;
$$;
