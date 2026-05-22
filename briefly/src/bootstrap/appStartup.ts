import { useSettingsStore } from '@/context/useSettingsStore';
import { resumeInterruptedRecordingProcessing } from '@/services/recording/recordingBackgroundProcessing';
import { refreshLocalLlmModelStateFromDisk } from '@/services/summarization';
import { checkEnvironment } from '@/utils/environment/environmentCheck';
import { installRealtimeTerminalLogs, logger } from '@/utils/logging/logger';
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
  installRealtimeTerminalLogs();
}
export function subscribeSettingsHydration(onHydrated: () => void): () => void {
  if (useSettingsStore.persist.hasHydrated()) {
    onHydrated();
    return () => {};
  }
  return useSettingsStore.persist.onFinishHydration(onHydrated);
}
