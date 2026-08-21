import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPaths = [
  path.resolve(__dirname, '../../db/seed/0002_assessments.sql'),
  path.resolve(__dirname, '../../db/seed/0003_assessments_extra.sql'),
  path.resolve(__dirname, '../../db/seed/0004_assessments_extra2.sql')
];

async function seedAssessments() {
  try {
    for (const sqlPath of sqlPaths) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await db.query(sql);
      console.log(`Seeded assessments from ${sqlPath}`);
    }
  } finally {
    await db.end();
  }
}

seedAssessments().catch((error) => {
  console.error('Seed assessments failed:', error.message);
  process.exit(1);
});
