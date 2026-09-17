import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir: './tests/e2e', fullyParallel: false, workers: 1,
 use: { channel: process.env.PLAYWRIGHT_CHANNEL || undefined, baseURL: 'http://127.0.0.1:3101', viewport: { width: 390, height: 844 } },
 webServer: [
  { command: 'node tests/fixtures/auth-server.mjs', url: 'http://127.0.0.1:54399', reuseExistingServer: false },
  { command: 'npm run dev -- --hostname 127.0.0.1 --port 3101', url: 'http://127.0.0.1:3101', reuseExistingServer: false, timeout: 120000,
    env: { NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54399', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-only-anon-key', NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3101', UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '', SECURITY_HMAC_SECRET: 'test-only-secret-with-at-least-32-characters' } },
 ],
});
