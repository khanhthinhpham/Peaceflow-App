import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from '../config/db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tasksFilePath = path.resolve(__dirname, '../../../frontend/public/js/tasks-data.js');

async function importTasks() {
  console.log('Starting task import to PostgreSQL...');

  try {
    const fileContent = fs.readFileSync(tasksFilePath, 'utf8');
    const match = fileContent.match(/const TASKS\s*=\s*(\[[\s\S]*?\]);/);

    if (!match) {
      throw new Error('Could not find TASKS array in tasks-data.js');
    }

    const tasksJson = match[1].replace(/,\s*([\]}])/g, '$1');
    const tasks = JSON.parse(tasksJson);

    let importedCount = 0;
    let errorCount = 0;

    for (const task of tasks) {
      try {
        const durationMinutes = getDurationMinutes(task);
        const values = [
          task.id,
          (task.title || task.name || '').substring(0, 255),
          task.cat || 'general',
          task.difficulty || task.cat || 'easy',
          durationMinutes,
          task.xp || 0,
          task.desc || '',
          JSON.stringify(task.steps || []),
          JSON.stringify(task.safety_notes || []),
          JSON.stringify(task.tags || []),
          JSON.stringify(task.triggers_supported || []),
          JSON.stringify(task.contraindications || []),
          JSON.stringify({
            icon: task.icon,
            catLabel: task.catLabel,
            benefits: task.benefits,
            quote: task.quote,
            preparation: task.preparation,
            objective: task.objective
          })
        ];

        await db.query(
          `insert into tasks
            (code, title, category, difficulty, duration_minutes, xp_reward, description,
             steps, safety_notes, tags, triggers_supported, contraindications, active, metadata)
           values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, true, $13::jsonb)
           on conflict (code) do update
           set title = excluded.title,
               category = excluded.category,
               difficulty = excluded.difficulty,
               duration_minutes = excluded.duration_minutes,
               xp_reward = excluded.xp_reward,
               description = excluded.description,
               steps = excluded.steps,
               safety_notes = excluded.safety_notes,
               tags = excluded.tags,
               triggers_supported = excluded.triggers_supported,
               contraindications = excluded.contraindications,
               active = excluded.active,
               metadata = excluded.metadata,
               updated_at = now()`,
          values
        );

        importedCount++;
      } catch (error) {
        console.error(`Error importing task ${task.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`Import complete. Imported: ${importedCount}, errors: ${errorCount}`);
  } finally {
    await db.end();
  }
}

function getDurationMinutes(task) {
  if (task.timerSec) return Math.ceil(task.timerSec / 60);
  if (task.timer) return Math.ceil(task.timer / 60);
  if (task.time) {
    const minMatch = task.time.match(/(\d+)/);
    if (minMatch) return parseInt(minMatch[1], 10);
  }
  return 5;
}

importTasks().catch(error => {
  console.error('Import failed:', error.message);
  process.exit(1);
});
