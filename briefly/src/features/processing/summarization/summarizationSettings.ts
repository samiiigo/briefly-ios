/**
 * Summarization settings ports for the processing feature.
 * Store-backed implementations live in settings; this module re-exports them
 * so summarization code depends on ports rather than Zustand directly.
 */
export type {
  SummarizationSettingsReader,
  SummarizationSettingsSnapshot,
} from '@/features/settings/services/settingsPorts';
export { StoreBackedSummarizationSettingsReader } from '@/features/settings/services/settingsStoreReaders';
