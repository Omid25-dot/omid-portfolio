'use client';
import { createBrowserClient } from '@supabase/ssr';
import { getPublicSupabaseConfig } from '@/lib/config/public';
export function createBrowserSupabase() {
  const config = getPublicSupabaseConfig();
  if (!config) throw new Error('Authentication is not configured.');
  return createBrowserClient(config.url, config.key);
}
