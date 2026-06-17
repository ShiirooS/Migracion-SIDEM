import bcrypt from 'bcrypt';
import pool from '../pool';

// Contraseña por defecto para todos los usuarios de prueba
const DEFAULT_PASSWORD = 'Admin2026!';

async function seed() {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  await pool.query(
    `INSERT INTO agentes (email, password_hash, nombre_completo, rol)
     VALUES
       ('admin@sidem-pan.gob.pa',   $1, 'Administrador SIDEM', 'ADMIN'),
       ('agente1@sidem-pan.gob.pa', $1, 'Carlos Rodríguez',   'AGENTE'),
       ('agente2@sidem-pan.gob.pa', $1, 'Laura Martínez',     'AGENTE')
     ON CONFLICT (email) DO NOTHING`,
    [hash]
  );

  console.log('Seed data inserted.');
  console.log('Usuarios de prueba (contraseña: sidem2026):');
  console.log('  admin@sidem-pan.gob.pa   (ADMIN)');
  console.log('  agente1@sidem-pan.gob.pa (AGENTE)');
  console.log('  agente2@sidem-pan.gob.pa (AGENTE)');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
