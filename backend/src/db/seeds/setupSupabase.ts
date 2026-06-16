/**
 * Script de configuración inicial de Supabase.
 * Crea usuarios de prueba e inserta datos de control (INTERPOL/OFAC/países).
 * Ejecutar UNA VEZ: ts-node src/db/seeds/setupSupabase.ts
 */
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DEFAULT_PASSWORD = 'sidem2026';

async function setupUsers() {
  console.log('\n─── Creando usuarios de prueba ───');
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const users = [
    { email: 'admin@sidem-pan.gob.pa',   password_hash: hash, nombre_completo: 'Administrador SIDEM', rol: 'ADMIN' },
    { email: 'agente1@sidem-pan.gob.pa', password_hash: hash, nombre_completo: 'Carlos Rodríguez',   rol: 'AGENTE' },
    { email: 'agente2@sidem-pan.gob.pa', password_hash: hash, nombre_completo: 'Laura Martínez',     rol: 'AGENTE' },
  ];

  for (const u of users) {
    // Check if exists
    const { data: existing } = await supabase.from('agentes').select('id').eq('email', u.email).single();
    if (existing) {
      console.log(`  SKIP (ya existe): ${u.email}`);
      continue;
    }
    const { error } = await supabase.from('agentes').insert(u);
    if (error) console.error(`  ERROR al crear ${u.email}:`, error.message);
    else console.log(`  ✓ Creado: ${u.email} (${u.rol})`);
  }
}

async function setupControlLists() {
  console.log('\n─── Insertando datos de listas de control ───');

  // ── INTERPOL Red Notices de prueba (para escenario ALTO en demo) ──────────
  const interpolRecords = [
    {
      tipo_lista: 'INTERPOL_RED_NOTICE',
      numero_pasaporte: 'RF992847A',
      nombre_completo: 'Aleksei Morozov',
      codigo_pais: 'RU',
      descripcion_alerta: 'Red Notice INTERPOL — Aleksei Morozov, Nacionalidad: RU. Buscado por cargos de fraude financiero internacional. Control de terrorismo.',
      activo: true,
    },
    {
      tipo_lista: 'INTERPOL_RED_NOTICE',
      numero_pasaporte: 'HG774123B',
      nombre_completo: 'Ibrahim Al Rashidi',
      codigo_pais: 'IQ',
      descripcion_alerta: 'Red Notice INTERPOL — Ibrahim Al Rashidi. Buscado por financiamiento al terrorismo (Art. 50 Num. 4 y 5 DL3/2008).',
      activo: true,
    },
    {
      tipo_lista: 'INTERPOL_RED_NOTICE',
      numero_pasaporte: null,
      nombre_completo: 'Carlos Eduardo Vargas Mendoza',
      codigo_pais: 'CO',
      descripcion_alerta: 'Red Notice INTERPOL — Carlos Eduardo Vargas Mendoza. Buscado por tráfico de narcóticos a nivel internacional.',
      activo: true,
    },
  ];

  // ── OFAC SDN de prueba (para escenario MEDIO en demo) ─────────────────────
  const ofacRecords = [
    {
      tipo_lista: 'OFAC_SDN',
      numero_pasaporte: 'KL556234C',
      nombre_completo: 'Dmitri Volkov',
      codigo_pais: 'RU',
      descripcion_alerta: 'OFAC SDN — Dmitri Volkov. Sancionado por el Tesoro de EE.UU. por vínculos con redes de lavado de dinero (Art. 50 Num. 5 DL3/2008).',
      activo: true,
    },
    {
      tipo_lista: 'OFAC_SDN',
      numero_pasaporte: null,
      nombre_completo: 'Fatima Al Zahra Hussein',
      codigo_pais: 'IR',
      descripcion_alerta: 'OFAC SDN — Fatima Al Zahra Hussein. Designada por vínculos con entidades sancionadas por el Tesoro de EE.UU.',
      activo: true,
    },
  ];

  const allRecords = [...interpolRecords, ...ofacRecords];

  for (const record of allRecords) {
    // Check if exists by tipo_lista + (pasaporte OR nombre)
    let query = supabase.from('control_lists').select('id').eq('tipo_lista', record.tipo_lista);
    if (record.numero_pasaporte) {
      query = query.eq('numero_pasaporte', record.numero_pasaporte);
    } else {
      query = query.eq('nombre_completo', record.nombre_completo!);
    }
    const { data: existing } = await query.single();
    if (existing) {
      console.log(`  SKIP (ya existe): ${record.nombre_completo} [${record.tipo_lista}]`);
      continue;
    }

    const { error } = await supabase.from('control_lists').insert(record);
    if (error) console.error(`  ERROR: ${record.nombre_completo}:`, error.message);
    else console.log(`  ✓ Insertado: ${record.nombre_completo} [${record.tipo_lista}]`);
  }
}

async function main() {
  console.log('=== SIDEM-PAN — Setup Supabase ===');
  console.log(`Proyecto: ${process.env.SUPABASE_URL}`);

  await setupUsers();
  await setupControlLists();

  console.log('\n=== Setup completado ===');
  console.log('\nUsuarios de prueba (contraseña: sidem2026):');
  console.log('  admin@sidem-pan.gob.pa   → ADMIN');
  console.log('  agente1@sidem-pan.gob.pa → AGENTE');
  console.log('  agente2@sidem-pan.gob.pa → AGENTE');
  console.log('\nEscenarios de demo:');
  console.log('  ALTO (INTERPOL por pasaporte): pasaporte RF992847A, nombre cualquiera');
  console.log('  ALTO (INTERPOL por nombre):    nombre "Carlos Eduardo Vargas Mendoza"');
  console.log('  MEDIO (OFAC por pasaporte):    pasaporte KL556234C');
  console.log('  MEDIO (país restringido):      nacionalidad VE, CU, AF, PK, NG...');
  console.log('  BAJO:                          cualquier otro nombre/pasaporte/país');
}

main().catch((err) => {
  console.error('Setup falló:', err.message);
  process.exit(1);
});
