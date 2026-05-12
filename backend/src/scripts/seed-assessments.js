import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, '../../db/seed/0002_assessments.sql');

async function seedAssessments() {
  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.query(sql);
    console.log(`Seeded assessments from ${sqlPath}`);
  } finally {
    await db.end();
  }
}

seedAssessments().catch((error) => {
  console.error('Seed assessments failed:', error.message);
  process.exit(1);
});
