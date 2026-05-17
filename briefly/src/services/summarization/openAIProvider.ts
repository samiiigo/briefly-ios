/**
 * OpenAIProvider — OpenAI models via OpenRouter (SRP + OCP)
 *
 * Uses the OpenRouter chat completions API with an `openai/<model>` slug.
 * Requires an OpenRouter API key (sk-or-...).
 */

import { OpenRouterProvider } from './openRouterProvider';

/** @deprecated Prefer `new OpenRouterProvider(key, 'openai')` — kept for factory clarity. */
export class OpenAIProvider extends OpenRouterProvider {
  constructor(apiKey: string) {
    super(apiKey, 'openai');
  }
}
