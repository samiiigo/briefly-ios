/**
 * GeminiProvider — Gemini-specific summarization (SRP + OCP)
 *
 * Only knows how to resolve Gemini credentials and model config.
 */

import Constants from 'expo-constants';
import { CloudLLMProvider, CloudLLMConfig } from './cloudLLMProvider';
import { GeminiConfig } from '@/constants/api/gemini';

export class GeminiProvider extends CloudLLMProvider {
  readonly name = 'Gemini';

  constructor(private readonly apiKey: string) {
    super();
  }

  protected resolveConfig(): CloudLLMConfig {
    const expoConfig: any = Constants.expoConfig ?? {};
    const extra: any = expoConfig.extra ?? {};

    const model: string =
      extra.geminiModelId ??
      extra.GEMINI_MODEL_ID ??
      GeminiConfig.model;

    return {
      endpoint: `${GeminiConfig.apiBaseUrl}chat/completions`,
      model,
      headers: { Authorization: `Bearer ${this.apiKey}` },
    };
  }
}
