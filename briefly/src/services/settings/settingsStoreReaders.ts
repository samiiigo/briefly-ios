import { useSettingsStore } from '@/context/useSettingsStore';
import type {
  ProcessingSettingsReader,
  SummarizationSettingsReader,
  SummarizationSettingsSnapshot,
  ThemeSettingsReader,
} from './settingsPorts';
export class StoreBackedProcessingSettingsReader implements ProcessingSettingsReader {
  getSummarizationMode() {
    return useSettingsStore.getState().summarizationMode;
  }
  getTranscriptionMode() {
    return useSettingsStore.getState().transcriptionMode;
  }
  getShowLivePreview() {
    return useSettingsStore.getState().showLivePreview;
  }
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
export class StoreBackedThemeSettingsReader implements ThemeSettingsReader {
  getThemePreference() {
    return useSettingsStore.getState().themePreference;
  }
}
