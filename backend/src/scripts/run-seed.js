import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(process.cwd(), '.env');

// Manual env loading
const env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const SUPABASE_URL = env.SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

async function runSeed() {
  const seedFiles = [
    'supabase/seed/0001_badges.sql',
    'supabase/seed/0002_assessments.sql',
    'supabase/seed/0003_demo_tasks.sql'
  ];

  console.log('Starting Supabase seeding...');

  for (const file of seedFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: Seed file not found: ${file}`);
      continue;
    }

    console.log(`Processing ${file}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      // Use the RPC call for executing arbitrary SQL if exec_sql exists
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Error running ${file}: ${response.status} ${errText}`);
      } else {
        console.log(`Successfully applied ${file}`);
      }
    } catch (err) {
      console.error(`Request failed for ${file}:`, err.message);
    }
  }
}

runSeed();
