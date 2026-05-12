import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../../db/migrations');

async function ensureMigrationsTable() {
  await db.query(`
    create table if not exists schema_migrations (
      filename varchar(255) primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function getAppliedMigrations() {
  const result = await db.query(`select filename from schema_migrations order by filename asc`);
  return new Set(result.rows.map((row) => row.filename));
}

async function applyMigration(filename) {
  const fullPath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(fullPath, 'utf8');
  const client = await db.connect();

  try {
    await client.query('begin');
    await client.query(sql);
    await client.query(
      `insert into schema_migrations (filename) values ($1) on conflict (filename) do nothing`,
      [filename]
    );
    await client.query('commit');
    console.log(`Applied migration: ${filename}`);
  } catch (error) {
    await client.query('rollback');
    throw new Error(`${filename}: ${error.message}`);
  } finally {
    client.release();
  }
}

async function runMigrations() {
  try {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();

    const files = fs.readdirSync(migrationsDir)
      .filter((filename) => filename.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    for (const filename of files) {
      if (applied.has(filename)) continue;
      await applyMigration(filename);
    }

    console.log('Migrations completed.');
  } finally {
    await db.end();
  }
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
