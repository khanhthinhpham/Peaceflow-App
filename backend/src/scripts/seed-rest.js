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

async function seedBadges() {
  console.log('Seeding Badges...');
  const badges = [
    { code: 'first_task', name: 'Mầm Non', description: 'Hoàn thành nhiệm vụ đầu tiên', criteria: {type:'task_count',value:1}, icon: '🌱', rarity: 'common' },
    { code: 'streak_7', name: 'Cây Con', description: 'Duy trì streak 7 ngày', criteria: {type:'streak',value:7}, icon: '🌿', rarity: 'uncommon' },
    { code: 'streak_30', name: 'Cây Lớn', description: 'Duy trì streak 30 ngày', criteria: {type:'streak',value:30}, icon: '🌳', rarity: 'rare' },
    { code: 'meditate_10', name: 'Thiền Sư Giấy', description: 'Hoàn thành 10 bài thiền', criteria: {type:'task_tag_count',tag:'meditation',value:10}, icon: '🧘', rarity: 'rare' },
    { code: 'hard_5', name: 'Chiến Binh', description: 'Hoàn thành 5 nhiệm vụ khó', criteria: {type:'task_difficulty_count',difficulty:'hard',value:5}, icon: '💪', rarity: 'rare' },
    { code: 'kind_10', name: 'Người Tử Tế', description: 'Làm 10 hành động tử tế', criteria: {type:'task_tag_count',tag:'kindness',value:10}, icon: '❤️', rarity: 'uncommon' },
    { code: 'crisis_over', name: 'Người Leo Núi', description: 'Vượt qua giai đoạn khủng hoảng', criteria: {type:'crisis_recovery',value:1}, icon: '🏔️', rarity: 'epic' },
    { code: 'xp_500', name: 'Ngôi Sao', description: 'Đạt 500 XP', criteria: {type:'xp',value:500}, icon: '🌟', rarity: 'rare' }
  ];

  for (const badge of badges) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/badges?on_conflict=code`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(badge)
    });
    if (!response.ok) console.error(`Error badge ${badge.code}:`, await response.text());
  }
  console.log('Badges seeded.');
}

async function seedAssessments() {
  console.log('Seeding Assessments...');
  const assessments = [
    {
      code: 'GAD7',
      name: 'Generalized Anxiety Disorder 7',
      version: '1.0',
      description: 'Sàng lọc mức độ lo âu trong 2 tuần gần đây',
      question_schema: [
        {key:'q1',label:'Cảm thấy lo lắng, bồn chồn hoặc căng thẳng',type:'scale_0_3'},
        {key:'q2',label:'Không thể ngừng hoặc kiểm soát sự lo lắng',type:'scale_0_3'},
        {key:'q3',label:'Lo lắng quá nhiều về nhiều việc khác nhau',type:'scale_0_3'},
        {key:'q4',label:'Khó thư giãn',type:'scale_0_3'},
        {key:'q5',label:'Bồn chồn đến mức khó ngồi yên',type:'scale_0_3'},
        {key:'q6',label:'Dễ cáu gắt hoặc khó chịu',type:'scale_0_3'},
        {key:'q7',label:'Cảm thấy sợ hãi như có điều tồi tệ sắp xảy ra',type:'scale_0_3'}
      ],
      scoring_rules: {method:'sum',range:[0,21]},
      interpretation_rules: {
        bands:[
          {min:0,max:4,label:'minimal'},
          {min:5,max:9,label:'mild'},
          {min:10,max:14,label:'moderate'},
          {min:15,max:21,label:'severe'}
        ]
      },
      active: true
    },
    {
      code: 'PHQ9',
      name: 'Patient Health Questionnaire 9',
      version: '1.0',
      description: 'Sàng lọc triệu chứng trầm cảm trong 2 tuần gần đây',
      question_schema: [
        {key:'q1',label:'Ít hứng thú hoặc ít niềm vui khi làm mọi việc',type:'scale_0_3'},
        {key:'q2',label:'Cảm thấy buồn, chán nản hoặc tuyệt vọng',type:'scale_0_3'},
        {key:'q3',label:'Khó ngủ, ngủ không yên hoặc ngủ quá nhiều',type:'scale_0_3'},
        {key:'q4',label:'Cảm thấy mệt mỏi hoặc ít năng lượng',type:'scale_0_3'},
        {key:'q5',label:'Ăn kém ngon hoặc ăn quá nhiều',type:'scale_0_3'},
        {key:'q6',label:'Cảm thấy bản thân tệ, thất bại hoặc làm gia đình thất vọng',type:'scale_0_3'},
        {key:'q7',label:'Khó tập trung vào việc đọc báo hoặc xem TV',type:'scale_0_3'},
        {key:'q8',label:'Di chuyển/nói chậm bất thường hoặc bồn chồn hơn thường lệ',type:'scale_0_3'},
        {key:'q9',label:'Có ý nghĩ rằng tốt hơn là nên chết đi hoặc tự làm hại bản thân',type:'scale_0_3'}
      ],
      scoring_rules: {method:'sum',range:[0,27]},
      interpretation_rules: {
        bands:[
          {min:0,max:4,label:'minimal'},
          {min:5,max:9,label:'mild'},
          {min:10,max:14,label:'moderate'},
          {min:15,max:19,label:'moderately_severe'},
          {min:20,max:27,label:'severe'}
        ],
        critical_item:'q9'
      },
      active: true
    }
  ];

  for (const ass of assessments) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/assessments?on_conflict=code`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(ass)
    });
    if (!response.ok) console.error(`Error assessment ${ass.code}:`, await response.text());
  }
  console.log('Assessments seeded.');
}

async function run() {
  await seedBadges();
  await seedAssessments();
}

run();
