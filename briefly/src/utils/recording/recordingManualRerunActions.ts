import { getProcessingSettingsReader } from '@/services/settings/processingSettingsReaderRegistry';
import { useRecordingRetryFlashStore } from '@/context/useRecordingRetryFlashStore';
import { alertIfLocalLlmNotReady } from '@/utils/processing/localLlmSummarizationGate';
import {
  executeManualRecordingRerun,
  executeSummarizationOnlyRerun,
} from '@/utils/recording/manualRecordingRerun';
import {
  runTranscriptScreenRerunFromAudio,
  type TranscriptScreenRerunFromAudioResult,
} from '@/utils/recording/recordingRerunCapabilities';
import type { RecordingAudioAvailability } from '@/utils/recording/recordingPlayableAudio';
import type { Recording } from '@/types';
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
