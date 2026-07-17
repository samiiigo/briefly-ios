import { useSettingsStore } from '@/features/settings/state/useSettingsStore';
import { resumeInterruptedRecordingProcessing } from '@/features/recording/services/recordingBackgroundProcessing';
import { refreshLocalLlmModelStateFromDisk } from '@/features/processing/summarization';
import { checkEnvironment } from '@/shared/utils/environment/environmentCheck';
import { installRealtimeTerminalLogs, logger } from '@/shared/utils/logging/logger';
export async function loadRecordingsOnStartup(
  loadRecordings: () => Promise<void>,
): Promise<void> {
  logger.info('SYSTEM', 'App startup: loading recordings from storage');
  await loadRecordings();
}
export function runAfterSettingsHydrated(): void {
  refreshLocalLlmModelStateFromDisk();
  const env = checkEnvironment();
  logger.info('SYSTEM', 'Environment check', {
    hasNative: env.hasNativeModule,
    hasOnDeviceSpeech: env.hasOnDeviceSpeech,
    hasKey: env.hasAssemblyAIKey,
    canLive: env.canLiveTranscribe,
    canRecord: env.canRecord,
    recommended: env.recommendedTranscriptionMode,
  });
  useSettingsStore.getState().applyEnvironmentDefaults(env.recommendedTranscriptionMode);
  resumeInterruptedRecordingProcessing();
}
export function installStartupLogging(): void {
  if (__DEV__) {
    installRealtimeTerminalLogs();
  }
}
export function subscribeSettingsHydration(onHydrated: () => void): () => void {
  if (useSettingsStore.persist.hasHydrated()) {
    onHydrated();
    return () => {};
  }
  return useSettingsStore.persist.onFinishHydration(onHydrated);
}
