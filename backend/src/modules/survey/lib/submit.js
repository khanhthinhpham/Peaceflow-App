// Kiểm tra & chuẩn hoá một phiếu khảo sát (thuần, không truy cập CSDL) — dùng chung cho
// phiếu công khai (QR/link), phỏng vấn, nhập phiếu giấy và đo lường độc lập.
import crypto from 'crypto';
import { z } from 'zod';
import { computeFlags } from './quality.js';
import { countAnswers } from './indices.js';

const blankToUndef = (v) => (v === '' || v === null ? undefined : v);

/** Dựng schema zod từ định nghĩa mẫu phiếu. */
export function buildSchema(def, { allowMissingItems = false } = {}) {
  const likert = z.coerce.number().int().min(0).max(5);
  const itemShape = {};
  for (const g of def.groups) for (const it of g.items) itemShape[it.code] = allowMissingItems ? likert.optional() : likert;

  const demoShape = {};
  for (const d of def.demographics || []) {
    let s;
    if (d.type === 'number') {
      s = z.coerce.number({ invalid_type_error: `${d.label}: phải là số` });
      if (d.min !== undefined) s = s.min(d.min, { message: d.code === 'tuoi' ? 'Người trả lời phải từ 18 tuổi trở lên' : `${d.label}: tối thiểu ${d.min}` });
      if (d.max !== undefined) s = s.max(d.max, { message: `${d.label}: tối đa ${d.max}` });
    } else if (d.type === 'choice') {
      const vals = d.options.map((o) => o.v);
      s = z.coerce.number().int().refine((v) => vals.includes(v), { message: `${d.label}: giá trị không hợp lệ` });
    } else {
      s = z.string().trim().max(d.maxLength || 200);
    }
    demoShape[d.code] = d.required ? s : z.preprocess(blankToUndef, s.optional());
  }

  const shape = {
    consent: z.literal(true, { errorMap: () => ({ message: 'Cần xác nhận đồng ý tham gia khảo sát' }) }),
    answers: z.object(itemShape).strict(),
    demographics: z.object(demoShape).strip(),
    comment: z.string().trim().max(2000).optional().nullable(),
    start_token: z.string().max(200).optional().nullable(),
    tyt_id: z.preprocess(blankToUndef, z.coerce.number().int().positive().optional()),
  };
  if (def.phone && !def.anonymous) {
    shape.phone = z
      .string()
      .trim()
      .max(20)
      .optional()
      .nullable()
      .refine((v) => !v || /^(\+?84|0)\d{9,10}$/.test(v.replace(/[\s.-]/g, '')), { message: 'Số điện thoại không hợp lệ' });
  }
  if (def.expect) shape.expect_pct = z.preprocess(blankToUndef, z.coerce.number().int().min(0).max(200).optional());
  if (def.return) {
    const vals = def.return.options.map((o) => o.v);
    shape.return_intent = z.preprocess(blankToUndef, z.coerce.number().int().refine((v) => vals.includes(v)).optional());
  }
  return z.object(shape).strip();
}

export function phoneHash(phone, salt) {
  if (!phone) return null;
  let p = String(phone).replace(/[\s.-]/g, '');
  if (p.startsWith('+84')) p = '0' + p.slice(3);
  else if (p.startsWith('84') && p.length >= 11) p = '0' + p.slice(2);
  return crypto.createHash('sha256').update(salt + ':' + p).digest('hex');
}

/** Token thời điểm mở phiếu (ký HMAC) để máy chủ tự tính thời gian làm phiếu. */
export function makeStartToken(secret, now = Date.now()) {
  const ts = now.toString(36);
  const sig = crypto.createHmac('sha256', secret).update(ts).digest('base64url').slice(0, 22);
  return `${ts}.${sig}`;
}

export function readStartToken(token, secret, now = Date.now()) {
  if (!token || typeof token !== 'string') return null;
  const [ts, sig] = token.split('.');
  if (!ts || !sig) return null;
  const expect = crypto.createHmac('sha256', secret).update(ts).digest('base64url').slice(0, 22);
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  const sec = Math.round((now - parseInt(ts, 36)) / 1000);
  return sec >= 0 && sec < 86400 ? sec : null;
}

export function formatZodError(err) {
  return err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
}

/**
 * Kiểm tra phiếu và dựng bản ghi để lưu. Không kiểm tra trùng số điện thoại (cần CSDL — route làm).
 * Trả về { ok:false, errors } hoặc { ok:true, record }.
 */
export function prepareResponse(def, body, { mode, secret, salt, durationSec = null }) {
  const allowMissingItems = mode === 'nhap_giay' || mode === 'doc_lap';
  const parsed = buildSchema(def, { allowMissingItems }).safeParse(body || {});
  if (!parsed.success) return { ok: false, errors: formatZodError(parsed.error) };
  const data = parsed.data;
  const answers = Object.fromEntries(Object.entries(data.answers).filter(([, v]) => v !== undefined));
  if (Object.keys(answers).length === 0) return { ok: false, errors: [{ path: 'answers', message: 'Chưa có câu trả lời nào' }] };

  let duration = durationSec;
  if (duration === null && data.start_token) duration = readStartToken(data.start_token, secret);

  const compOf = {};
  for (const g of def.groups) for (const it of g.items) compOf[it.code] = g.component;
  const compCounts = countAnswers(Object.entries(answers).map(([code, value]) => ({ component: compOf[code], value })));

  // NVYT ẩn danh: không bao giờ lưu số điện thoại (kể cả dạng băm)
  const hash = def.phone && !def.anonymous ? phoneHash(data.phone, salt) : null;
  const flags = computeFlags({ formCode: def.code, durationSec: duration, answers, mode });
  return {
    ok: true,
    record: {
      answers,
      comp_counts: compCounts,
      demographics: data.demographics || {},
      meta: { expect_pct: data.expect_pct ?? null, return_intent: data.return_intent ?? null },
      comment: data.comment || null,
      phone_hash: hash,
      duration_sec: duration,
      flags,
      tyt_id: data.tyt_id ?? null,
      mode,
      form_version: def.version || 1,
    },
  };
}
