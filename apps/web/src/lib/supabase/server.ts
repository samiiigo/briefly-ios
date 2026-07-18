import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { tryGetPublicAppConfig } from '@briefly/env';

function requireServerConfig() {
  const config = tryGetPublicAppConfig();
  if (config) return config;
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
    supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'public-anon-key',
    appVariant: 'development',
  };
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabasePublishableKey } = requireServerConfig();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — middleware will refresh the session.
        }
      },
    },
  });
}
