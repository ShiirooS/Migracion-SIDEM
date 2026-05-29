-- ============================================================
-- SIDEM-PAN — Seed de datos de prueba para demo
-- Ejecutar DESPUES de la migración 001_initial_schema.sql
-- ============================================================

-- Agente ADMIN
INSERT INTO agentes (email, password_hash, nombre_completo, rol, activo)
VALUES (
  'admin@sidem-pan.gob.pa',
  -- Hash bcrypt de 'Admin2026!' — cambiar en produccion
  '$2b$10$X9fJ5RwE.mQ7kLpN3vYuO.hGZiKsDtMnPrQ8sV4wX1yA6jB2cE5dG',
  'Administrador SIDEM-PAN',
  'ADMIN',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Agente de Cumplimiento 1
INSERT INTO agentes (email, password_hash, nombre_completo, rol, activo)
VALUES (
  'agente1@sidem-pan.gob.pa',
  '$2b$10$X9fJ5RwE.mQ7kLpN3vYuO.hGZiKsDtMnPrQ8sV4wX1yA6jB2cE5dG',
  'Ana Patricia Lopez',
  'AGENTE',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Agente de Cumplimiento 2
INSERT INTO agentes (email, password_hash, nombre_completo, rol, activo)
VALUES (
  'agente2@sidem-pan.gob.pa',
  '$2b$10$X9fJ5RwE.mQ7kLpN3vYuO.hGZiKsDtMnPrQ8sV4wX1yA6jB2cE5dG',
  'Carlos Eduardo Reyes',
  'AGENTE',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- NOTA: La contrasena para todos los usuarios de prueba es 'Admin2026!'
-- Regenera los hashes con: node -e "const b=require('bcrypt');b.hash('Admin2026!',10).then(console.log)"
-- antes de usar en produccion.

SELECT 'Seed completado: ' || COUNT(*) || ' agentes registrados' AS resultado FROM agentes;
