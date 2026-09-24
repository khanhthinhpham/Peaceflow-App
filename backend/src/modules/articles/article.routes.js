import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db } from '../../config/db.js';
import { broadcastToUsers } from '../notifications/notification.routes.js';
import { translateToEnglish } from '../../common/services/translate.service.js';

const router = Router();

const coverUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ chấp nhận file ảnh'));
    }
    cb(null, true);
  }
});

// Danh mục bài viết giờ lưu trong bảng article_categories, admin tự thêm/sửa/xoá được qua
// /admin/article-categories — KHÔNG còn hardcode cứng trong code như trước (xem migration
// 0062). Query lại mỗi request thay vì cache trong bộ nhớ vì tần suất gọi thấp (trang đọc
// bài) và luôn cần phản ánh đúng thay đổi mới nhất của admin.
// `locale` chỉ ảnh hưởng phía PUBLIC (trang đọc bài) — admin luôn thấy label tiếng Việt gốc
// để quản lý (không truyền locale ở các route /admin/*), khớp label_en fallback về label
// tiếng Việt nếu admin chưa dịch tên danh mục.
async function getCategoriesMap(locale = 'vi') {
  const r = await db.query(`select key, label, label_en from article_categories order by sort_order, created_at`);
  return Object.fromEntries(r.rows.map((row) => [row.key, locale === 'en' ? (row.label_en || row.label) : row.label]));
}

// Chọn bản tiếng Anh khi có (locale === 'en') và đã nhập title_en/content_en, fallback về
// bản tiếng Việt gốc nếu admin chưa dịch — cùng convention với localizeTask() bên
// tasks.cache.js. Không đổi shape trả về (title/content) để frontend không cần biết có
// bản dịch hay không.
function localizeArticle(row, locale) {
  if (locale !== 'en') return row;
  return {
    ...row,
    title: row.title_en || row.title,
    content: row.content_en || row.content
  };
}

function mapArticle(row, categoriesMap, { withContent = false } = {}) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    categoryLabel: categoriesMap[row.category] || row.category,
    status: row.status,
    authorName: row.author_name,
    hasCover: Boolean(row.has_cover),
    createdAt: row.created_at,
    publishedAt: row.published_at,
    // Đoạn trích ngắn cho danh sách/bài nổi bật — cắt sẵn ở SQL (left(content,220)) để
    // không phải kéo cả content đầy đủ (có bài >5000 ký tự) về chỉ để hiển thị vài dòng.
    ...(!withContent && row.content ? { excerpt: `${row.content.trim().replace(/\s+/g, ' ')}…` } : {}),
    ...(withContent ? { content: row.content } : {})
  };
}

// ===== PUBLIC =====

router.get('/articles', async (req, res) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : null;
    const limit = Math.max(parseInt(req.query.limit, 10) || 30, 1);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const categoriesMap = await getCategoriesMap(req.locale);
    const where = ["status = 'published'"];
    const params = [];
    if (category && categoriesMap[category]) {
      params.push(category);
      where.push(`category = $${params.length}`);
    }

    const countRes = await db.query(`select count(*)::int as total from articles where ${where.join(' and ')}`, params);
    params.push(limit, offset);
    const rowsRes = await db.query(
      `select id, title, title_en, category, status, author_name, created_at, published_at,
              (cover_image is not null) as has_cover,
              left(content, 220) as content, left(content_en, 220) as content_en
       from articles
       where ${where.join(' and ')}
       order by published_at desc nulls last, created_at desc
       limit $${params.length - 1} offset $${params.length}`,
      params
    );

    return res.json({
      success: true,
      data: {
        articles: rowsRes.rows.map((r) => mapArticle(localizeArticle(r, req.locale), categoriesMap)),
        total: countRes.rows[0]?.total || 0,
        categories: categoriesMap
      }
    });
  } catch (error) {
    console.error('List articles error:', error);
    return res.status(500).json({ success: false, message: 'Could not load articles' });
  }
});

router.get('/articles/:id', async (req, res) => {
  try {
    const r = await db.query(
      `select id, title, title_en, category, content, content_en, status, author_name, created_at, published_at,
              (cover_image is not null) as has_cover
       from articles where id = $1 and status = 'published'`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    const categoriesMap = await getCategoriesMap(req.locale);
    return res.json({ success: true, data: mapArticle(localizeArticle(r.rows[0], req.locale), categoriesMap, { withContent: true }) });
  } catch (error) {
    console.error('Get article error:', error);
    return res.status(500).json({ success: false, message: 'Could not load article' });
  }
});

router.get('/articles/:id/cover', async (req, res) => {
  try {
    const r = await db.query(`select cover_image, cover_image_mime from articles where id = $1`, [req.params.id]);
    const row = r.rows[0];
    if (!row?.cover_image) return res.status(404).end();
    res.set('Content-Type', row.cover_image_mime || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(row.cover_image);
  } catch (error) {
    console.error('Get article cover error:', error);
    return res.status(500).end();
  }
});

// ===== ADMIN =====

// Dịch nháp title/content sang tiếng Anh bằng MyMemory (miễn phí, xem translate.service.js)
// — CHỈ trả về bản dịch để admin xem/sửa trên form, KHÔNG tự lưu vào DB, tránh đăng nhầm
// bản dịch máy chưa ai kiểm tra.
router.post('/admin/articles/translate-preview', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const { title, content } = req.body;
    if (!title?.trim() && !content?.trim()) {
      return res.status(400).json({ success: false, message: 'Thiếu tiêu đề hoặc nội dung để dịch.' });
    }
    const [titleEn, contentEn] = await Promise.all([
      translateToEnglish(title || ''),
      translateToEnglish(content || '')
    ]);
    return res.json({ success: true, data: { titleEn, contentEn } });
  } catch (error) {
    console.error('Translate preview error:', error.message);
    return res.status(500).json({ success: false, message: 'Không dịch được lúc này, thử lại sau.' });
  }
});

router.get('/admin/articles', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const categoriesMap = await getCategoriesMap();
    const countRes = await db.query(`select count(*)::int as total from articles`);
    const rowsRes = await db.query(
      `select id, title, category, status, author_name, created_at, published_at,
              (cover_image is not null) as has_cover
       from articles
       order by created_at desc
       limit $1 offset $2`,
      [limit, offset]
    );

    return res.json({
      success: true,
      data: {
        articles: rowsRes.rows.map((r) => mapArticle(r, categoriesMap)),
        total: countRes.rows[0]?.total || 0,
        categories: categoriesMap
      }
    });
  } catch (error) {
    console.error('Admin list articles error:', error);
    return res.status(500).json({ success: false, message: 'Could not load articles' });
  }
});

router.get('/admin/articles/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const r = await db.query(
      `select id, title, title_en, category, content, content_en, status, author_name, created_at, published_at,
              (cover_image is not null) as has_cover
       from articles where id = $1`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    const categoriesMap = await getCategoriesMap();
    // Form sửa cần thấy CẢ 2 bản để chỉnh riêng từng ngôn ngữ — không đi qua localizeArticle
    // (chỉ dành cho phía public, chọn 1 bản để hiển thị).
    return res.json({
      success: true,
      data: {
        ...mapArticle(r.rows[0], categoriesMap, { withContent: true }),
        titleEn: r.rows[0].title_en || '',
        contentEn: r.rows[0].content_en || ''
      }
    });
  } catch (error) {
    console.error('Admin get article error:', error);
    return res.status(500).json({ success: false, message: 'Could not load article' });
  }
});

router.post('/admin/articles', requireAuth, coverUpload.single('cover'), async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });

    const { title, category, content, status, author_name, notify_users, title_en, content_en } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Thiếu tiêu đề hoặc nội dung.' });
    }
    const categoriesMap = await getCategoriesMap();
    const finalCategory = categoriesMap[category] ? category : 'khac';
    const finalStatus = status === 'published' ? 'published' : 'draft';

    const r = await db.query(
      `insert into articles
        (title, category, content, status, author_name, created_by, cover_image, cover_image_mime, published_at, title_en, content_en)
       values ($1, $2, $3, $4, $5, $6, $7, $8, case when $4::varchar = 'published' then now() else null end, $9, $10)
       returning id`,
      [
        title.trim(),
        finalCategory,
        content,
        finalStatus,
        (author_name || '').trim() || 'Đội ngũ PeaceFlow',
        req.user.sub,
        req.file?.buffer || null,
        req.file?.mimetype || null,
        (title_en || '').trim() || null,
        (content_en || '').trim() || null
      ]
    );
    const newId = r.rows[0].id;

    if (finalStatus === 'published' && (notify_users === 'true' || notify_users === true)) {
      broadcastToUsers({
        title: '💌 Góc chia sẻ có bài mới',
        message: title.trim(),
        audience: 'all',
        actionUrl: `/inspire/${newId}`
      }).catch((e) => console.error('[ARTICLE_BROADCAST_FAIL]', e.message));
    }

    return res.json({ success: true, data: { id: newId } });
  } catch (error) {
    if (error.message === 'Chỉ chấp nhận file ảnh') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Create article error:', error);
    return res.status(500).json({ success: false, message: 'Could not create article' });
  }
});

router.put('/admin/articles/:id', requireAuth, coverUpload.single('cover'), async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });

    const { title, category, content, status, author_name, notify_users, title_en, content_en } = req.body;
    const categoriesMap = await getCategoriesMap();
    const finalCategory = categoriesMap[category] ? category : 'khac';
    const finalStatus = status === 'published' ? 'published' : 'draft';

    const existing = await db.query(`select title, status, published_at from articles where id = $1`, [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    // Chỉ báo khi bài THỰC SỰ chuyển từ nháp -> công khai lần này — tránh spam thông báo mỗi
    // lần admin chỉ sửa nhẹ nội dung của bài đã công khai từ trước mà quên bỏ tick.
    const isNewlyPublished = existing.rows[0].status !== 'published' && finalStatus === 'published';

    const params = [
      title?.trim(),
      finalCategory,
      content,
      finalStatus,
      (author_name || '').trim() || 'Đội ngũ PeaceFlow',
      (title_en || '').trim() || null,
      (content_en || '').trim() || null,
      req.params.id
    ];
    let coverClause = '';
    if (req.file) {
      params.push(req.file.buffer, req.file.mimetype);
      coverClause = `, cover_image = $${params.length - 1}, cover_image_mime = $${params.length}`;
    }

    await db.query(
      `update articles
       set title = coalesce($1, title),
           category = $2,
           content = coalesce($3, content),
           status = $4,
           author_name = $5,
           title_en = $6,
           content_en = $7,
           published_at = case when $4::varchar = 'published' then coalesce(published_at, now()) else published_at end,
           updated_at = now()
           ${coverClause}
       where id = $8`,
      params
    );

    if (isNewlyPublished && (notify_users === 'true' || notify_users === true)) {
      broadcastToUsers({
        title: '💌 Góc chia sẻ có bài mới',
        message: (title?.trim() || existing.rows[0].title),
        audience: 'all',
        actionUrl: `/inspire/${req.params.id}`
      }).catch((e) => console.error('[ARTICLE_BROADCAST_FAIL]', e.message));
    }

    return res.json({ success: true });
  } catch (error) {
    if (error.message === 'Chỉ chấp nhận file ảnh') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Update article error:', error);
    return res.status(500).json({ success: false, message: 'Could not update article' });
  }
});

router.delete('/admin/articles/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const r = await db.query(`delete from articles where id = $1 returning id`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete article error:', error);
    return res.status(500).json({ success: false, message: 'Could not delete article' });
  }
});

// ===== ADMIN: DANH MỤC BÀI VIẾT =====

function slugifyCategoryKey(label) {
  return (label || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'danh_muc';
}

router.get('/admin/article-categories', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const r = await db.query(
      `select c.key, c.label, c.sort_order,
              (select count(*)::int from articles a where a.category = c.key) as article_count
       from article_categories c
       order by c.sort_order, c.created_at`
    );
    return res.json({ success: true, data: r.rows });
  } catch (error) {
    console.error('List article categories error:', error);
    return res.status(500).json({ success: false, message: 'Could not load categories' });
  }
});

router.post('/admin/article-categories', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const label = (req.body.label || '').trim();
    if (!label) return res.status(400).json({ success: false, message: 'Thiếu tên danh mục.' });

    let key = slugifyCategoryKey(label);
    // Tránh trùng key nếu 2 danh mục có tên gần giống nhau (vd đã có "Giấc ngủ", thêm "GIẤC NGỦ").
    const existing = await db.query(`select 1 from article_categories where key = $1`, [key]);
    if (existing.rows.length) key = `${key}_${Date.now().toString(36)}`;

    const maxOrder = await db.query(`select coalesce(max(sort_order), 0) as m from article_categories`);
    await db.query(
      `insert into article_categories (key, label, sort_order) values ($1, $2, $3)`,
      [key, label, (maxOrder.rows[0].m || 0) + 1]
    );
    return res.json({ success: true, data: { key, label } });
  } catch (error) {
    console.error('Create article category error:', error);
    return res.status(500).json({ success: false, message: 'Could not create category' });
  }
});

router.put('/admin/article-categories/:key', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    const label = (req.body.label || '').trim();
    if (!label) return res.status(400).json({ success: false, message: 'Thiếu tên danh mục.' });
    const r = await db.query(
      `update article_categories set label = $1 where key = $2 returning key`,
      [label, req.params.key]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Update article category error:', error);
    return res.status(500).json({ success: false, message: 'Could not update category' });
  }
});

router.delete('/admin/article-categories/:key', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ success: false, message: 'Admin only' });
    if (req.params.key === 'khac') {
      return res.status(400).json({ success: false, message: 'Không thể xoá danh mục mặc định "Khác".' });
    }
    // Bài viết đang dùng danh mục này thì chuyển về "Khác" thay vì để category rỗng/mồ côi.
    await db.query(`update articles set category = 'khac' where category = $1`, [req.params.key]);
    const r = await db.query(`delete from article_categories where key = $1 returning key`, [req.params.key]);
    if (!r.rows[0]) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete article category error:', error);
    return res.status(500).json({ success: false, message: 'Could not delete category' });
  }
});

export default router;
