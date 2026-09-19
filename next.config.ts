import type { NextConfig } from 'next';
const config: NextConfig = {
  images:{remotePatterns:process.env.NEXT_PUBLIC_SUPABASE_URL?[{protocol:new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).protocol==='https:'?'https':'http',hostname:new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,port:new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).port,pathname:'/storage/v1/object/public/equipment-public/**'}]:[]},
  poweredByHeader: false,
  agentRules: false,
  logging: { incomingRequests: false },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
    ] }];
  },
};
export default config;
