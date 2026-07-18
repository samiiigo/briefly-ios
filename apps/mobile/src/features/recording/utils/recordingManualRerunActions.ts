import { getProcessingSettingsReader } from '@/features/settings/services/processingSettingsReaderRegistry';
import { useRecordingRetryFlashStore } from '@/features/recording/state/useRecordingRetryFlashStore';
import { alertIfLocalLlmNotReady } from '@/features/processing/utils/localLlmSummarizationGate';
import {
  executeManualRecordingRerun,
  executeSummarizationOnlyRerun,
} from '@/features/recording/utils/manualRecordingRerun';
import {
  runTranscriptScreenRerunFromAudio,
  type TranscriptScreenRerunFromAudioResult,
} from '@/features/recording/utils/recordingRerunCapabilities';
import type { RecordingAudioAvailability } from '@/features/recording/utils/recordingPlayableAudio';
import type { Recording } from '@/shared/types';
export function markRecordingRerunPending(recordingId: string): void {
  useRecordingRetryFlashStore.getState().markRetryPending(recordingId);
}
/** Returns false when on-device LLM is not ready (alert already shown). */
export function runRecordingRerunIfLlmReady(run: () => void): boolean {
  const mode = getProcessingSettingsReader().getSummarizationMode();
  if (!alertIfLocalLlmNotReady(mode)) return false;
  run();
  return true;
}
export function dispatchSummarizationOnlyRerun(recordingId: string): void {
  executeSummarizationOnlyRerun(recordingId);
}
export function dispatchManualRecordingRerun(
  recordingId: string,
  audio: RecordingAudioAvailability,
): void {
  executeManualRecordingRerun(recordingId, { audio });
}
export function dispatchTranscriptScreenAudioRerun(
  recording: Recording,
  audio: RecordingAudioAvailability,
): TranscriptScreenRerunFromAudioResult {
  return runTranscriptScreenRerunFromAudio(recording, audio);
}
