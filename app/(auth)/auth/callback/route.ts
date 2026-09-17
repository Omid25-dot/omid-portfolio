import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { appOrigin } from '@/lib/config/server';
import { enforceRateLimit } from '@/lib/rate-limit/server';
export async function GET(request: NextRequest) {
 let origin: string;
 try { origin = appOrigin(); } catch {
  return NextResponse.json({ error: 'Account services are not configured.' }, { status: 503 });
 }
 const code = request.nextUrl.searchParams.get('code');
 try {
  if (code && code.length < 2048) {
   await enforceRateLimit('auth-callback');
   const supabase = await createServerSupabase();
   const { error } = await supabase.auth.exchangeCodeForSession(code);
   if (!error) return NextResponse.redirect(`${origin}/account`, { headers: { 'Cache-Control':'private, no-store' } });
  }
 } catch { /* Safe failure; never include codes/provider errors in redirects. */ }
 return NextResponse.redirect(`${origin}/login`, { headers: { 'Cache-Control':'private, no-store' } });
}
