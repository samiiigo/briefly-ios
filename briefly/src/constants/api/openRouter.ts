export {
  getOpenRouterSharedApiKey,
  requireOpenRouterSharedApiKey,
} from '@/security/sharedApiKeys';
export { toOpenRouterOpenAIModelId } from './openRouterModel';
const OPENROUTER_DEFAULT_MODEL = 'openai/gpt-4.1-mini';
const OPENROUTER_API_BASE_URL = 'https://openrouter.ai/api/v1';
export const OpenRouterConfig = {
  apiBaseUrl: OPENROUTER_API_BASE_URL,
  model: OPENROUTER_DEFAULT_MODEL,
} as const;
