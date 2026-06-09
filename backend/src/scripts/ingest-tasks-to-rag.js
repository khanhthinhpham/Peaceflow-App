/**
 * Đọc tất cả bài tập active từ DB, format thành text, upload lên RAG platform.
 * Chạy lại mỗi khi thêm/cập nhật bài tập hàng loạt.
 *
 * npm run rag:ingest
 */

import 'dotenv/config';
import pg from 'pg';
import PDFDocument from 'pdfkit';
import { existsSync } from 'fs';

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

// Font Arial hỗ trợ tiếng Việt — fallback về Helvetica nếu không có
const FONT_PATH = 'C:\\Windows\\Fonts\\arial.ttf';
const FONT = existsSync(FONT_PATH) ? FONT_PATH : 'Helvetica';

const MARGIN = 50;
const PAGE_W = 595.28; // A4
const CONTENT_W = PAGE_W - MARGIN * 2;
const DIFF_ORDER = { easy: 1, medium: 2, hard: 3 };

function stepText(s) {
    return typeof s === 'string' ? s : s.text ?? s.instruction ?? JSON.stringify(s);
}

function generatePDF(tasks) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.font(FONT);

        // ── TRANG TIÊU ĐỀ ──────────────────────────────────────────
        doc.moveDown(5);

        const lineY1 = doc.y;
        doc.moveTo(MARGIN, lineY1).lineTo(PAGE_W - MARGIN, lineY1).lineWidth(2).stroke();
        doc.moveDown(1.2);

        doc.fontSize(26).text('PEACEFLOW', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).text('Thư Viện Bài Tập Sức Khỏe Tâm Thần', { align: 'center' });
        doc.moveDown(0.4);
        doc.fontSize(10).text('Tài liệu dành cho hệ thống AI cá nhân hóa', { align: 'center' });
        doc.moveDown(0.3);

        const today = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        doc.fontSize(10).text(`Ngày tạo: ${today}`, { align: 'center' });
        doc.moveDown(1.2);

        const lineY2 = doc.y;
        doc.moveTo(MARGIN, lineY2).lineTo(PAGE_W - MARGIN, lineY2).lineWidth(2).stroke();

        // ── NỘI DUNG ───────────────────────────────────────────────
        doc.addPage();

        // Nhóm theo category, sort easy → medium → hard trong mỗi nhóm
        const byCategory = {};
        for (const t of tasks) {
            if (!byCategory[t.category]) byCategory[t.category] = [];
            byCategory[t.category].push(t);
        }
        for (const items of Object.values(byCategory)) {
            items.sort((a, b) => (DIFF_ORDER[a.difficulty] ?? 9) - (DIFF_ORDER[b.difficulty] ?? 9));
        }

        let sectionNum = 0;
        for (const [category, items] of Object.entries(byCategory)) {
            sectionNum++;

            // Header nhóm
            doc.fontSize(13).font(FONT)
               .text(`${sectionNum}. NHÓM: ${category.toUpperCase()}  (${items.length} bài)`);
            doc.moveDown(0.2);
            doc.moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).lineWidth(0.8).stroke();
            doc.moveDown(0.8);

            items.forEach((t, idx) => {
                const num = `${sectionNum}.${idx + 1}`;

                // Tiêu đề bài
                doc.fontSize(11).font(FONT).text(`${num}  ${t.title}`);
                doc.moveDown(0.2);

                // Metadata
                doc.fontSize(9).text(
                    `Loại: ${t.category}  |  Độ khó: ${t.difficulty}  |  Thời lượng: ${t.duration_minutes} phút`,
                    { indent: 20 }
                );
                doc.moveDown(0.4);

                if (t.description) {
                    doc.fontSize(9).text('Mô tả:', { indent: 20 });
                    doc.fontSize(9).text(t.description, { indent: 36, width: CONTENT_W - 36 });
                    doc.moveDown(0.3);
                }

                if (Array.isArray(t.steps) && t.steps.length) {
                    doc.fontSize(9).text('Hướng dẫn:', { indent: 20 });
                    t.steps.forEach((s, i) => {
                        doc.fontSize(9).text(`Bước ${i + 1}: ${stepText(s)}`, { indent: 36, width: CONTENT_W - 36 });
                    });
                    doc.moveDown(0.3);
                }

                if (Array.isArray(t.triggers_supported) && t.triggers_supported.length) {
                    doc.fontSize(9).text(`Phù hợp khi: ${t.triggers_supported.join(', ')}`, { indent: 20 });
                }
                if (Array.isArray(t.tags) && t.tags.length) {
                    doc.fontSize(9).text(`Từ khóa: ${t.tags.join(', ')}`, { indent: 20 });
                }
                if (Array.isArray(t.safety_notes) && t.safety_notes.length) {
                    doc.fontSize(9).text(`Lưu ý: ${t.safety_notes.join('. ')}`, { indent: 20 });
                }

                // Dấu phân cách giữa các bài (nét đứt)
                doc.moveDown(0.5);
                doc.moveTo(MARGIN + 20, doc.y)
                   .lineTo(PAGE_W - MARGIN - 20, doc.y)
                   .lineWidth(0.3).dash(4, { space: 4 }).stroke().undash();
                doc.moveDown(0.6);
            });

            doc.moveDown(0.5);
        }

        doc.end();
    });
}

async function uploadToRAG(pdfBuffer) {
    const form = new FormData();
    form.append('tenant_id', TENANT_ID);
    form.append('files', new Blob([pdfBuffer], { type: 'application/pdf' }), 'peaceflow-tasks.pdf');

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

    console.log('Tạo PDF...');
    const pdfBuffer = await generatePDF(tasks);
    console.log(`  → ${(pdfBuffer.length / 1024).toFixed(1)} KB\n`);

    console.log('Upload lên RAG...');
    const result = await uploadToRAG(pdfBuffer);
    console.log('Kết quả:', JSON.stringify(result, null, 2));

    await db.end();
    console.log('\n✓ Hoàn thành!');
}

main().catch(err => { console.error(err.message); process.exit(1); });
