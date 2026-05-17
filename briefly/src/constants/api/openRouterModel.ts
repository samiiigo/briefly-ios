const OPENROUTER_DEFAULT_OPENAI_MODEL = 'openai/gpt-4.1-mini';

/** Ensures an OpenAI model id is valid on OpenRouter (e.g. gpt-4o-mini → openai/gpt-4o-mini). */
export function toOpenRouterOpenAIModelId(
  model: string,
  fallback: string = OPENROUTER_DEFAULT_OPENAI_MODEL,
): string {
  const trimmed = model.trim();
  if (!trimmed) return fallback;
  if (trimmed.includes('/')) return trimmed;
  return `openai/${trimmed}`;
}
