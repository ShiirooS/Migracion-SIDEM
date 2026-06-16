// SCRUM-49: Daily cron job — pulls INTERPOL Red Notices from OpenSanctions and
// upserts them into control_lists. Runs at 02:00 UTC to avoid peak traffic.
import cron from 'node-cron';
import fetch from 'node-fetch';
import { supabase } from '../lib/supabase';
import { logAction } from '../services/audit';
import { invalidateControlListsCache } from '../services/control-lists-cache';

// OpenSanctions dataset endpoint for INTERPOL red notices
const OPENSANCTIONS_BASE =
  'https://data.opensanctions.org/datasets';
const DATASET = 'interpol_red_notices';

/** Format a Date as YYYY-MM-DD for the OpenSanctions URL */
function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

interface OpenSanctionsTarget {
  caption?: string;
  properties?: {
    passportNumber?: string[];
    nationality?: string[];
  };
}

interface ImportResult {
  inserted: number;
  errors: number;
  date_used: string;
}

/**
 * Fetch the OpenSanctions INTERPOL dataset for a given date.
 * Returns null if the response is not 200.
 */
async function fetchDataset(date: string): Promise<Response | null> {
  const url = `${OPENSANCTIONS_BASE}/${date}/${DATASET}/targets.nested.json`;
  console.log(`[cron] Fetching: ${url}`);

  // node-fetch Response is not the same as globalThis.Response — cast accordingly
  const resp = await fetch(url);
  if (!resp.ok) {
    console.warn(`[cron] HTTP ${resp.status} for date ${date}`);
    return null;
  }
  return resp as unknown as Response;
}

async function runImport(): Promise<ImportResult> {
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86_400_000));

  // Try today, fall back to yesterday
  let resp = await fetchDataset(today);
  let dateUsed = today;
  if (!resp) {
    resp = await fetchDataset(yesterday);
    dateUsed = yesterday;
  }
  if (!resp) {
    throw new Error('OpenSanctions dataset unavailable for today and yesterday');
  }

  const text = await resp.text();
  // Dataset is newline-delimited JSON (NDJSON)
  const lines = text.trim().split('\n').filter(Boolean);

  let inserted = 0;
  let errors = 0;

  // Deactivate all existing INTERPOL entries before re-inserting — clean slate strategy
  const { error: deactivateError } = await supabase
    .from('control_lists')
    .update({ activo: false })
    .eq('tipo_lista', 'INTERPOL_RED_NOTICE');

  if (deactivateError) {
    throw new Error(`Failed to deactivate existing entries: ${deactivateError.message}`);
  }

  for (const line of lines) {
    let target: OpenSanctionsTarget;
    try {
      target = JSON.parse(line) as OpenSanctionsTarget;
    } catch {
      errors++;
      continue;
    }

    const nombreCompleto = target.caption ?? null;
    if (!nombreCompleto) continue;

    const pasaportes = target.properties?.passportNumber ?? [];
    const nacionalidades = target.properties?.nationality ?? [];
    const numeroPasaporte = pasaportes[0] ?? null;
    const codigoPais = nacionalidades[0] ?? null;

    const row = {
      tipo_lista: 'INTERPOL_RED_NOTICE',
      nombre_completo: nombreCompleto,
      numero_pasaporte: numeroPasaporte,
      codigo_pais: codigoPais,
      descripcion_alerta: 'INTERPOL Red Notice',
      activo: true,
    };

    // Upsert: if the same name+type already exists (was just deactivated), reactivate it
    const { error: upsertError } = await supabase
      .from('control_lists')
      .upsert(row, { onConflict: 'nombre_completo,tipo_lista', ignoreDuplicates: false });

    if (upsertError) {
      console.error('[cron] upsert error:', upsertError.message);
      errors++;
    } else {
      inserted++;
    }
  }

  // Record import history
  await supabase.from('control_lists_updates').insert({
    tipo_lista: 'INTERPOL_RED_NOTICE',
    fecha_importacion: new Date().toISOString(),
    fecha_dataset: dateUsed,
    registros_insertados: inserted,
    registros_con_error: errors,
  });

  await logAction({
    accion: 'LISTA_IMPORTADA',
    detalles: { tipo: 'INTERPOL_RED_NOTICE', inserted, errors, date_used: dateUsed },
  });

  // Bust the risk-engine cache so next scoring uses fresh data
  invalidateControlListsCache();

  return { inserted, errors, date_used: dateUsed };
}

/** Registers the daily cron job. Called from index.ts at startup. */
export function startCronJobs(): void {
  // '0 2 * * *' → 02:00 UTC every day
  cron.schedule('0 2 * * *', async () => {
    console.log('[cron] Starting INTERPOL/OFAC list update...');
    try {
      const result = await runImport();
      console.log(`[cron] Import complete:`, result);
    } catch (err) {
      console.error('[cron] Import failed:', err);
    }
  });

  console.log('[cron] Scheduled: control-lists update at 02:00 UTC daily');
}
