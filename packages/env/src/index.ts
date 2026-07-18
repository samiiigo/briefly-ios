export interface PublicAppConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
  appVariant: string;
}

export interface EnvReader {
  get(key: string): string | undefined;
}

export interface CreatePublicAppConfigOptions {
  /** Defaults to `process.env` when omitted. */
  reader?: EnvReader;
  /** Optional extra values (e.g. Expo `Constants.expoConfig.extra`). */
  extra?: Record<string, unknown>;
}

function normalize(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readEnvOrExtra(
  reader: EnvReader,
  extra: Record<string, unknown>,
  envKey: string,
  extraKey: string,
): string | undefined {
  return normalize(reader.get(envKey)) ?? normalize(extra[extraKey] as string | undefined);
}

const defaultReader: EnvReader = {
  get: (key) => process.env[key],
};

/**
 * Builds public app configuration from environment variables and optional extra values.
 * Platform-agnostic — callers may pass Expo `Constants.expoConfig.extra` via `extra`.
 */
export function createPublicAppConfig(options: CreatePublicAppConfigOptions = {}): PublicAppConfig {
  const reader = options.reader ?? defaultReader;
  const extra = options.extra ?? {};

  if (reader.get('NODE_ENV') === 'test') {
    return {
      supabaseUrl: reader.get('EXPO_PUBLIC_SUPABASE_URL') ?? 'http://127.0.0.1:54321',
      supabasePublishableKey:
        reader.get('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ?? 'test-publishable-key',
      appVariant: 'test',
    };
  }

  const supabaseUrl = readEnvOrExtra(reader, extra, 'EXPO_PUBLIC_SUPABASE_URL', 'supabaseUrl');
  const supabasePublishableKey =
    readEnvOrExtra(
      reader,
      extra,
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'supabasePublishableKey',
    ) ?? readEnvOrExtra(reader, extra, 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'supabaseAnonKey');
  const appVariant = readEnvOrExtra(reader, extra, 'APP_VARIANT', 'appVariant') ?? 'development';

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Supabase public config is missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  return { supabaseUrl, supabasePublishableKey, appVariant };
}

/** Reads public config from `process.env` with optional Expo extra injection. */
export function getPublicAppConfig(extra?: Record<string, unknown>): PublicAppConfig {
  return createPublicAppConfig({ extra });
}

export function tryGetPublicAppConfig(extra?: Record<string, unknown>): PublicAppConfig | null {
  try {
    return getPublicAppConfig(extra);
  } catch {
    return null;
  }
}
