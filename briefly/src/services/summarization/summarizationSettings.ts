import { CloudProvider } from '@/types';
import { useSettingsStore } from '@/context/useSettingsStore';
export interface SummarizationSettingsSnapshot {
  cloudProvider: CloudProvider;
  apiKeys: Record<CloudProvider, string>;
}
export interface SummarizationSettingsReader {
  getSnapshot(): SummarizationSettingsSnapshot;
}
export class StoreBackedSummarizationSettingsReader implements SummarizationSettingsReader {
  getSnapshot(): SummarizationSettingsSnapshot {
    const { cloudProvider, openrouterApiKey, openaiApiKey, geminiApiKey } =
      useSettingsStore.getState();
    return {
      cloudProvider,
      apiKeys: {
        openrouter: openrouterApiKey,
        openai: openaiApiKey,
        gemini: geminiApiKey,
      },
    };
  }
}
