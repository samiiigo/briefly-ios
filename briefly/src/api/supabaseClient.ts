import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getPublicAppConfig } from '@/shared/config/env';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;
  const { supabaseUrl, supabasePublishableKey } = getPublicAppConfig();
  client = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: AsyncStorage,
    },
  });
  return client;
}

export function resetSupabaseClientForTests(): void {
  client = null;
}
