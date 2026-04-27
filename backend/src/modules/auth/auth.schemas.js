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

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
