import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';

// Đảo "Khu vườn tâm hồn" người dùng tự trang trí. Layout chỉ ghi phần khác so với đảo mặc định:
//   removed: id đồ có sẵn bị cất đi · moved: { id: [x, z, xoay, cỡ] } đồ có sẵn bị dời
//   added:   [{ i: id, k: mã món trong kho, p: [x, z, xoay, cỡ] }] đồ tự thêm
// Toạ độ theo đơn vị đảo (≈ -3..3). Giới hạn số lượng để payload luôn nhỏ & máy yếu vẫn vẽ mượt.
const router = Router();

const num = (min, max) => z.number().finite().min(min).max(max);
const pose = z.tuple([num(-4, 4), num(-4, 4), num(-10, 10), num(0.3, 3)]);
const idStr = z.string().min(1).max(64).regex(/^[\w:#.\-@]+$/);
const layoutSchema = z.object({
  v: z.literal(1),
  removed: z.array(idStr).max(800).default([]),
  moved: z.record(idStr, pose).default({}).refine((m) => Object.keys(m).length <= 800, 'Quá nhiều món được dời chỗ'),
  added: z.array(z.object({
    i: idStr, k: z.string().min(1).max(40).regex(/^[\w-]+$/), p: pose,
    d: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // ngày trồng (luống cây lớn dần)
    tr: z.number().int().min(0).max(1000).optional(), // mốc cắt tỉa (số ngày check-in lúc cắt)
    f: z.literal(1).optional() // lật ngang
  })).max(150).default([]),
  gs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // ngày bắt đầu tính cây mọc rậm
  trims: z.record(idStr, z.number().int().min(0).max(5000)).default({}).refine((m) => Object.keys(m).length <= 800, 'Quá nhiều cây'),
  flips: z.record(idStr, z.literal(true)).default({}).refine((m) => Object.keys(m).length <= 800, 'Quá nhiều món'), // đồ có sẵn bị lật ngang
  cuts: z.record(idStr, z.number().min(0.5).max(1)).default({}).refine((m) => Object.keys(m).length <= 800, 'Quá nhiều cây'), // mức cắt tỉa gọn
  // lối đi: đá lát / sỏi nối qua các điểm
  paths: z.array(z.object({ i: idStr, k: z.enum(['stone', 'gravel']), pts: z.array(z.tuple([num(-4, 4), num(-4, 4)])).min(1).max(80) })).max(30).default([])
});

router.get('/garden/layout', requireAuth, async (req, res) => {
  try {
    const r = await db.query('select layout, updated_at from user_garden_layouts where user_id = $1', [req.user.sub]);
    return res.json({ success: true, data: { layout: r.rows[0]?.layout || null, updated_at: r.rows[0]?.updated_at || null } });
  } catch (error) {
    console.error('Garden layout fetch error:', error);
    return res.status(500).json({ success: false, message: 'Could not load garden layout' });
  }
});

router.put('/garden/layout', requireAuth, async (req, res) => {
  const parsed = layoutSchema.safeParse(req.body?.layout);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Dữ liệu đảo không hợp lệ' });
  try {
    const layout = parsed.data;
    const r = await db.query(
      `insert into user_garden_layouts (user_id, layout, updated_at) values ($1, $2, now())
       on conflict (user_id) do update set layout = excluded.layout, updated_at = now()
       returning updated_at`,
      [req.user.sub, JSON.stringify(layout)]
    );
    return res.json({ success: true, data: { updated_at: r.rows[0].updated_at } });
  } catch (error) {
    console.error('Garden layout save error:', error);
    return res.status(500).json({ success: false, message: 'Could not save garden layout' });
  }
});

// Vườn ký ức: mỗi ngày có check-in tâm trạng = một bông hoa (lấy lần check-in cuối của ngày), tối đa 60 ngày gần nhất
router.get('/garden/memories', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      `select distinct on (day) to_char(day, 'YYYY-MM-DD') as day, dominant_emotion as emotion, mood_score as score
       from (
         select (created_at at time zone 'Asia/Ho_Chi_Minh')::date as day, dominant_emotion, mood_score, created_at
         from mood_checkins
         where user_id = $1 and created_at >= now() - interval '60 days'
       ) s
       order by day desc, created_at desc
       limit 60`,
      [req.user.sub]
    );
    return res.json({ success: true, data: { memories: r.rows.reverse() } }); // cũ → mới (hoa mọc theo hành trình)
  } catch (error) {
    console.error('Garden memories error:', error);
    return res.status(500).json({ success: false, message: 'Could not load memories' });
  }
});

// Đèn lồng biết ơn: lưu như một bài Nhật ký có thẻ "gratitude" (nên cũng hiện trong trang Nhật ký)
const LANTERN_TAG = '["gratitude"]';
router.get('/garden/lanterns', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      `select id, content as text, created_at from journal_entries
       where user_id = $1 and tags @> $2::jsonb
       order by created_at desc limit 12`,
      [req.user.sub, LANTERN_TAG]
    );
    return res.json({ success: true, data: { lanterns: r.rows.reverse() } });
  } catch (error) {
    console.error('Garden lanterns error:', error);
    return res.status(500).json({ success: false, message: 'Could not load lanterns' });
  }
});

router.post('/garden/lanterns', requireAuth, async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim().replace(/\s+/g, ' ') : '';
  if (!text || text.length > 140) return res.status(400).json({ success: false, message: 'Câu biết ơn cần từ 1 đến 140 ký tự' });
  try {
    const title = req.locale === 'en' ? 'Gratitude' : 'Điều biết ơn';
    const r = await db.query(
      `insert into journal_entries (user_id, title, content, tags, is_private)
       values ($1, $2, $3, $4::jsonb, true)
       returning id, content as text, created_at`,
      [req.user.sub, title, text, LANTERN_TAG]
    );
    return res.status(201).json({ success: true, data: { lantern: r.rows[0] } });
  } catch (error) {
    console.error('Garden lantern create error:', error);
    return res.status(500).json({ success: false, message: 'Could not save lantern' });
  }
});

export default router;
