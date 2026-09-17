'use server';
import { revalidatePath } from 'next/cache';
import { requireAuthenticatedUser, requireSuperAdmin, requireAdmin } from '@/lib/permissions/server';
import { profileUpdateSchema, roleChangeSchema } from '@/lib/validation/schemas';
import { assertSameOrigin } from '@/lib/security/origin';
import { enforceRateLimit } from '@/lib/rate-limit/server';
import { reportFailure } from '@/lib/security/errors';
import { recordAccessReview } from '@/lib/audit/server';
import type { FormState } from '@/types/forms';
export async function updateProfile(_previous: FormState, form: FormData): Promise<FormState> {
  const { user, supabase } = await requireAuthenticatedUser();
  const parsed = profileUpdateSchema.safeParse({ first_name: form.get('first_name'), last_name: form.get('last_name'), phone: form.get('phone') });
  if (!parsed.success) return { error: 'Check the highlighted fields.', fields: parsed.error.flatten().fieldErrors };
  try {
    await assertSameOrigin(); await enforceRateLimit('profile-update', user.id);
    const { data, error } = await supabase.from('profiles').update(parsed.data).eq('id', user.id).select('id').single();
    if (error || !data) return reportFailure('profile.update');
  } catch (error) { return reportFailure('profile.update', error); }
  revalidatePath('/account'); return { success: 'Profile saved.' };
}
export async function changeRole(_previous: FormState, form: FormData): Promise<FormState> {
  const { user, supabase } = await requireSuperAdmin();
  const parsed = roleChangeSchema.safeParse({ user_id: form.get('user_id'), role: form.get('role') });
  if (!parsed.success) return { error: 'Enter a valid user ID and role.', fields: parsed.error.flatten().fieldErrors };
  if (parsed.data.user_id === user.id) return { error: 'You cannot change your own role.' };
  if (form.get('confirm') !== 'yes') return { error: 'Confirm the role change before continuing.' };
  try {
    await assertSameOrigin(); await enforceRateLimit('role-change', user.id);
    const { error } = await supabase.rpc('change_profile_role', { p_user_id: parsed.data.user_id, p_role: parsed.data.role });
    if (error) return reportFailure('profile.role-change');
    return { success: 'Role saved and audit entry recorded.' };
  } catch (error) { return reportFailure('profile.role-change', error); }
}
export async function accessReview(_previous: FormState, form: FormData): Promise<FormState> {
  const { user } = await requireAdmin();
  if (form.get('confirm') !== 'yes') return { error: 'Confirm that you reviewed access.' };
  try {
    await assertSameOrigin(); await enforceRateLimit('access-review', user.id);
    await recordAccessReview();
    return { success: 'Access review recorded in the private audit log.' };
  } catch (error) { return reportFailure('audit.access-review', error); }
}
