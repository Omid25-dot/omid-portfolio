import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseConfig } from '@/lib/config/public';
import { serverSecret } from '@/lib/config/server';
/** Bypasses RLS. Never use for ordinary user requests. Authorise before calling. */
export function createAdminSupabase() {
  const config = getPublicSupabaseConfig();
  if (!config) throw new Error('Supabase is not configured.');
  return createClient(config.url, serverSecret('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
