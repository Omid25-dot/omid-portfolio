import { z } from 'zod';
import { roles } from '@/lib/permissions/policy';
export const idSchema = z.uuid();
export const emailSchema = z.email().trim().toLowerCase().max(254);
export const passwordSchema = z.string().min(12, 'Use at least 12 characters.').max(128);
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) }).strict();
export const signupSchema = z.object({ email: emailSchema, password: passwordSchema }).strict();
export const resetRequestSchema = z.object({ email: emailSchema }).strict();
export const resetPasswordSchema = z.object({ password: passwordSchema, confirm_password: z.string() }).strict()
  .refine(v => v.password === v.confirm_password, { path: ['confirm_password'], message: 'Passwords must match.' });
export const profileUpdateSchema = z.object({
  first_name: z.string().trim().max(80), last_name: z.string().trim().max(80),
  phone: z.string().trim().max(30).regex(/^[+\d ()-]*$/, 'Enter a valid phone number.'),
}).strict();
export const profileRecordSchema = profileUpdateSchema.extend({
  id: idSchema, role: z.enum(roles), account_status: z.enum(['active', 'restricted', 'suspended']),
});
export const roleChangeSchema = z.object({ user_id: idSchema, role: z.enum(roles) }).strict();
export const paginationSchema = z.object({ page: z.coerce.number().int().min(1).max(10000).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) }).strict();
export const basisPointsSchema = z.number().int().min(0).max(10000);
export const confirmationSchema = z.object({ token_hash: z.string().min(20).max(512).regex(/^[a-zA-Z0-9_-]+$/), type: z.enum(['signup', 'recovery']) }).strict();
