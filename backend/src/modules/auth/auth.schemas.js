import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  display_name: z.string().optional(),
  consent_privacy: z.boolean().refine(v => v === true),
  consent_terms: z.boolean().refine(v => v === true),
  consent_sensitive_data: z.boolean().default(false)
});

const coerceBool = z.preprocess(
  (v) => v === true || v === 'true' || v === 'on' || v === '1',
  z.boolean()
);

export const registerExpertSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  display_name: z.string().optional(),
  phone: z.string().min(6, 'Số điện thoại không hợp lệ.'),
  degree: z.string().min(2, 'Vui lòng nhập bằng cấp.'),
  // specialties: nhận chuỗi "a, b, c" hoặc JSON array -> chuẩn hoá thành mảng
  specialties: z.preprocess((v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return [];
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) { /* not JSON */ }
      return s.split(',').map((x) => x.trim()).filter(Boolean);
    }
    return [];
  }, z.array(z.string()).default([])),
  experience_years: z.coerce.number().int().min(0).max(80).default(0),
  location: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  consent_privacy: coerceBool.refine(v => v === true, 'Bạn cần đồng ý điều khoản.'),
  consent_terms: coerceBool.refine(v => v === true, 'Bạn cần đồng ý điều khoản.')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1)
});

export const logoutSchema = z.object({
  refresh_token: z.string().min(1)
});
