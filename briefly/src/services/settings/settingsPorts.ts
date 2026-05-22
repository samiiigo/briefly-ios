import { ProcessingMode, TranscriptionMode, CloudProvider } from '@/types';
import type { ThemePreference } from '@/utils/theme/themePreference';
/** Modes used by recording pipeline and import. */
export interface ProcessingSettingsReader {
  getSummarizationMode(): ProcessingMode;
  getTranscriptionMode(): TranscriptionMode;
  getShowLivePreview(): boolean;
}
export interface SummarizationSettingsSnapshot {
  cloudProvider: CloudProvider;
  apiKeys: Record<CloudProvider, string>;
}
/** Cloud API keys for summarization providers. */
export interface SummarizationSettingsReader {
  getSnapshot(): SummarizationSettingsSnapshot;
}
/** Theme preference for UI layer. */
export interface ThemeSettingsReader {
  getThemePreference(): ThemePreference;
}
