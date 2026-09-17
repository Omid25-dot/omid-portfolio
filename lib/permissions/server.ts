import 'server-only';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getPublicSupabaseConfig } from '@/lib/config/public';
import { hasRole, mayAccessAccount, safeNext, type Role } from './policy';
import { profileRecordSchema } from '@/lib/validation/schemas';
export async function requireAuthenticatedUser(next = '/account') {
  if (!getPublicSupabaseConfig()) redirect('/setup');
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect(`/login?next=${encodeURIComponent(safeNext(next))}`);
  const { data, error: profileError } = await supabase.from('profiles')
    .select('id,first_name,last_name,phone,role,account_status').eq('id', user.id).single();
  const parsed = profileRecordSchema.safeParse(data);
  if (profileError || !parsed.success) redirect('/setup');
  if (!mayAccessAccount(parsed.data)) redirect('/forbidden');
  return { user, profile: parsed.data, supabase };
}
export async function requireRole(allowed: readonly Role[]) {
  const context = await requireAuthenticatedUser('/admin');
  if (!hasRole(context.profile, allowed)) redirect('/forbidden');
  return context;
}
export const requireAdmin = () => requireRole(['admin', 'super_admin']);
export const requireSuperAdmin = () => requireRole(['super_admin']);
