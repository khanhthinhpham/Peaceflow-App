import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, '../../db/seed/0005_experts.sql');

async function seedExperts() {
  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.query(sql);
    console.log(`Seeded experts from ${sqlPath}`);
  } finally {
    await db.end();
  }
}

seedExperts().catch((error) => {
  console.error('Seed experts failed:', error.message);
  process.exit(1);
});
