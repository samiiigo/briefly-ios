const OPENAI_API_BASE_URL = 'https://api.openai.com/v1';
const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini';

function normalize(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getOpenAIConfig() {
  return {
    apiBaseUrl: OPENAI_API_BASE_URL,
    model: OPENAI_DEFAULT_MODEL,
  } as const;
}

export const OpenAIConfig = {
  apiBaseUrl: OPENAI_API_BASE_URL,
  model: OPENAI_DEFAULT_MODEL,
} as const;
