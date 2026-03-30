const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const GEMINI_DEFAULT_MODEL = 'gemini-2.0-flash';

function normalize(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getGeminiConfig() {
  return {
    apiBaseUrl: GEMINI_API_BASE_URL,
    model: GEMINI_DEFAULT_MODEL,
  } as const;
}

export const GeminiConfig = {
  apiBaseUrl: GEMINI_API_BASE_URL,
  model: GEMINI_DEFAULT_MODEL,
} as const;
