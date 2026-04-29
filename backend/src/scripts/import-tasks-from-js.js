import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tasksFilePath = path.resolve(__dirname, '../../../frontend/public/js/tasks-data.js');
const envPath = path.resolve(process.cwd(), '.env');

// Manual env loading to avoid ESM issues with dotenv in this environment
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
  console.log('Current env detected:', env);
  process.exit(1);
}

async function importTasks() {
  console.log('Starting task import to Supabase...');
  console.log('Target URL:', SUPABASE_URL);

  try {
    const fileContent = fs.readFileSync(tasksFilePath, 'utf8');
    
    const match = fileContent.match(/const TASKS\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
      throw new Error('Could not find TASKS array in tasks-data.js');
    }

    let tasksJson = match[1];
    tasksJson = tasksJson.replace(/,\s*([\]}])/g, '$1');

    const tasks = JSON.parse(tasksJson);
    console.log(`Found ${tasks.length} tasks to import.`);

    let importedCount = 0;
    let errorCount = 0;

    for (const task of tasks) {
      try {
        let durationMinutes = 5; 
        if (task.timerSec) {
          durationMinutes = Math.ceil(task.timerSec / 60);
        } else if (task.timer) {
          durationMinutes = Math.ceil(task.timer / 60);
        } else if (task.time) {
          const minMatch = task.time.match(/(\d+)/);
          if (minMatch) durationMinutes = parseInt(minMatch[1], 10);
        }

        const taskData = {
          code: task.id,
          title: (task.title || task.name || '').substring(0, 255),
          category: task.cat,
          difficulty: task.cat,
          duration_minutes: durationMinutes,
          xp_reward: task.xp || 0,
          description: task.desc || '',
          steps: task.steps || [],
          safety_notes: task.safety_notes || [],
          tags: task.tags || [],
          active: true,
          metadata: {
            icon: task.icon,
            catLabel: task.catLabel,
            benefits: task.benefits,
            quote: task.quote,
            preparation: task.preparation,
            objective: task.objective
          }
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/tasks?on_conflict=code`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(taskData)
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        importedCount++;
        if (importedCount % 20 === 0) {
          process.stdout.write('.');
        }
      } catch (err) {
        console.error(`\nError importing task ${task.id}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\nImport complete! Successfully imported: ${importedCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('Import failed:', error.message);
  }
}

importTasks();
