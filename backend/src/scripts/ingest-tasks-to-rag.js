/**
 * Đọc từng bài tập từ DB, mỗi bài tạo 1 file PDF riêng, upload lên RAG.
 * Chạy lại khi thêm/cập nhật bài tập.
 *
 * npm run rag:ingest
 */

import 'dotenv/config';
import pg from 'pg';
import PDFDocument from 'pdfkit';
import { existsSync } from 'fs';

const { Pool } = pg;
const db = new Pool({ connectionString: process.env.DATABASE_URL });

const BASE_URL  = process.env.RAG_BASE_URL || 'https://noetic-edda-sometimes.ngrok-free.dev';
const ADMIN_KEY = process.env.RAG_ADMIN_KEY;
const TENANT_ID = process.env.RAG_TENANT_ID || 'peaceflow';

if (!ADMIN_KEY) {
    console.error('Thiếu RAG_ADMIN_KEY trong .env');
    process.exit(1);
}

const FONT_PATH = 'C:\\Windows\\Fonts\\arial.ttf';
const FONT = existsSync(FONT_PATH) ? FONT_PATH : 'Helvetica';

const MARGIN = 50;
const PAGE_W = 595.28;
const CONTENT_W = PAGE_W - MARGIN * 2;

async function fetchTasks() {
    const { rows } = await db.query(`
        SELECT code, title, category, difficulty, duration_minutes,
               description, steps, tags, triggers_supported, safety_notes
        FROM tasks
        WHERE active = true
        ORDER BY category, code
    `);
    return rows;
}

function stepText(s) {
    return typeof s === 'string' ? s : s.text ?? s.instruction ?? JSON.stringify(s);
}

function generateTaskPDF(task) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.font(FONT);

        // Tiêu đề
        doc.fontSize(16).text(task.title, { align: 'left' });
        doc.moveDown(0.3);

        // Đường kẻ ngang
        doc.moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).lineWidth(0.8).stroke();
        doc.moveDown(0.6);

        // Metadata
        doc.fontSize(10).text(
            `Danh mục: ${task.category}  |  Độ khó: ${task.difficulty}  |  Thời lượng: ${task.duration_minutes} phút`,
            { indent: 0 }
        );
        doc.moveDown(0.6);

        // Mô tả
        if (task.description) {
            doc.fontSize(10).text('Mô tả:', { underline: true });
            doc.fontSize(10).text(task.description, { indent: 10, width: CONTENT_W - 10 });
            doc.moveDown(0.5);
        }

        // Các bước
        if (Array.isArray(task.steps) && task.steps.length) {
            doc.fontSize(10).text('Hướng dẫn:', { underline: true });
            task.steps.forEach((s, i) => {
                doc.fontSize(10).text(`${i + 1}. ${stepText(s)}`, { indent: 10, width: CONTENT_W - 10 });
            });
            doc.moveDown(0.5);
        }

        // Phù hợp khi
        if (Array.isArray(task.triggers_supported) && task.triggers_supported.length) {
            doc.fontSize(10).text('Phù hợp khi: ' + task.triggers_supported.join(', '));
            doc.moveDown(0.3);
        }

        // Tags
        if (Array.isArray(task.tags) && task.tags.length) {
            doc.fontSize(10).text('Từ khóa: ' + task.tags.join(', '));
            doc.moveDown(0.3);
        }

        // Lưu ý
        if (Array.isArray(task.safety_notes) && task.safety_notes.length) {
            doc.fontSize(10).text('Lưu ý: ' + task.safety_notes.join('. '));
        }

        doc.end();
    });
}

async function uploadTask(pdfBuffer, filename) {
    const form = new FormData();
    form.append('tenant_id', TENANT_ID);
    form.append('files', new Blob([pdfBuffer], { type: 'application/pdf' }), filename);

    const res = await fetch(`${BASE_URL}/ingest/upload`, {
        method: 'POST',
        headers: { 'X-Admin-Key': ADMIN_KEY },
        body: form,
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Upload thất bại (${filename}) ${res.status}: ${err}`);
    }
    return res.json();
}

async function main() {
    console.log(`RAG: ${BASE_URL} | Tenant: ${TENANT_ID}\n`);

    console.log('Đọc tasks từ DB...');
    const tasks = await fetchTasks();
    console.log(`  → ${tasks.length} tasks\n`);

    if (!tasks.length) {
        console.log('Không có task nào trong DB.');
        await db.end();
        return;
    }

    let success = 0;
    let failed = 0;

    for (const task of tasks) {
        const filename = `task-${task.code.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        process.stdout.write(`  Uploading ${filename}... `);

        try {
            const pdf = await generateTaskPDF(task);
            await uploadTask(pdf, filename);
            console.log('✓');
            success++;
        } catch (err) {
            console.log(`✗ ${err.message}`);
            failed++;
        }
    }

    console.log(`\nHoàn thành: ${success} thành công, ${failed} thất bại`);
    await db.end();
}

main().catch(err => { console.error(err.message); process.exit(1); });
