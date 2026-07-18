import Constants from 'expo-constants';

function normalize(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readExtra(): Record<string, unknown> {
  return (Constants.expoConfig?.extra as Record<string, unknown> | undefined) ?? {};
}

function readEnvOrExtra(envKey: string, extraKey: string): string | undefined {
  return normalize(process.env[envKey]) ?? normalize(readExtra()[extraKey] as string | undefined);
}

export interface PublicAppConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
  appVariant: string;
}

export function getPublicAppConfig(): PublicAppConfig {
  if (process.env.NODE_ENV === 'test') {
    return {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
      supabasePublishableKey:
        process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'test-publishable-key',
      appVariant: 'test',
    };
  }
  const supabaseUrl = readEnvOrExtra('EXPO_PUBLIC_SUPABASE_URL', 'supabaseUrl');
  const supabasePublishableKey =
    readEnvOrExtra('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'supabasePublishableKey') ??
    readEnvOrExtra('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'supabaseAnonKey');
  const appVariant = readEnvOrExtra('APP_VARIANT', 'appVariant') ?? 'development';

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Supabase public config is missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  return { supabaseUrl, supabasePublishableKey, appVariant };
}

export function tryGetPublicAppConfig(): PublicAppConfig | null {
  try {
    return getPublicAppConfig();
  } catch {
    return null;
  }
}
