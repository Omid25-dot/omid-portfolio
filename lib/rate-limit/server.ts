import 'server-only';
import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { z } from 'zod';
import { serverSecret } from '@/lib/config/server';
import { RedisRestStore } from './core';
import { RateLimitError } from './errors';
const configSchema = z.object({ url: z.url().startsWith('https://'), token: z.string().min(1) });
export async function enforceRateLimit(operation: string, identity?: string) {
  const parsed = configSchema.safeParse({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  if (!parsed.success) throw new Error('Rate limit not configured');
  const store = new RedisRestStore(parsed.data.url, parsed.data.token);
  // Only Vercel's overwritten header is trusted. Other hosts share a conservative bucket.
  const ip = process.env.VERCEL === '1' ? (await headers()).get('x-vercel-forwarded-for') || 'unknown' : 'local-or-untrusted-proxy';
  const hash = (v: string) => createHmac('sha256', serverSecret('SECURITY_HMAC_SECRET')).update(v).digest('hex');
  if (!await store.consume(`rental:${operation}:source:${hash(ip)}`, 20, 900)) throw new RateLimitError();
  if (identity && !await store.consume(`rental:${operation}:identity:${hash(identity)}`, 8, 900)) throw new RateLimitError();
}
