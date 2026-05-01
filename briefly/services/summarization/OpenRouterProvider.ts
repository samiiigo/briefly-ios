/**
 * OpenRouterProvider — OpenRouter-specific summarization (SRP + OCP)
 *
 * Only knows how to resolve OpenRouter credentials and headers.
 * All HTTP/parsing logic is inherited from CloudLLMProvider.
 */

import Constants from 'expo-constants';
import { CloudLLMProvider, CloudLLMConfig } from './CloudLLMProvider';
import { OpenRouterConfig } from '../../constants/api/openRouter';

export class OpenRouterProvider extends CloudLLMProvider {
  readonly name = 'OpenRouter';

  constructor(private readonly apiKey: string) {
    super();
  }

  protected resolveConfig(): CloudLLMConfig {
    const expoConfig: any = Constants.expoConfig ?? {};
    const extra: any = expoConfig.extra ?? {};

    const model: string =
      extra.openRouterModelId ??
      extra.OPENROUTER_MODEL_ID ??
      OpenRouterConfig.model;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    const referer: string | undefined =
      extra.openRouterReferer ?? extra.OPENROUTER_REFERER;
    if (referer) {
      headers['HTTP-Referer'] = referer;
    }

    const title: string =
      extra.openRouterTitle ??
      extra.OPENROUTER_TITLE ??
      expoConfig.name ??
      'Briefly';
    headers['X-OpenRouter-Title'] = title;

    return {
      endpoint: `${OpenRouterConfig.apiBaseUrl}/chat/completions`,
      model,
      headers,
    };
  }
}
