-- Corregir expedientes donde OFAC quedó guardado en campos interpol_alerta_*
-- Registros creados antes de que existieran los campos ofac_alerta_*
UPDATE applications
SET
  ofac_alerta_encontrada     = TRUE,
  ofac_alerta_detalle        = interpol_alerta_detalle,
  interpol_alerta_encontrada = FALSE,
  interpol_alerta_tipo       = NULL,
  interpol_alerta_detalle    = NULL
WHERE interpol_alerta_tipo = 'OFAC_SDN';
