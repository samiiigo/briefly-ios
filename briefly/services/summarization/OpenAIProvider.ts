/**
 * OpenAIProvider — OpenAI-specific summarization (SRP + OCP)
 *
 * Only knows how to resolve OpenAI credentials and model config.
 */

import Constants from 'expo-constants';
import { CloudLLMProvider, CloudLLMConfig } from './CloudLLMProvider';
import { OpenAIConfig } from '../../config/openai';

export class OpenAIProvider extends CloudLLMProvider {
  readonly name = 'OpenAI';

  constructor(private readonly apiKey: string) {
    super();
  }

  protected resolveConfig(): CloudLLMConfig {
    const expoConfig: any = Constants.expoConfig ?? {};
    const extra: any = expoConfig.extra ?? {};

    const model: string =
      extra.openaiModelId ??
      extra.OPENAI_MODEL_ID ??
      OpenAIConfig.model;

    return {
      endpoint: `${OpenAIConfig.apiBaseUrl}/chat/completions`,
      model,
      headers: { Authorization: `Bearer ${this.apiKey}` },
    };
  }
}
