/**
 * SCRUM-35: Importación de alertas INTERPOL/OFAC desde OpenSanctions
 * Uso: ts-node scripts/import-interpol.ts
 * Fuente: https://data.opensanctions.org/datasets/latest/interpol_red_notices/targets.simple.csv
 */
import { createClient } from '@supabase/supabase-js';
import * as https from 'https';
import * as readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SOURCES = {
  INTERPOL_RED_NOTICE: 'https://data.opensanctions.org/datasets/latest/interpol_red_notices/targets.simple.csv',
  OFAC_SDN: 'https://data.opensanctions.org/datasets/latest/us_ofac_sdn/targets.simple.csv',
};

async function fetchCSVLines(url: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const lines: string[] = [];
    https.get(url, (res) => {
      const rl = readline.createInterface({ input: res });
      rl.on('line', (line) => lines.push(line));
      rl.on('close', () => resolve(lines));
      rl.on('error', reject);
    }).on('error', reject);
  });
}

async function importarFuente(tipo: keyof typeof SOURCES) {
  console.log(`\nImportando ${tipo}...`);
  const lines = await fetchCSVLines(SOURCES[tipo]);

  if (lines.length < 2) {
    console.log('  Sin datos.');
    return;
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const nameIdx = headers.findIndex((h) => h.includes('name'));
  const passIdx = headers.findIndex((h) => h.includes('passport') || h.includes('document'));

  const records: { tipo_lista: string; nombre_completo?: string; numero_pasaporte?: string; descripcion_alerta: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const nombre = nameIdx >= 0 ? cols[nameIdx]?.trim().replace(/^"|"$/g, '') : undefined;
    const pasaporte = passIdx >= 0 ? cols[passIdx]?.trim().replace(/^"|"$/g, '') : undefined;

    if (!nombre && !pasaporte) continue;

    records.push({
      tipo_lista: tipo,
      nombre_completo: nombre || undefined,
      numero_pasaporte: pasaporte || undefined,
      descripcion_alerta: `${tipo} — importado de OpenSanctions`,
    });
  }

  // Insertar en lotes de 500
  let inserted = 0;
  for (let i = 0; i < records.length; i += 500) {
    const batch = records.slice(i, i + 500);
    const { error } = await supabase.from('control_lists').insert(batch);
    if (error) {
      console.error(`  Error en lote ${i}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`  ${inserted} / ${records.length} registros importados.`);
}

async function main() {
  console.log('=== SIDEM-PAN: Importación INTERPOL/OFAC ===');
  await importarFuente('INTERPOL_RED_NOTICE');
  await importarFuente('OFAC_SDN');
  console.log('\nImportación completada.');
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
