// Khảo sát hài lòng người bệnh / nhân viên y tế / tiêm chủng mở rộng cho Sở Y tế (QĐ 56/QĐ-BYT 2024, QĐ 3869/QĐ-BYT 2019).
// - Công khai (không đăng nhập): GET/POST /survey/public/:token — phiếu mở qua QR/link.
// - Quản trị: tài khoản PeaceFlow + vai trò trong ks_members (so_yte = Sở Y tế, don_vi = một đơn vị).
//   Quản trị viên PeaceFlow (is_admin) được coi như so_yte.
// Giao diện là trang tĩnh riêng (dự án khao-sat-hai-long) gọi API này bằng Bearer token.
import crypto from 'crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import QRCode from 'qrcode';
import { z } from 'zod';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { db as defaultDb } from '../../config/db.js';
import { env } from '../../config/env.js';
import { prepareResponse, makeStartToken } from './lib/submit.js';
import { FLAG_LABELS } from './lib/quality.js';
import { KCB_TABLE } from './lib/sampleSize.js';
import { round1, COMPONENTS } from './lib/indices.js';
import * as stats from './survey.stats.js';
import { buildQuarterXlsx, buildResponsesCsv } from './survey.export.js';

const limitMessage = (message) => ({ success: false, message });

/** Bí mật cho băm SĐT / token thời gian: SURVEY_PHONE_SALT, nếu không có thì dẫn xuất từ JWT secret. */
export function surveySecrets() {
  const base = env.surveyPhoneSalt || crypto.createHash('sha256').update(`ks-phone-salt|${env.jwtAccessSecret || 'peaceflow'}`).digest('hex');
  return {
    phoneSalt: base,
    startSecret: crypto.createHash('sha256').update(`ks-start|${base}`).digest('hex'),
  };
}

const intOrNull = z.preprocess((v) => (v === '' || v === undefined ? null : v), z.coerce.number().int().min(0).max(1000000).nullable());
const r1 = (v) => round1(v);
const roundObj = (o) => (o ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? r1(v) : v])) : o);
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra });

/** Bọc handler async: lỗi zod → 400, lỗi khác → 500 (không lộ chi tiết). */
const h = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    if (error instanceof z.ZodError) return fail(res, 400, error.errors[0]?.message || 'Dữ liệu không hợp lệ', { errors: error.errors });
    console.error('[survey]', req.method, req.path, error.message);
    return fail(res, 500, 'Lỗi máy chủ khi xử lý khảo sát');
  }
};

// db / authMiddleware có thể thay thế khi kiểm thử (vd. Postgres nhúng PGlite).
export function createSurveyRouter({ db = defaultDb, authMiddleware = requireAuth, publicBaseUrl = env.surveyPublicBaseUrl, submitLimit = 60 } = {}) {
  const router = Router();
  const { phoneSalt, startSecret } = surveySecrets();
  const surveyUrl = (token, mode) => `${publicBaseUrl.replace(/\/+$/, '')}/survey.html?t=${token}${mode === 'phong_van' ? '&mode=phong_van' : ''}`;

  const submitLimiter = rateLimit({ standardHeaders: true, legacyHeaders: false, windowMs: 10 * 60 * 1000, limit: submitLimit, message: limitMessage('Gửi quá nhiều phiếu trong thời gian ngắn, vui lòng thử lại sau.') });
  const publicReadLimiter = rateLimit({ standardHeaders: true, legacyHeaders: false, windowMs: 60 * 1000, limit: 120, message: limitMessage('Quá nhiều yêu cầu, vui lòng thử lại sau.') });

  const one = async (sql, params) => (await db.query(sql, params)).rows[0] || null;
  const getForm = async (code) => {
    const row = await one('select * from ks_forms where code = $1', [code]);
    if (!row) return null;
    return { ...row.definition, code: row.code, status: row.status, note: row.note, version: row.version };
  };

  async function resolveLink(token) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{10,64}$/.test(token)) return null;
    const link = await one('select * from ks_links where token = $1', [token]);
    if (!link) return null;
    const round = await one('select * from ks_rounds where id = $1', [link.round_id]);
    const unit = await one('select * from ks_units where id = $1', [link.unit_id]);
    if (!unit || !unit.active) return null;
    return { link, round, unit, reportingUnitId: unit.type === 'tyt' ? unit.parent_id : unit.id, tytId: unit.type === 'tyt' ? unit.id : null };
  }

  /** Lưu phiếu (kiểm tra + cờ trùng SĐT trong cùng đợt và đơn vị). */
  async function saveResponse({ def, roundId, unitId, tytId, mode, userId, body }) {
    const p = prepareResponse(def, body, { mode, secret: startSecret, salt: phoneSalt });
    if (!p.ok) return p;
    const rec = p.record;
    let finalTyt = tytId;
    if (!finalTyt && rec.tyt_id) {
      const t = await one("select id from ks_units where id = $1 and parent_id = $2 and type = 'tyt' and active", [rec.tyt_id, unitId]);
      if (!t) return { ok: false, errors: [{ path: 'tyt_id', message: 'Trạm y tế không hợp lệ' }] };
      finalTyt = t.id;
    }
    if (rec.phone_hash) {
      const dup = await one('select 1 as x from ks_responses where round_id = $1 and unit_id = $2 and phone_hash = $3 limit 1', [roundId, unitId, rec.phone_hash]);
      if (dup) rec.flags.push('trung_so_dien_thoai');
    }
    const row = await one(
      `insert into ks_responses (round_id, unit_id, tyt_id, form_code, form_version, mode, answers, comp_counts, demographics, meta, comment, phone_hash, duration_sec, flags, entered_by)
       values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12,$13,$14::jsonb,$15) returning id`,
      [roundId, unitId, finalTyt, def.code, rec.form_version, mode, JSON.stringify(rec.answers), JSON.stringify(rec.comp_counts), JSON.stringify(rec.demographics), JSON.stringify(rec.meta), rec.comment, rec.phone_hash, rec.duration_sec, JSON.stringify(rec.flags), userId || null]
    );
    return { ok: true, id: Number(row.id), flags: rec.flags };
  }

  // ===================== CÔNG KHAI =====================
  router.get('/survey/public/:token', publicReadLimiter, h(async (req, res) => {
    const L = await resolveLink(req.params.token);
    if (!L) return fail(res, 404, 'Đường dẫn khảo sát không tồn tại');
    const def = await getForm(L.link.form_code);
    const { note, required_counts, source, ...publicDef } = def; // eslint-disable-line no-unused-vars
    const parent = L.unit.type === 'tyt' ? await one('select name from ks_units where id = $1', [L.unit.parent_id]) : null;
    const tyts = L.link.form_code === 'tcmr' && L.unit.type === 'ttyt'
      ? (await db.query("select id, name from ks_units where parent_id = $1 and type = 'tyt' and active order by sort, name", [L.unit.id])).rows
      : [];
    return ok(res, {
      unit: { name: L.unit.name, parent: parent?.name || null, type: L.unit.type },
      round: { label: stats.roundLabel(L.round), open: L.round.status === 'mo' },
      form: publicDef,
      tyts,
      start_token: makeStartToken(startSecret),
    });
  }));

  router.post('/survey/public/:token', submitLimiter, h(async (req, res) => {
    const L = await resolveLink(req.params.token);
    if (!L) return fail(res, 404, 'Đường dẫn khảo sát không tồn tại');
    if (L.round.status !== 'mo') return fail(res, 409, 'Đợt khảo sát đã đóng hoặc chưa mở');
    const def = await getForm(L.link.form_code);
    const mode = req.query.mode === 'phong_van' ? 'phong_van' : 'tu_dien';
    const r = await saveResponse({ def, roundId: L.round.id, unitId: L.reportingUnitId, tytId: L.tytId, mode, body: req.body });
    if (!r.ok) return fail(res, 400, r.errors[0]?.message || 'Phiếu chưa hợp lệ', { errors: r.errors });
    return ok(res, { received: true }, 201); // không trả cờ chất lượng cho người trả lời
  }));

  // ===================== XÁC THỰC + VAI TRÒ =====================
  async function loadMembership(req) {
    if (req.survey) return req.survey;
    if (req.user?.is_admin) {
      req.survey = { role: 'so_yte', unit_id: null, via: 'peaceflow_admin' };
      return req.survey;
    }
    const m = await one('select role, unit_id from ks_members where user_id = $1', [req.user.sub]);
    req.survey = m ? { role: m.role, unit_id: m.unit_id, via: 'member' } : null;
    return req.survey;
  }

  /** requireSurveyRole(['so_yte']) hoặc (['so_yte','don_vi']). */
  const requireSurveyRole = (roles) => [
    authMiddleware,
    h(async (req, res, next) => {
      const m = await loadMembership(req);
      if (!m) return fail(res, 403, 'Tài khoản chưa được cấp quyền khảo sát hài lòng', { code: 'no_membership' });
      if (!roles.includes(m.role)) return fail(res, 403, 'Chỉ Sở Y tế được thực hiện thao tác này', { code: 'forbidden_role' });
      next();
    }),
  ];
  const anyRole = requireSurveyRole(['so_yte', 'don_vi']);
  const adminOnly = requireSurveyRole(['so_yte']);
  const isAdmin = (req) => req.survey?.role === 'so_yte';

  async function reportingUnitOf(unitId) {
    const u = await one('select id, type, parent_id from ks_units where id = $1', [unitId]);
    if (!u) return null;
    return u.type === 'tyt' ? u.parent_id : u.id;
  }
  async function canAccessUnit(req, unitId) {
    if (isAdmin(req)) return true;
    const rep = await reportingUnitOf(unitId);
    return rep !== null && rep === req.survey.unit_id;
  }

  router.get('/survey/me', authMiddleware, h(async (req, res) => {
    const m = await loadMembership(req);
    if (!m) return fail(res, 403, 'Tài khoản chưa được cấp quyền khảo sát hài lòng', { code: 'no_membership' });
    const unit = m.unit_id ? await one('select id, code, name, type from ks_units where id = $1', [m.unit_id]) : null;
    return ok(res, { user: { id: req.user.sub, email: req.user.email, name: req.user.display_name || req.user.full_name }, role: m.role, via: m.via, unit });
  }));

  // ---------- Đơn vị ----------
  router.get('/survey/units', anyRole, h(async (req, res) => {
    const units = await stats.loadUnits(db);
    let list = units.all.filter((u) => u.active);
    if (!isAdmin(req)) list = list.filter((u) => u.id === req.survey.unit_id || u.parent_id === req.survey.unit_id);
    const data = list.map((u) => {
      const required = {};
      for (const f of ['noi_tru', 'ngoai_tru', 'nhan_vien', 'tcmr']) if (stats.formApplies(u, f)) required[f] = stats.requiredSample(units, u, f);
      return { ...u, required, tyt_count: u.type === 'ttyt' ? (units.children.get(u.id) || []).length : null };
    });
    data.sort((a, b) => (a.type === 'tyt') - (b.type === 'tyt') || a.sort - b.sort || a.name.localeCompare(b.name));
    const kcbTable = KCB_TABLE.map(([a, b, c, d]) => ({ from: a, to: Number.isFinite(b) ? b : null, min: c, max: Number.isFinite(d) ? d : null }));
    return ok(res, { units: data, kcb_table: kcbTable });
  }));

  router.put('/survey/units/:id', anyRole, h(async (req, res) => {
    const id = Number(req.params.id);
    if (!(await canAccessUnit(req, id))) return fail(res, 403, 'Không có quyền với đơn vị này');
    const body = z.object({
      name: z.string().trim().min(2).max(200).optional(),
      so_tyt: intOrNull.optional(),
      luot_noi_tru_ngay: intOrNull.optional(),
      luot_ngoai_tru_ngay: intOrNull.optional(),
      luot_tiem_thang: intOrNull.optional(),
      so_nhan_vien: intOrNull.optional(),
    }).strict().parse(req.body || {});
    const unit = await one('select * from ks_units where id = $1', [id]);
    if (!unit) return fail(res, 404, 'Không tìm thấy đơn vị');
    if (body.name && !isAdmin(req) && unit.type !== 'tyt') delete body.name; // đơn vị không tự đổi tên đơn vị mình
    const keys = Object.keys(body); // khoá đã được zod giới hạn trong danh sách cố định ở trên
    if (!keys.length) return ok(res, { updated: false });
    await db.query(`update ks_units set ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1`, [id, ...keys.map((k) => body[k])]);
    return ok(res, { updated: true });
  }));

  router.post('/survey/units/:id/tyt', anyRole, h(async (req, res) => {
    const id = Number(req.params.id);
    const parent = await one("select * from ks_units where id = $1 and type = 'ttyt'", [id]);
    if (!parent) return fail(res, 404, 'Chỉ thêm trạm y tế cho Trung tâm Y tế');
    if (!(await canAccessUnit(req, id))) return fail(res, 403, 'Không có quyền');
    const body = z.object({ name: z.string().trim().min(2).max(200), luot_tiem_thang: intOrNull.optional() }).parse(req.body || {});
    const n = (await one("select count(*)::int as n from ks_units where parent_id = $1 and type = 'tyt'", [id])).n;
    const code = `${parent.code}-T${String(n + 1).padStart(2, '0')}`;
    const tyt = await one(
      "insert into ks_units (code, name, type, parent_id, sort, luot_tiem_thang) values ($1, $2, 'tyt', $3, $4, $5) returning *",
      [code, body.name, id, n + 1, body.luot_tiem_thang ?? null]
    );
    // Tạo link TCMR cho các đợt TCMR đang mở
    await db.query(
      `insert into ks_links (token, round_id, unit_id, form_code)
       select replace(gen_random_uuid()::text, '-', ''), r.id, $1, 'tcmr' from ks_rounds r where r.kind = 'tcmr' and r.status = 'mo'
       on conflict (round_id, unit_id, form_code) do nothing`,
      [tyt.id]
    );
    return ok(res, tyt, 201);
  }));

  router.delete('/survey/tyt/:id', anyRole, h(async (req, res) => {
    const id = Number(req.params.id);
    const t = await one("select * from ks_units where id = $1 and type = 'tyt'", [id]);
    if (!t) return fail(res, 404, 'Không tìm thấy trạm y tế');
    if (!(await canAccessUnit(req, id))) return fail(res, 403, 'Không có quyền');
    await db.query('update ks_units set active = false where id = $1', [id]); // giữ lịch sử phiếu
    return ok(res, { deactivated: true });
  }));

  // ---------- Mẫu phiếu ----------
  router.get('/survey/forms', anyRole, h(async (req, res) => {
    const { rows } = await db.query('select code, name, status, note, version, updated_at, definition from ks_forms order by code');
    return ok(res, rows.map((f) => ({
      code: f.code, name: f.name, status: f.status, note: f.note, version: f.version, updated_at: f.updated_at, source: f.definition.source,
      counts: Object.fromEntries(f.definition.groups.map((g) => [g.component, g.items.length])),
      required_counts: f.definition.required_counts,
    })));
  }));

  router.get('/survey/forms/:code', anyRole, h(async (req, res) => {
    const def = await getForm(req.params.code);
    if (!def) return fail(res, 404, 'Không tìm thấy mẫu phiếu');
    return ok(res, def);
  }));

  const formDefSchema = z.object({
    title: z.string().min(1),
    groups: z.array(z.object({
      component: z.enum(['A1', 'A2', 'A3', 'A4', 'A5']),
      code: z.string().min(1).max(5),
      title: z.string().min(1),
      items: z.array(z.object({ code: z.string().regex(/^[A-Z][0-9]{1,2}$/), text: z.string().min(3).max(500) })).min(1),
    })).length(5),
    demographics: z.array(z.object({ code: z.string(), label: z.string(), type: z.enum(['choice', 'number', 'text']) }).passthrough()),
  }).passthrough();

  router.put('/survey/forms/:code', adminOnly, h(async (req, res) => {
    const cur = await one('select * from ks_forms where code = $1', [req.params.code]);
    if (!cur) return fail(res, 404, 'Không tìm thấy mẫu phiếu');
    const body = z.object({
      status: z.enum(['chinh_thuc', 'can_cap_nhat', 'ban_nhap']).optional(),
      note: z.string().max(1000).optional(),
      definition: formDefSchema.optional(),
    }).parse(req.body || {});
    const def = body.definition ? { ...body.definition, code: cur.code } : cur.definition;
    const codes = def.groups.flatMap((g) => g.items.map((i) => i.code));
    if (new Set(codes).size !== codes.length) return fail(res, 400, 'Mã câu hỏi bị trùng');
    await db.query(
      'update ks_forms set status = $2, note = $3, definition = $4::jsonb, version = version + $5, updated_at = now() where code = $1',
      [cur.code, body.status ?? cur.status, body.note ?? cur.note, JSON.stringify(def), body.definition ? 1 : 0]
    );
    return ok(res, { updated: true });
  }));

  // ---------- Đợt khảo sát ----------
  router.get('/survey/rounds', anyRole, h(async (req, res) => {
    const { rows } = await db.query(
      `select r.*, (select count(*)::int from ks_responses x where x.round_id = r.id) as n
       from ks_rounds r order by year desc, period desc, kind`
    );
    return ok(res, rows.map((x) => ({ ...x, label: stats.roundLabel(x) })));
  }));

  router.post('/survey/rounds', adminOnly, h(async (req, res) => {
    const { kind, year, period } = z.object({
      kind: z.enum(['quy', 'tcmr']),
      year: z.coerce.number().int().min(2024).max(2035),
      period: z.coerce.number().int().min(1).max(4),
    }).refine((d) => d.kind === 'quy' || d.period <= 2, { message: 'TCMR chỉ có đợt 1 (tháng 3–4) và đợt 2 (tháng 9–10)' }).parse(req.body || {});
    const name = kind === 'quy' ? `Quý ${period}/${year}` : `TCMR đợt ${period}/${year} (tháng ${period === 1 ? '3–4' : '9–10'})`;
    const row = await one(
      'insert into ks_rounds (kind, year, period, name) values ($1, $2, $3, $4) on conflict (kind, year, period) do nothing returning *',
      [kind, year, period, name]
    );
    if (!row) return fail(res, 409, 'Đợt này đã tồn tại');
    return ok(res, row, 201);
  }));

  router.post('/survey/rounds/:id/:action(open|close)', adminOnly, h(async (req, res) => {
    const round = await one('select * from ks_rounds where id = $1', [Number(req.params.id)]);
    if (!round) return fail(res, 404, 'Không tìm thấy đợt');
    if (req.params.action === 'open') {
      await db.query("update ks_rounds set status = 'mo', opened_at = coalesce(opened_at, now()), closed_at = null where id = $1", [round.id]);
      // Tạo link (idempotent) cho mọi đơn vị × mẫu phiếu áp dụng trong đợt
      await db.query(
        `insert into ks_links (token, round_id, unit_id, form_code)
         select replace(gen_random_uuid()::text, '-', ''), $1, u.id, f.code
         from ks_units u cross join unnest($2::text[]) as f(code)
         where u.active and (case when f.code = 'tcmr' then u.type in ('ttyt', 'tyt') else u.type <> 'tyt' end)
         on conflict (round_id, unit_id, form_code) do nothing`,
        [round.id, stats.formsForRound(round)]
      );
    } else {
      await db.query("update ks_rounds set status = 'dong', closed_at = now() where id = $1", [round.id]);
    }
    return ok(res, await one('select * from ks_rounds where id = $1', [round.id]));
  }));

  router.get('/survey/rounds/:id/links', anyRole, h(async (req, res) => {
    const round = await one('select * from ks_rounds where id = $1', [Number(req.params.id)]);
    if (!round) return fail(res, 404, 'Không tìm thấy đợt');
    const scopeUnit = isAdmin(req) ? (req.query.unit_id ? Number(req.query.unit_id) : null) : req.survey.unit_id;
    const params = [round.id];
    let sql = `select l.token, l.form_code, u.id as unit_id, u.code, u.name, u.type, u.parent_id
      from ks_links l join ks_units u on u.id = l.unit_id where l.round_id = $1 and u.active`;
    if (scopeUnit) {
      params.push(scopeUnit);
      sql += ` and (u.id = $2 or u.parent_id = $2)`;
    }
    sql += " order by (u.type = 'tyt'), u.sort, u.name, l.form_code";
    const { rows } = await db.query(sql, params);
    return ok(res, {
      round: { ...round, label: stats.roundLabel(round) },
      links: rows.map((l) => ({ ...l, form_name: stats.FORM_LABELS[l.form_code], url: surveyUrl(l.token), url_phong_van: surveyUrl(l.token, 'phong_van') })),
    });
  }));

  router.get('/survey/links/:token/qr.png', anyRole, h(async (req, res) => {
    const link = await one('select * from ks_links where token = $1', [String(req.params.token)]);
    if (!link || !(await canAccessUnit(req, link.unit_id))) return fail(res, 404, 'Không tìm thấy');
    const size = Math.min(1200, Math.max(200, Number(req.query.size) || 600));
    const png = await QRCode.toBuffer(surveyUrl(link.token, req.query.mode), { type: 'png', width: size, margin: 2, errorCorrectionLevel: 'M' });
    res.setHeader('Content-Type', 'image/png');
    if (req.query.download) res.setHeader('Content-Disposition', `attachment; filename="QR-${link.form_code}-${link.token.slice(0, 6)}.png"`);
    return res.send(png);
  }));

  // ---------- Nhập phiếu giấy / phỏng vấn / đo lường độc lập ----------
  router.post('/survey/entry/:roundId/:unitId/:formCode', anyRole, h(async (req, res) => {
    const round = await one('select * from ks_rounds where id = $1', [Number(req.params.roundId)]);
    const unitId = Number(req.params.unitId);
    const unit = await one('select * from ks_units where id = $1', [unitId]);
    if (!round || !unit) return fail(res, 404, 'Không tìm thấy đợt hoặc đơn vị');
    if (!(await canAccessUnit(req, unitId))) return fail(res, 403, 'Không có quyền với đơn vị này');
    if (round.status !== 'mo' && !isAdmin(req)) return fail(res, 409, 'Đợt khảo sát không mở');
    const formCode = req.params.formCode;
    if (!stats.formsForRound(round).includes(formCode) || !stats.formApplies(unit, formCode)) return fail(res, 400, 'Mẫu phiếu không áp dụng cho đợt/đơn vị này');
    const def = await getForm(formCode);
    const wanted = req.body?.mode;
    const mode = wanted === 'doc_lap' && isAdmin(req) ? 'doc_lap' : wanted === 'phong_van' ? 'phong_van' : 'nhap_giay';
    const r = await saveResponse({
      def, roundId: round.id, unitId: unit.type === 'tyt' ? unit.parent_id : unit.id, tytId: unit.type === 'tyt' ? unit.id : null, mode, userId: req.user.sub, body: req.body,
    });
    if (!r.ok) return fail(res, 400, r.errors[0]?.message || 'Phiếu chưa hợp lệ', { errors: r.errors });
    return ok(res, { id: r.id, flags: r.flags }, 201);
  }));

  // ---------- Phiếu & cờ chất lượng ----------
  router.get('/survey/responses', anyRole, h(async (req, res) => {
    const roundId = Number(req.query.round_id);
    if (!roundId) return fail(res, 400, 'Thiếu đợt khảo sát');
    const unitId = isAdmin(req) ? (req.query.unit_id ? Number(req.query.unit_id) : null) : req.survey.unit_id;
    const params = [roundId];
    let sql = `select r.id, r.round_id, r.unit_id, u.code as unit_code, u.name as unit_name, r.form_code, r.mode, r.duration_sec,
        r.flags, r.excluded, r.created_at, r.comment
      from ks_responses r join ks_units u on u.id = r.unit_id where r.round_id = $1`;
    if (unitId) {
      params.push(unitId);
      sql += ` and r.unit_id = $${params.length}`;
    }
    if (req.query.form_code) {
      params.push(String(req.query.form_code));
      sql += ` and r.form_code = $${params.length}`;
    }
    if (req.query.flagged === '1') sql += " and r.flags <> '[]'::jsonb";
    params.push(Math.min(500, Number(req.query.limit) || 100), Math.max(0, Number(req.query.offset) || 0));
    sql += ` order by r.id desc limit $${params.length - 1} offset $${params.length}`;
    const { rows } = await db.query(sql, params);
    return ok(res, { responses: rows.map((x) => ({ ...x, id: Number(x.id), form_name: stats.FORM_LABELS[x.form_code] })), flag_labels: FLAG_LABELS });
  }));

  router.post('/survey/responses/:id/exclude', anyRole, h(async (req, res) => {
    const row = await one('select id, unit_id from ks_responses where id = $1', [Number(req.params.id)]);
    if (!row || !(await canAccessUnit(req, row.unit_id))) return fail(res, 404, 'Không tìm thấy phiếu');
    const { excluded } = z.object({ excluded: z.boolean() }).parse(req.body || {});
    await db.query('update ks_responses set excluded = $2 where id = $1', [row.id, excluded]);
    return ok(res, { id: Number(row.id), excluded });
  }));

  // ---------- Giải pháp cải tiến (áp dụng kết quả đo lường) ----------
  router.get('/survey/improvements/:roundId/:unitId', anyRole, h(async (req, res) => {
    const unitId = Number(req.params.unitId);
    if (!(await canAccessUnit(req, unitId))) return fail(res, 403, 'Không có quyền');
    const row = await one('select * from ks_improvements where round_id = $1 and unit_id = $2', [Number(req.params.roundId), unitId]);
    return ok(res, row || { applied: false, description: '', so_tyt_thuc_hien: null });
  }));

  router.put('/survey/improvements/:roundId/:unitId', anyRole, h(async (req, res) => {
    const unitId = Number(req.params.unitId);
    const roundId = Number(req.params.roundId);
    if (!(await canAccessUnit(req, unitId))) return fail(res, 403, 'Không có quyền');
    if (!(await one('select id from ks_rounds where id = $1', [roundId]))) return fail(res, 404, 'Không tìm thấy đợt');
    const body = z.object({
      description: z.string().max(5000).optional().nullable(),
      applied: z.boolean().optional(),
      so_tyt_thuc_hien: intOrNull.optional(),
    }).parse(req.body || {});
    const description = body.description?.trim() || null;
    const applied = body.applied ?? !!description;
    await db.query(
      `insert into ks_improvements (unit_id, round_id, applied, description, so_tyt_thuc_hien, updated_at, updated_by)
       values ($1, $2, $3, $4, $5, now(), $6)
       on conflict (unit_id, round_id) do update set applied = excluded.applied, description = excluded.description,
         so_tyt_thuc_hien = excluded.so_tyt_thuc_hien, updated_at = now(), updated_by = excluded.updated_by`,
      [unitId, roundId, applied, description, body.so_tyt_thuc_hien ?? null, req.user.sub]
    );
    return ok(res, { saved: true, applied });
  }));

  // ---------- Thành viên (cấp quyền cho tài khoản PeaceFlow) ----------
  router.get('/survey/members', adminOnly, h(async (req, res) => {
    const { rows } = await db.query(
      `select m.id, m.role, m.unit_id, m.created_at, u.email, coalesce(u.display_name, u.full_name) as name, k.code as unit_code, k.name as unit_name
       from ks_members m join users u on u.id = m.user_id left join ks_units k on k.id = m.unit_id order by m.role desc, k.sort nulls first, u.email`
    );
    return ok(res, rows);
  }));

  router.post('/survey/members', adminOnly, h(async (req, res) => {
    const body = z.object({
      email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
      role: z.enum(['so_yte', 'don_vi']),
      unit_id: z.preprocess((v) => (v === '' ? null : v), z.coerce.number().int().positive().nullable().optional()),
    }).parse(req.body || {});
    if (body.role === 'don_vi') {
      const u = body.unit_id ? await one("select id from ks_units where id = $1 and type <> 'tyt' and active", [body.unit_id]) : null;
      if (!u) return fail(res, 400, 'Vai trò đơn vị cần chọn một bệnh viện/TTYT');
    }
    const user = await one('select id, email from users where lower(email) = $1 limit 1', [body.email]);
    if (!user) return fail(res, 404, 'Không tìm thấy tài khoản PeaceFlow với email này — người dùng cần đăng ký trước');
    const row = await one(
      `insert into ks_members (user_id, role, unit_id, created_by) values ($1, $2, $3, $4)
       on conflict (user_id) do update set role = excluded.role, unit_id = excluded.unit_id returning id`,
      [user.id, body.role, body.role === 'don_vi' ? body.unit_id : null, req.user.sub]
    );
    return ok(res, { id: row.id }, 201);
  }));

  router.delete('/survey/members/:id', adminOnly, h(async (req, res) => {
    const r = await db.query('delete from ks_members where id = $1', [Number(req.params.id)]);
    if (!r.rowCount) return fail(res, 404, 'Không tìm thấy thành viên');
    return ok(res, { deleted: true });
  }));

  // ---------- Dashboard ----------
  const dashQuery = (req) => ({
    year: req.query.year ? Number(req.query.year) : null,
    quarter: req.query.quarter ? Number(req.query.quarter) : null,
    roundId: req.query.round_id ? Number(req.query.round_id) : null,
    unitType: ['benh_vien', 'ttyt'].includes(req.query.unit_type) ? req.query.unit_type : 'all',
    includeExcluded: req.query.include_excluded === '1',
    source: ['tu_do', 'doc_lap', 'tat_ca'].includes(req.query.source) ? req.query.source : 'tu_do',
  });

  router.get('/survey/dashboard/province', adminOnly, h(async (req, res) => {
    const qy = dashQuery(req);
    const s = await stats.provinceSummary(db, qy);
    const roundIds = [s.round?.id, s.tcmrRound?.id].filter(Boolean);
    const weakest = await stats.weakestItems(db, roundIds, { unitType: qy.unitType, includeExcluded: qy.includeExcluded, source: qy.source });
    return ok(res, {
      round: s.round ? { ...s.round, label: stats.roundLabel(s.round) } : null,
      tcmr_round: s.tcmrRound ? { ...s.tcmrRound, label: stats.roundLabel(s.tcmrRound) } : null,
      method: 'Cách thứ hai (gộp tất cả câu trả lời mức 1–5 của đơn vị); cấp tỉnh = trung bình cộng các đơn vị đã đo',
      province: roundObj(s.province),
      components: Object.fromEntries(Object.entries(s.componentsByForm).map(([f, c]) => [f, roundObj(c)])),
      kpi: roundObj(s.kpi),
      targets: s.targets,
      ranking: s.rows.map((x) => ({
        id: x.id, code: x.code, name: x.name, type: x.type,
        chung: r1(x.chung), chung_method1: r1(x.chung_method1),
        noi_tru: r1(x.forms.noi_tru.index), ngoai_tru: r1(x.forms.ngoai_tru.index), nhan_vien: r1(x.forms.nhan_vien.index),
        tcmr: x.forms.tcmr ? r1(x.forms.tcmr.index) : null,
        co_mau_kcb: x.co_mau_kcb, co_mau_tcmr: x.co_mau_tcmr, so_tyt: x.so_tyt, so_tyt_thuc_hien: x.so_tyt_thuc_hien,
        ty_le_tyt: r1(x.ty_le_tyt), ap_dung: x.ap_dung,
        progress: Object.fromEntries(Object.entries(x.forms).map(([f, v]) => [f, { n: v.n, required: v.required }])),
      })),
      weakest: weakest.map((w) => ({ ...w, index: r1(w.index) })),
      pending: s.pending,
    });
  }));

  router.get('/survey/dashboard/trend', adminOnly, h(async (req, res) => {
    const qy = dashQuery(req);
    const t = await stats.provinceTrend(db, { unitType: qy.unitType, source: qy.source });
    return ok(res, { quarters: t.quarters.map(roundObj), tcmr: t.tcmr.map(roundObj) });
  }));

  router.get('/survey/dashboard/unit/:unitId', anyRole, h(async (req, res) => {
    const unitId = Number(req.params.unitId);
    if (!(await canAccessUnit(req, unitId))) return fail(res, 403, 'Không có quyền');
    const qy = dashQuery(req);
    const units = await stats.loadUnits(db);
    const unit = units.byId.get(unitId);
    if (!unit || unit.type === 'tyt') return fail(res, 404, 'Không tìm thấy đơn vị');
    const { quy, tcmr } = await stats.resolveRounds(db, qy);
    const opts = { includeExcluded: qy.includeExcluded, source: qy.source };
    const prov = await stats.provinceSummary(db, { ...qy, unitType: 'all', units });
    const details = [];
    for (const round of [quy, tcmr].filter(Boolean)) details.push(await stats.unitDetail(db, unitId, round, opts, units));
    const forms = {};
    for (const d of details) {
      for (const [f, v] of Object.entries(d.forms)) {
        forms[f] = {
          label: v.label, round: d.round.label, round_id: d.round.id, n: v.n, flagged: v.flagged, required: v.required,
          method1: r1(v.method1), method2: r1(v.method2), components: roundObj(v.components),
          province: r1(prov.province[f]), province_components: roundObj(prov.componentsByForm[f]),
        };
      }
    }
    const quyDetail = details.find((d) => d.round.kind === 'quy');
    const roundIds = details.map((d) => d.round.id);
    const weakest = await stats.weakestItems(db, roundIds, { unitId, limit: 10, minValid: 3, ...opts });
    const comments = roundIds.length
      ? (await db.query(
        `select id, form_code, comment, created_at from ks_responses
         where unit_id = $1 and round_id = any($2::int[]) and comment is not null and btrim(comment) <> '' and not excluded
         order by id desc limit 200`, [unitId, roundIds])).rows.map((c) => ({ ...c, id: Number(c.id), form_name: stats.FORM_LABELS[c.form_code] }))
      : [];
    const trend = [];
    for (const round of (await db.query("select * from ks_rounds where kind = 'quy' order by year, period")).rows) {
      const d = await stats.unitDetail(db, unitId, round, opts, units);
      const p = await stats.provinceSummary(db, { roundId: round.id, units });
      trend.push({ label: stats.roundLabel(round), chung: r1(d.chung?.valid ? d.chung.method2 : null), nhan_vien: r1(d.forms.nhan_vien?.method2 ?? null), province_chung: r1(p.province.chung) });
    }
    const plans = {};
    for (const rid of roundIds) plans[rid] = await one('select applied, description, so_tyt_thuc_hien, updated_at from ks_improvements where unit_id = $1 and round_id = $2', [unitId, rid]);
    return ok(res, {
      unit,
      round: quy ? { ...quy, label: stats.roundLabel(quy) } : null,
      tcmr_round: tcmr ? { ...tcmr, label: stats.roundLabel(tcmr) } : null,
      chung: quyDetail?.chung?.valid ? { method1: r1(quyDetail.chung.method1), method2: r1(quyDetail.chung.method2), components: roundObj(quyDetail.chung.components) } : null,
      province_chung: r1(prov.province.chung),
      forms,
      weakest: weakest.map((w) => ({ ...w, index: r1(w.index) })),
      comments,
      trend,
      plans,
      components: COMPONENTS,
    });
  }));

  // ---------- Xuất dữ liệu ----------
  router.get('/survey/export/xlsx', adminOnly, h(async (req, res) => {
    const qy = dashQuery(req);
    const { buffer, summary } = await buildQuarterXlsx(db, qy);
    const label = summary.round ? `Q${summary.round.period}-${summary.round.year}` : `Q${qy.quarter}-${qy.year}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="chi-so-hai-long-${label}.xlsx"`);
    return res.send(buffer);
  }));

  router.get('/survey/export/csv', anyRole, h(async (req, res) => {
    const roundId = Number(req.query.round_id);
    const formCode = String(req.query.form_code || '');
    const def = await getForm(formCode);
    if (!roundId || !def) return fail(res, 400, 'Thiếu đợt hoặc mẫu phiếu');
    const unitId = isAdmin(req) ? (req.query.unit_id ? Number(req.query.unit_id) : null) : req.survey.unit_id;
    const csv = await buildResponsesCsv(db, { roundId, formCode, unitId, def });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="phieu-${formCode}-dot${roundId}${unitId ? '-dv' + unitId : ''}.csv"`);
    return res.send(csv);
  }));

  return router;
}

export default createSurveyRouter();
