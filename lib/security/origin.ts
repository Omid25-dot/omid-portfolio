import 'server-only';
import { headers } from 'next/headers';
import { appOrigin } from '@/lib/config/server';
export async function assertSameOrigin() {
  if ((await headers()).get('origin') !== appOrigin()) throw new Error('Invalid request origin');
}
