const SUPABASE_URL = 'https://ccymyblzvdyvemcnuwmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FMh8PYXvqdd_7uGuahgABw_XKkMndUd';

const tables = [
    'users',
    'user_profiles',
    'mood_checkins',
    'assessments',
    'assessment_results',
    'tasks',
    'user_task_assignments',
    'task_completions',
    'journal_entries',
    'user_progress',
    'badges',
    'user_badges',
    'risk_snapshots'
];

async function checkTable(tableName) {
    const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*&limit=1`;
    try {
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            console.log(`✅ Table [${tableName}] exists.`);
            return true;
        } else {
            const err = await response.json().catch(() => ({ message: 'No JSON' }));
            console.log(`❌ Table [${tableName}] missing or error: ${response.status} - ${err.message}`);
            return false;
        }
    } catch (e) {
        console.log(`❌ Error checking [${tableName}]: ${e.message}`);
        return false;
    }
}

async function main() {
    console.log('Checking tables on Supabase...');
    for (const table of tables) {
        await checkTable(table);
    }
}

main();
