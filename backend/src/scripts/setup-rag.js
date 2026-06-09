/**
 * Chạy một lần để tạo tenant + lấy API key từ RAG platform.
 * Yêu cầu: RAG_BASE_URL và RAG_ADMIN_KEY trong .env
 *
 * npm run rag:setup
 */

import 'dotenv/config';

const BASE_URL   = process.env.RAG_BASE_URL  || 'https://noetic-edda-sometimes.ngrok-free.dev';
const ADMIN_KEY  = process.env.RAG_ADMIN_KEY;
const TENANT_ID  = process.env.RAG_TENANT_ID || 'peaceflow';

if (!ADMIN_KEY) {
    console.error('Thiếu RAG_ADMIN_KEY trong .env');
    process.exit(1);
}

const headers = {
    'Content-Type': 'application/json',
    'X-Admin-Key': ADMIN_KEY,
};

async function createTenant() {
    const res = await fetch(`${BASE_URL}/admin/tenants`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: TENANT_ID, name: 'PeaceFlow App' }),
    });

    if (res.status === 409) {
        console.log(`Tenant "${TENANT_ID}" đã tồn tại, bỏ qua.`);
        return;
    }
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Tạo tenant thất bại ${res.status}: ${err}`);
    }
    console.log(`Đã tạo tenant "${TENANT_ID}"`);
}

async function createApiKey() {
    const res = await fetch(`${BASE_URL}/admin/tenants/${TENANT_ID}/keys`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ label: 'peaceflow-production', rate_limit_rpm: 60 }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Tạo API key thất bại ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.key;
}

async function main() {
    console.log(`RAG: ${BASE_URL}`);
    console.log(`Tenant: ${TENANT_ID}\n`);

    await createTenant();

    console.log('Tạo API key...');
    const apiKey = await createApiKey();

    console.log('\n✓ Hoàn thành! Thêm dòng sau vào .env:\n');
    console.log(`RAG_API_KEY=${apiKey}`);
    console.log('\nKey này chỉ hiển thị một lần — lưu lại ngay.');
}

main().catch(err => { console.error(err.message); process.exit(1); });
