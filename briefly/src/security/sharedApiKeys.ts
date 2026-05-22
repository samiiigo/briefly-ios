import Constants from 'expo-constants';

/**
 * Build-time shared API keys (Briefly-provided cloud features).
 *
 * OWASP: secrets must not be hard-coded or read from EXPO_PUBLIC_* at runtime
 * (those embed in the JS bundle). Keys are injected once via app.config.js →
 * expo.extra during EAS/local prebuild from ASSEMBLYAI_API_KEY / OPENROUTER_SHARED_API_KEY.
 *
 * Note: Any key shipped inside a mobile binary can be extracted; prefer EAS
 * secrets and rotate keys if leaked. User BYOK keys use SecureStore instead.
 */

function normalize(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readExpoExtra(): Record<string, unknown> {
  return (Constants.expoConfig?.extra as Record<string, unknown> | undefined) ?? {};
}

function readBuildTimeKey(
  primaryExtraKey: string,
  legacyExtraKey: string
): string | undefined {
  const extra = readExpoExtra();
  return (
    normalize(extra[primaryExtraKey] as string | undefined) ??
    normalize(extra[legacyExtraKey] as string | undefined)
  );
}

export function getAssemblyAISharedApiKey(): string | undefined {
  return readBuildTimeKey('assemblyAiApiKey', 'ASSEMBLYAI_API_KEY');
}

export function requireAssemblyAISharedApiKey(): string {
  const key = getAssemblyAISharedApiKey();
  if (!key) {
    throw new Error(
      'AssemblyAI shared API key is missing. Set ASSEMBLYAI_API_KEY (EAS secret or .env for local build) — do not rely on EXPO_PUBLIC_* in production.'
    );
  }
  return key;
}

export function getOpenRouterSharedApiKey(): string | undefined {
  return readBuildTimeKey('openRouterSharedApiKey', 'OPENROUTER_SHARED_API_KEY');
}

export function requireOpenRouterSharedApiKey(): string {
  const key = getOpenRouterSharedApiKey();
  if (!key) {
    throw new Error(
      'OpenRouter shared API key is missing. Set OPENROUTER_SHARED_API_KEY (EAS secret or .env for local build) — do not rely on EXPO_PUBLIC_* in production.'
    );
  }
  return key;
}
