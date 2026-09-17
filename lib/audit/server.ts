import 'server-only';
import { requireAdmin } from '@/lib/permissions/server';
/** Uses the reusable SQL append_audit foundation. Actor and safe metadata derive on the server.
 * Domain mutations must call append_audit in the SAME SQL transaction as their changes.
 */
export async function recordAccessReview() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc('record_access_review');
  if (error || !data) throw new Error('Audit write failed');
  return data as string;
}
