import fs from 'fs';
import path from 'path';
import pool from './pool';

async function migrate() {
  const sqlPath = path.join(__dirname, 'migrations', '001_initial.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  console.log('Running migration 001_initial.sql...');
  await pool.query(sql);
  console.log('Migration completed successfully.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
