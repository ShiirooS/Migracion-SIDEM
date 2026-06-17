/**
 * Migration runner via Supabase project SQL endpoint.
 * Uses the project REST API with service_role key.
 * Run with: cd backend && ts-node scripts/apply-migrations.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!; // https://wlzrvuwuhbtrjobcarar.supabase.co
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const migrations = [
  '002_performance_indexes.sql',
  '003_control_lists_updates.sql',
];

async function applyMigration(filename: string, sql: string): Promise<void> {
  // Supabase exposes a SQL runner at /rest/v1/rpc/... but DDL must go through
  // the pg endpoint. For projects without exec_sql RPC, we use the Supabase
  // pg query endpoint exposed at /pg/query (available with service_role).
  const resp = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await resp.text();
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${body}`);
  }

  console.log(`  OK — ${filename}`);
}

async function run() {
  for (const filename of migrations) {
    const sql = readFileSync(
      join(__dirname, '../src/db/migrations', filename),
      'utf8'
    );
    console.log(`Applying: ${filename}`);
    try {
      await applyMigration(filename, sql);
    } catch (err) {
      console.error(`  FAILED: ${err}`);
    }
  }
}

run().catch(console.error);
