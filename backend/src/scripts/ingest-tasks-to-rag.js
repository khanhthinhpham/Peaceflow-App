/**
 * Đọc tất cả bài tập active từ DB, format thành text, upload lên RAG platform.
 * Chạy lại mỗi khi thêm/cập nhật bài tập hàng loạt.
 *
 * npm run rag:ingest
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

const BASE_URL   = process.env.RAG_BASE_URL  || 'https://noetic-edda-sometimes.ngrok-free.dev';
const ADMIN_KEY  = process.env.RAG_ADMIN_KEY;
const TENANT_ID  = process.env.RAG_TENANT_ID || 'peaceflow';

if (!ADMIN_KEY) {
    console.error('Thiếu RAG_ADMIN_KEY trong .env');
    process.exit(1);
}

async function fetchTasks() {
    const { rows } = await db.query(`
        SELECT title, category, difficulty, duration_minutes,
               description, steps, tags, triggers_supported, safety_notes
        FROM tasks
        WHERE active = true
        ORDER BY category, title
    `);
    return rows;
}

function formatTask(t) {
    const lines = [
        `=== ${t.title} ===`,
        `Loại bài tập: ${t.category}`,
        `Độ khó: ${t.difficulty}`,
        `Thời lượng: ${t.duration_minutes} phút`,
    ];

    if (t.description) {
        lines.push(`Mô tả: ${t.description}`);
    }

    if (Array.isArray(t.steps) && t.steps.length) {
        lines.push('Hướng dẫn thực hiện:');
        t.steps.forEach((s, i) => {
            const text = typeof s === 'string' ? s : s.text ?? s.instruction ?? JSON.stringify(s);
            lines.push(`  Bước ${i + 1}: ${text}`);
        });
    }

    if (Array.isArray(t.triggers_supported) && t.triggers_supported.length) {
        lines.push(`Phù hợp khi: ${t.triggers_supported.join(', ')}`);
    }

    if (Array.isArray(t.tags) && t.tags.length) {
        lines.push(`Từ khóa: ${t.tags.join(', ')}`);
    }

    if (Array.isArray(t.safety_notes) && t.safety_notes.length) {
        lines.push(`Lưu ý an toàn: ${t.safety_notes.join('. ')}`);
    }

    return lines.join('\n');
}

function buildContent(tasks) {
    const byCategory = {};
    for (const t of tasks) {
        if (!byCategory[t.category]) byCategory[t.category] = [];
        byCategory[t.category].push(t);
    }

    const sections = ['PEACEFLOW — THƯ VIỆN BÀI TẬP SỨC KHỎE TÂM THẦN', '='.repeat(60), ''];

    for (const [category, items] of Object.entries(byCategory)) {
        sections.push(`\n## NHÓM: ${category.toUpperCase()} (${items.length} bài)\n`);
        for (const t of items) {
            sections.push(formatTask(t));
            sections.push('');
        }
    }

    return sections.join('\n');
}

async function uploadToRAG(content) {
    const form = new FormData();
    form.append('tenant_id', TENANT_ID);
    form.append('files', new Blob([content], { type: 'text/plain' }), 'peaceflow-tasks.txt');

    const res = await fetch(`${BASE_URL}/ingest/upload`, {
        method: 'POST',
        headers: { 'X-Admin-Key': ADMIN_KEY },
        body: form,
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Upload thất bại ${res.status}: ${err}`);
    }

    return res.json();
}

async function main() {
    console.log(`RAG: ${BASE_URL} | Tenant: ${TENANT_ID}\n`);

    console.log('Đọc tasks từ DB...');
    const tasks = await fetchTasks();
    console.log(`  → ${tasks.length} tasks`);

    if (!tasks.length) {
        console.log('Không có task nào trong DB.');
        await db.end();
        return;
    }

    const content = buildContent(tasks);
    console.log(`  → ${content.length} ký tự nội dung\n`);

    console.log('Upload lên RAG...');
    const result = await uploadToRAG(content);
    console.log('Kết quả:', JSON.stringify(result, null, 2));

    await db.end();
    console.log('\n✓ Hoàn thành!');
}

main().catch(err => { console.error(err.message); process.exit(1); });
