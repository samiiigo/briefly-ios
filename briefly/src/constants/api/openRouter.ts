import Constants from 'expo-constants';

const STATIC_SHARED_OPENROUTER_API_KEY = '';
const OPENROUTER_DEFAULT_MODEL = 'openai/gpt-4.1-mini';
const OPENROUTER_API_BASE_URL = 'https://openrouter.ai/api/v1';

function normalize(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readExpoExtraKey(): string | undefined {
  const extra = (Constants.expoConfig?.extra as Record<string, unknown> | undefined) ?? {};
  const candidate =
    (extra.openRouterSharedApiKey as string | undefined) ??
    (extra.OPENROUTER_SHARED_API_KEY as string | undefined);
  return normalize(candidate);
}

export function getOpenRouterSharedApiKey(): string | undefined {
  return (
    normalize(process.env.EXPO_PUBLIC_OPENROUTER_API_KEY) ??
    readExpoExtraKey() ??
    normalize(STATIC_SHARED_OPENROUTER_API_KEY)
  );
}

export function requireOpenRouterSharedApiKey(): string {
  const key = getOpenRouterSharedApiKey();
  if (!key) {
    throw new Error(
      'OpenRouter shared API key is missing in app config. Set EXPO_PUBLIC_OPENROUTER_API_KEY or expo.extra.openRouterSharedApiKey.'
    );
  }
  return key;
}

export { toOpenRouterOpenAIModelId } from './openRouterModel';

export const OpenRouterConfig = {
  apiBaseUrl: OPENROUTER_API_BASE_URL,
  model: OPENROUTER_DEFAULT_MODEL,
} as const;

