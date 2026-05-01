const OPENAI_API_BASE_URL = 'https://api.openai.com/v1';
const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini';

export const OpenAIConfig = {
  apiBaseUrl: OPENAI_API_BASE_URL,
  model: OPENAI_DEFAULT_MODEL,
} as const;
