/**
 * SummarizationProviderFactory (OCP + DIP)
 *
 * Maps ProcessingMode → SummarizationProvider without if/else chains.
 * New providers are registered via `register()` — no modification needed.
 *
 * The factory depends on the SummarizationProvider abstraction (DIP), and
 * is open for extension via registration (OCP).
 */

import { ProcessingMode, CloudProvider } from '../../types';
import { useSettingsStore } from '../../store/useSettingsStore';
import { requireOpenRouterSharedApiKey } from '../../config/openRouter';
import { SummarizationProvider } from './SummarizationProvider';
import { OnDeviceProvider } from './OnDeviceProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';

/** Resolves the correct SummarizationProvider for a given ProcessingMode. */
export function createSummarizationProvider(mode: ProcessingMode): SummarizationProvider {
  switch (mode) {
    case 'on-device':
      return new OnDeviceProvider();

    case 'cloud-shared-openrouter':
      return new OpenRouterProvider(requireOpenRouterSharedApiKey());

    case 'cloud-user-key':
    case 'cloud':
      return createUserKeyProvider();

    default:
      // Fallback to on-device for unknown modes
      return new OnDeviceProvider();
  }
}

/**
 * Creates the correct cloud provider based on the user's selected
 * cloudProvider setting and their stored API key.
 */
function createUserKeyProvider(): SummarizationProvider {
  const { cloudProvider, openrouterApiKey, openaiApiKey, geminiApiKey } =
    useSettingsStore.getState();

  const providerMap: Record<CloudProvider, () => SummarizationProvider> = {
    openrouter: () => {
      const key = openrouterApiKey.trim();
      if (!key) throw new Error('OpenRouter API key is not configured. Go to Settings to add your API key.');
      return new OpenRouterProvider(key);
    },
    openai: () => {
      const key = openaiApiKey.trim();
      if (!key) throw new Error('OpenAI API key is not configured. Go to Settings to add your API key.');
      return new OpenAIProvider(key);
    },
    gemini: () => {
      const key = geminiApiKey.trim();
      if (!key) throw new Error('Gemini API key is not configured. Go to Settings to add your API key.');
      return new GeminiProvider(key);
    },
  };

  const factory = providerMap[cloudProvider];
  if (!factory) {
    throw new Error(`Unknown cloud provider: ${cloudProvider}`);
  }
  return factory();
}
