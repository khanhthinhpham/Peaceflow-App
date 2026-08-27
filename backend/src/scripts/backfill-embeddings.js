/**
 * Tính embedding (Gemini) cho toàn bộ bài tập + chuyên gia đang active, lưu vào cột
 * `embedding` (pgvector) — chạy 1 lần sau khi thêm/sửa dữ liệu bài tập/chuyên gia.
 *
 * node src/scripts/backfill-embeddings.js
 */

import { db } from '../config/db.js';
import { env } from '../config/env.js';

const EMBED_MODEL = 'gemini-embedding-001';
const DIMENSIONS = 768;

async function embedText(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${env.geminiApiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: { parts: [{ text }] },
            outputDimensionality: DIMENSIONS,
            taskType: 'RETRIEVAL_DOCUMENT'
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini embed ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.embedding.values;
}

function toVectorLiteral(values) {
    return `[${values.join(',')}]`;
}

async function backfillTasks() {
    const { rows } = await db.query(
        `select id, title, description from tasks where active = true`
    );
    console.log(`Đang tính embedding cho ${rows.length} bài tập...`);

    for (const task of rows) {
        const text = `${task.title} ${task.description || ''}`.trim();
        const embedding = await embedText(text);
        await db.query(`update tasks set embedding = $1::vector where id = $2`, [toVectorLiteral(embedding), task.id]);
    }
    console.log('Xong bài tập.');
}

async function backfillExperts() {
    const { rows } = await db.query(
        `select id, specialties, bio from experts where active = true`
    );
    console.log(`Đang tính embedding cho ${rows.length} chuyên gia...`);

    for (const expert of rows) {
        const specialties = Array.isArray(expert.specialties) ? expert.specialties.join(', ') : (expert.specialties || '');
        const text = `${specialties} ${expert.bio || ''}`.trim();
        if (!text) continue;
        const embedding = await embedText(text);
        await db.query(`update experts set embedding = $1::vector where id = $2`, [toVectorLiteral(embedding), expert.id]);
    }
    console.log('Xong chuyên gia.');
}

async function main() {
    if (!env.geminiApiKey) {
        throw new Error('GEMINI_API_KEY chưa được cấu hình');
    }
    await backfillTasks();
    await backfillExperts();
    console.log('Backfill embedding hoàn tất.');
}

main()
    .catch((error) => {
        console.error('Backfill embedding thất bại:', error.message);
        process.exitCode = 1;
    })
    .finally(() => db.end());
