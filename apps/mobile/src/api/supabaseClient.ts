import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSupabaseClient } from '@briefly/api';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicAppConfig } from '@/config/env';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;
  const { supabaseUrl, supabasePublishableKey } = getPublicAppConfig();
  client = createSupabaseClient({
    url: supabaseUrl,
    key: supabasePublishableKey,
    storage: AsyncStorage,
    detectSessionInUrl: false,
  });
  return client;
}

export function resetSupabaseClientForTests(): void {
  client = null;
}
