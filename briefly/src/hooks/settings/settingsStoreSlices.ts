import { useSettingsStore } from '@/context/useSettingsStore';
import type { CloudProvider, ProcessingMode, TranscriptionMode } from '@/types';
import type { ThemePreference } from '@/utils/theme/themePreference';
export function useProcessingSettingsSlice() {
  const summarizationMode = useSettingsStore((s) => s.summarizationMode);
  const transcriptionMode = useSettingsStore((s) => s.transcriptionMode);
  const showLivePreview = useSettingsStore((s) => s.showLivePreview);
  const setShowLivePreview = useSettingsStore((s) => s.setShowLivePreview);
  const themePreference = useSettingsStore((s) => s.themePreference);
  return {
    summarizationMode,
    transcriptionMode,
    showLivePreview,
    setShowLivePreview,
    themePreference,
  };
}
export function useSummarizationModeSlice() {
  const summarizationMode = useSettingsStore((s) => s.summarizationMode);
  const setSummarizationMode = useSettingsStore((s) => s.setSummarizationMode);
  return { summarizationMode, setSummarizationMode };
}
export function useCloudApiKeySettingsSlice() {
  const cloudProvider = useSettingsStore((s) => s.cloudProvider);
  const setCloudProvider = useSettingsStore((s) => s.setCloudProvider);
  const setProviderApiKey = useSettingsStore((s) => s.setProviderApiKey);
  const getActiveApiKey = useSettingsStore((s) => s.getActiveApiKey);
  return { cloudProvider, setCloudProvider, setProviderApiKey, getActiveApiKey };
}
export function useLocalLlmSettingsSlice() {
  const localLlmModelReady = useSettingsStore((s) => s.localLlmModelReady);
  const localLlmDownloadProgress = useSettingsStore((s) => s.localLlmDownloadProgress);
  const localLlmDownloadStatus = useSettingsStore((s) => s.localLlmDownloadStatus);
  const localLlmDownloadError = useSettingsStore((s) => s.localLlmDownloadError);
  const deleteLocalLlmModel = useSettingsStore((s) => s.deleteLocalLlmModel);
  return {
    localLlmModelReady,
    localLlmDownloadProgress,
    localLlmDownloadStatus,
    localLlmDownloadError,
    deleteLocalLlmModel,
  };
}
export function useTranscriptionModeSlice() {
  const transcriptionMode = useSettingsStore((s) => s.transcriptionMode);
  const setTranscriptionMode = useSettingsStore((s) => s.setTranscriptionMode);
  return { transcriptionMode, setTranscriptionMode };
}
export function useThemePreferenceSlice() {
  const themePreference = useSettingsStore((s) => s.themePreference);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);
  return { themePreference, setThemePreference };
}
export type { ProcessingMode, TranscriptionMode, CloudProvider, ThemePreference };
