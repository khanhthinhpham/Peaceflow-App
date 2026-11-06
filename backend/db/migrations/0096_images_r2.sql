-- Ảnh công khai chuyển sang Cloudflare R2 (xem src/common/utils/imageStore.js).
-- Mỗi cột *_r2 giữ "gốc khoá" của bộ ảnh nhiều cỡ trên R2, vd tasks/<id>/<hash>
--   → tasks/<id>/<hash>-thumb.webp, -card.webp, -full.jpg   (avatar: -sm.webp, -md.webp)
-- Khi đã có bản R2 thì cột bytea cũ được xoá (null) cho DB nhẹ. Chuyển ảnh cũ: npm run images:r2 -- --apply
alter table tasks add column if not exists cover_r2 text;
alter table articles add column if not exists cover_r2 text;
alter table experts add column if not exists avatar_r2 text;
