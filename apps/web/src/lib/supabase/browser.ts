import { createBrowserClient } from '@supabase/ssr';
import { tryGetPublicAppConfig } from '@briefly/env';

function requireBrowserConfig() {
  const config = tryGetPublicAppConfig();
  if (config) return config;
  // Soft fallback for local/CI builds without env files.
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
    supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'public-anon-key',
    appVariant: 'development',
  };
}

export function createBrowserSupabaseClient() {
  const { supabaseUrl, supabasePublishableKey } = requireBrowserConfig();
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
