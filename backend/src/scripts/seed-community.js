import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, '../../db/seed/0006_community_demo.sql');

async function seedCommunity() {
  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.query(sql);
    console.log(`Seeded community posts from ${sqlPath}`);
  } finally {
    await db.end();
  }
}

seedCommunity().catch((error) => {
  console.error('Seed community failed:', error.message);
  process.exit(1);
});
