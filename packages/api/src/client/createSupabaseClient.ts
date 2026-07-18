import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';

export interface CreateSupabaseClientOptions {
  url: string;
  key: string;
  storage?: SupportedStorage;
  detectSessionInUrl?: boolean;
}

export function createSupabaseClient(options: CreateSupabaseClientOptions): SupabaseClient {
  return createClient(options.url, options.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: options.detectSessionInUrl ?? false,
      storage: options.storage,
    },
  });
}
