/**

 * OpenRouterProvider — OpenRouter-specific summarization (SRP + OCP)

 *

 * Only knows how to resolve OpenRouter credentials and headers.

 * All HTTP/parsing logic is inherited from CloudLLMProvider.

 *

 * OpenAI models are accessed via OpenRouter using the `openai/<model>` slug.

 */



import Constants from 'expo-constants';

import { CloudLLMProvider, CloudLLMConfig } from './cloudLLMProvider';

import { OpenAIConfig } from '@/constants/api/openai';

import { OpenRouterConfig } from '@/constants/api/openRouter';
import { toOpenRouterOpenAIModelId } from '@/constants/api/openRouterModel';



export type OpenRouterModelSource = 'openrouter' | 'openai';



function readExpoExtra(): Record<string, unknown> {

  return (Constants.expoConfig?.extra as Record<string, unknown> | undefined) ?? {};

}



export function resolveOpenRouterChatConfig(

  apiKey: string,

  modelSource: OpenRouterModelSource = 'openrouter',

): CloudLLMConfig {

  const extra = readExpoExtra();
  const appName =
    typeof Constants.expoConfig?.name === 'string' ? Constants.expoConfig.name : undefined;



  const model =

    modelSource === 'openai'

      ? toOpenRouterOpenAIModelId(

          (extra.openaiModelId as string | undefined) ??

            (extra.OPENAI_MODEL_ID as string | undefined) ??

            OpenAIConfig.model,

        )

      : ((extra.openRouterModelId as string | undefined) ??

          (extra.OPENROUTER_MODEL_ID as string | undefined) ??

          OpenRouterConfig.model);



  const headers: Record<string, string> = {

    Authorization: `Bearer ${apiKey}`,

  };



  const referer =

    (extra.openRouterReferer as string | undefined) ??

    (extra.OPENROUTER_REFERER as string | undefined);

  if (referer?.trim()) {

    headers['HTTP-Referer'] = referer.trim();

  }



  const title =

    (extra.openRouterTitle as string | undefined) ??

    (extra.OPENROUTER_TITLE as string | undefined) ??
    appName ??
    'Briefly';

  headers['X-OpenRouter-Title'] = title;



  return {

    endpoint: `${OpenRouterConfig.apiBaseUrl}/chat/completions`,

    model,

    headers,

  };

}



export class OpenRouterProvider extends CloudLLMProvider {

  readonly name: string;



  constructor(

    private readonly apiKey: string,

    private readonly modelSource: OpenRouterModelSource = 'openrouter',

  ) {

    super();

    this.name = modelSource === 'openai' ? 'OpenAI (OpenRouter)' : 'OpenRouter';

  }



  protected resolveConfig(): CloudLLMConfig {

    return resolveOpenRouterChatConfig(this.apiKey, this.modelSource);

  }

}


