import 'server-only';
import { z } from 'zod';
export function appOrigin() {
  const value = z.url().parse(process.env.NEXT_PUBLIC_APP_URL);
  const url = new URL(value);
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
      (url.protocol !== 'https:' && !(['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol === 'http:'))) {
    throw new Error('Invalid application origin configuration');
  }
  return url.origin;
}
export function serverSecret(name: 'SUPABASE_SERVICE_ROLE_KEY' | 'SECURITY_HMAC_SECRET') {
  return z.string().min(32).parse(process.env[name]);
}
