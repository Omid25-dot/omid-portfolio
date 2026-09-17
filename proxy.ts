import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getPublicSupabaseConfig } from '@/lib/config/public';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store');
  const config = getPublicSupabaseConfig();
  if (!config) return response;
  const supabase = createServerClient(config.url, config.key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll(values) {
      values.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      response.headers.set('Cache-Control', 'private, no-store');
    },
  } });
  await supabase.auth.getUser();
  // This only refreshes sessions. Each protected page/action checks identity and role.
  return response;
}
export const config = { matcher: ['/account/:path*', '/admin/:path*', '/login', '/signup', '/forgot-password', '/reset-password', '/auth/:path*'] };
