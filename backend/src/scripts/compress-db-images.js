// Nén lại các ảnh ĐÃ lưu trong DB trước khi có bước nén lúc tải lên (avatar chuyên gia, ảnh bìa
// bài viết / nhiệm vụ) → mỗi lần đọc ảnh nhẹ hơn, giảm Egress Supabase.
// Chạy: npm run images:compress           (xem trước, KHÔNG ghi DB)
//       npm run images:compress -- --apply (ghi bản đã nén vào DB)
// Chỉ thay khi bản nén nhỏ hơn rõ rệt (≥ 20%); GIF / ảnh lỗi giữ nguyên.
import { db } from '../config/db.js';
import { compressImageBuffer, IMAGE_PRESETS } from '../common/utils/dbImage.js';

const APPLY = process.argv.includes('--apply');
const TARGETS = [
  { table: 'experts', column: 'avatar_photo', mimeColumn: 'avatar_photo_mime', preset: IMAGE_PRESETS.avatar, label: 'Avatar chuyên gia' },
  { table: 'articles', column: 'cover_image', mimeColumn: 'cover_image_mime', preset: IMAGE_PRESETS.cover, label: 'Ảnh bìa bài viết' },
  { table: 'tasks', column: 'cover_image', mimeColumn: 'cover_image_mime', preset: IMAGE_PRESETS.cover, label: 'Ảnh bìa nhiệm vụ' }
];
const kb = (n) => `${Math.round(n / 1024)}KB`;

// Lệnh ghi bị kẹt: mở một kết nối KHÁC để xem phía server lệnh đó đang chờ gì
async function diagnose() {
  const c = await db.connect();
  try {
    const a = await c.query(`select pid, state, wait_event_type, wait_event, extract(epoch from now() - query_start)::int as secs,
        left(query, 70) as query, pg_blocking_pids(pid) as blocked_by
      from pg_stat_activity
      where datname = current_database() and pid <> pg_backend_pid() and state is not null and state <> 'idle'
        and query not ilike 'START_REPLICATION%'`);
    console.log('  [chẩn đoán] truy vấn đang chạy trên server:'); console.table(a.rows);
    const s = await c.query(`select current_setting('synchronous_commit') as synchronous_commit,
        current_setting('synchronous_standby_names') as standby, current_setting('transaction_read_only') as read_only`);
    console.log('  [chẩn đoán] cấu hình:', s.rows[0]);
  } catch (e) { console.log('  [chẩn đoán] lỗi:', e.message); } finally { c.release(); }
}

async function main() {
  let before = 0; let after = 0; let failed = 0;
  // một kết nối riêng, mỗi câu lệnh tối đa 30s (bị khoá / mạng treo thì báo lỗi rồi làm ảnh kế tiếp, không đứng im)
  const client = await db.connect();
  await client.query('set statement_timeout = 30000');
  const q = (sql, params) => Promise.race([
    client.query(sql, params),
    new Promise((_, rej) => setTimeout(() => rej(new Error('quá 40 giây không phản hồi')), 40000))
  ]);
  try {
    for (const t of TARGETS) {
      const list = await q(`select id, octet_length(${t.column}) as size from ${t.table} where ${t.column} is not null order by size desc`);
      console.log(`\n== ${t.label}: ${list.rows.length} ảnh`);
      for (const { id, size } of list.rows) {
        before += Number(size);
        try {
          // đọc từng ảnh một (tránh kéo cả bảng ảnh về cùng lúc)
          const r = await q(`select ${t.column} as data, ${t.mimeColumn} as mime from ${t.table} where id = $1`, [id]);
          const { data, mime } = r.rows[0] || {};
          const out = data && await compressImageBuffer(data, mime, t.preset);
          if (!out || out.buffer.length > size * 0.8) { after += Number(size); console.log(`  ${id}: ${kb(size)} — giữ nguyên`); continue; }
          after += out.buffer.length;
          if (!APPLY) { console.log(`  ${id}: ${kb(size)} → ${kb(out.buffer.length)} (${out.mime}) [xem trước]`); continue; }
          process.stdout.write(`  ${id}: ${kb(size)} → ${kb(out.buffer.length)} (${out.mime}) … đang ghi`);
          const t0 = Date.now();
          await q(`update ${t.table} set ${t.column} = $2, ${t.mimeColumn} = $3 where id = $1`, [id, out.buffer, out.mime]);
          console.log(` ✓ ${Date.now() - t0}ms`);
        } catch (e) {
          failed += 1; console.log(`\n  ${id}: LỖI — ${e.message}`);
          if (failed === 1) await diagnose();
          console.log('  Dừng lại (lần ghi đầu đã kẹt thì các lần sau cũng kẹt).');
          return;
        }
      }
    }
  } finally {
    client.release(true);
  }
  if (failed) console.log(`\n${failed} ảnh lỗi — có thể chạy lại lệnh, ảnh đã nén rồi sẽ tự "giữ nguyên".`);
  console.log(`\nTổng: ${kb(before)} → ${kb(after)}${APPLY ? ' (đã ghi DB)' : ' — chạy lại với --apply để ghi'}`);
}

main()
  .catch((e) => { console.error('Lỗi:', e.message); process.exitCode = 1; })
  .finally(() => db.end());
