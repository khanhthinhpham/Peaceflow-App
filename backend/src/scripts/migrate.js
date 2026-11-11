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

// Không để migration treo im lặng: chờ khoá bảng tối đa 15s, mỗi câu lệnh tối đa 120s.
// Bị chặn → in ra truy vấn nào đang giữ khoá để biết đường xử lý.
const LOCK_TIMEOUT = process.env.MIGRATE_LOCK_TIMEOUT || '15s';
const STATEMENT_TIMEOUT = process.env.MIGRATE_STATEMENT_TIMEOUT || '120s';

async function diagnoseLocks() {
  try {
    const r = await db.query(`
      select pid, state, wait_event_type, wait_event,
             extract(epoch from now() - coalesce(xact_start, query_start))::int as secs,
             left(regexp_replace(query, '\\s+', ' ', 'g'), 90) as query,
             pg_blocking_pids(pid) as blocked_by
      from pg_stat_activity
      where datname = current_database() and pid <> pg_backend_pid()
        and (state <> 'idle' or xact_start is not null)
      order by secs desc nulls last limit 15`);
    console.log('  Các kết nối đang hoạt động / giữ giao dịch:');
    console.table(r.rows);
    console.log('  Gợi ý: kết nối "idle in transaction" lâu hoặc truy vấn dài đang giữ khoá. Tắt tạm tiến trình đó');
    console.log('  (hoặc trong Supabase SQL Editor: select pg_terminate_backend(<pid>);) rồi chạy lại npm run migrate.');
  } catch (e) {
    console.log('  (không lấy được thông tin khoá:', e.message, ')');
  }
}

async function applyMigration(filename) {
  const fullPath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(fullPath, 'utf8');
  console.log(`Applying migration: ${filename} ...`);
  const client = await db.connect();

  try {
    await client.query('begin');
    await client.query(`set local lock_timeout = '${LOCK_TIMEOUT}'`);
    await client.query(`set local statement_timeout = '${STATEMENT_TIMEOUT}'`);
    await client.query(sql);
    await client.query(
      `insert into schema_migrations (filename) values ($1) on conflict (filename) do nothing`,
      [filename]
    );
    await client.query('commit');
    console.log(`Applied migration: ${filename}`);
  } catch (error) {
    await client.query('rollback').catch(() => {});
    if (/lock timeout|statement timeout|canceling statement/i.test(error.message)) {
      console.log(`  ✗ ${filename} bị chặn: ${error.message}`);
      await diagnoseLocks();
    }
    throw new Error(`${filename}: ${error.message}`);
  } finally {
    client.release();
  }
}

async function runMigrations() {
  try {
    console.log('Connecting to database ...');
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();
    console.log(`Connected. ${applied.size} migration(s) already applied.`);

    const files = fs.readdirSync(migrationsDir)
      .filter((filename) => filename.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    const pending = files.filter((f) => !applied.has(f));
    console.log(pending.length ? `Pending: ${pending.join(', ')}` : 'Nothing to apply.');
    for (const filename of pending) {
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
