// Chuyển TOÀN BỘ ảnh công khai đang lưu trong DB (bytea) lên Cloudflare R2, mỗi ảnh tạo đủ các
// cỡ nhẹ (bìa: thumb / card / full; avatar: sm / md), rồi xoá bytea khỏi DB.
// Chạy: npm run images:r2            (xem trước, KHÔNG ghi gì)
//       npm run images:r2 -- --apply (đẩy lên R2 + cập nhật DB)
// Chạy lại an toàn: chỉ xử lý bản ghi còn bytea và chưa có bản R2.
import { db } from '../config/db.js';
import { isR2Configured } from '../common/services/r2.service.js';
import { IMAGE_TABLES, uploadVariants } from '../common/utils/imageStore.js';

const APPLY = process.argv.includes('--apply');
const kb = (n) => `${Math.round(n / 1024)}KB`;

async function main() {
  if (APPLY && !isR2Configured()) {
    console.error('Thiếu cấu hình R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL).');
    process.exit(1);
  }
  const client = await db.connect();
  await client.query('set statement_timeout = 60000');
  let moved = 0; let failed = 0; let bytes = 0;
  try {
    for (const [table, t] of Object.entries(IMAGE_TABLES)) {
      const ids = await client.query(
        `select id, octet_length(${t.data}) as size from ${table} where ${t.data} is not null and ${t.r2} is null order by id`
      );
      const total = ids.rows.reduce((s, r) => s + Number(r.size || 0), 0);
      console.log(`\n${table}: ${ids.rows.length} ảnh còn trong DB (${kb(total)})`);
      if (!APPLY) continue;
      for (const row of ids.rows) {
        try {
          const r = await client.query(`select ${t.data} as data from ${table} where id = $1`, [row.id]);
          const buf = r.rows[0]?.data;
          if (!buf) continue;
          const base = await uploadVariants(`${table}/${row.id}`, t.kind, buf);
          await client.query(`update ${table} set ${t.r2} = $2, ${t.data} = null, ${t.mime} = null where id = $1`, [row.id, base]);
          moved += 1; bytes += buf.length;
          console.log(`  ✓ ${row.id} (${kb(buf.length)}) → ${base}`);
        } catch (e) {
          failed += 1;
          console.log(`  ✗ ${row.id}: ${e.message}`);
        }
      }
    }
  } finally {
    client.release();
  }
  if (APPLY) console.log(`\nXong: chuyển ${moved} ảnh (${kb(bytes)} rời khỏi DB), lỗi ${failed}.`);
  else console.log('\nĐây là bản xem trước. Chạy lại với --apply để chuyển lên R2.');
  await db.end?.();
}

main().catch((e) => { console.error(e); process.exit(1); });
