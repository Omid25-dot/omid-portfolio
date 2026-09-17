export interface RateLimitStore { consume(key: string, limit: number, windowSeconds: number): Promise<boolean> }
// INCR and expiry are atomic, including concurrent requests across Vercel instances.
export const consumeScript = `local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return count`;
export class RedisRestStore implements RateLimitStore {
  constructor(private url: string, private token: string) {}
  async consume(key: string, limit: number, windowSeconds: number) {
    const response = await fetch(this.url, {
      method: 'POST', headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', consumeScript, '1', key, String(windowSeconds)]),
      cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Rate limit unavailable');
    const body = await response.json();
    if (!Number.isSafeInteger(body.result) || body.result < 1 || body.error) throw new Error('Rate limit unavailable');
    return body.result <= limit;
  }
}
