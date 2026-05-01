const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
const GEMINI_DEFAULT_MODEL = 'gemini-2.0-flash';

export const GeminiConfig = {
  apiBaseUrl: GEMINI_API_BASE_URL,
  model: GEMINI_DEFAULT_MODEL,
} as const;
