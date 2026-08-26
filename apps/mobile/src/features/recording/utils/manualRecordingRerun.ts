import type { Recording } from '@briefly/types';
import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import { getProcessingSettingsReader } from '@/features/settings/services/processingSettingsReaderRegistry';
import {
  cancelRecordingBackgroundProcessing,
  startRecordingBackgroundProcessing,
  startRecordingSummarizationRetry,
} from '@/features/recording/services/recordingBackgroundProcessing';
import { hasMeaningfulTranscript } from '@/features/recording/utils/recordingValidation';
import {
  getRecordingAudioAvailability,
  type RecordingAudioAvailability,
} from '@/features/recording/utils/recordingPlayableAudio';
import {
  resolveManualRerunSourceFromFlags,
  type ManualRerunSource,
} from '@/features/recording/utils/manualRecordingRerunSource';
export type { ManualRerunSource } from '@/features/recording/utils/manualRecordingRerunSource';
export { resolveManualRerunSourceFromFlags } from '@/features/recording/utils/manualRecordingRerunSource';
/** Chooses audio file processing (post/local) or transcript-only summarization. */
export function resolveManualRerunSource(recording: Recording): ManualRerunSource {
  return resolveManualRerunSourceFromFlags(
    getRecordingAudioAvailability(recording).hasAudio,
    hasMeaningfulTranscript(recording.transcript),
  );
}
export type ExecuteManualRerunOptions = {
  /** Keep transcript/summary visible while reprocessing (e.g. transcript screen). */
  preservePreviousResults?: boolean;
  /** Override summarization mode; defaults to current settings. */
  summarizationMode?: import('@briefly/types').ProcessingMode;
  /** Pre-resolved on-disk audio (e.g. from useRecordingAudioAvailability). */
  audio?: RecordingAudioAvailability;
};
/**
 * Manual rerun on an existing entry: process from on-disk audio when available,
 * otherwise summarize from the saved transcript using current settings.
 */
export function executeManualRecordingRerun(
  recordingId: string,
  options?: ExecuteManualRerunOptions,
): ManualRerunSource {
  const rec = useRecordingStore.getState().getRecordingById(recordingId);
  if (!rec) return 'none';
  const audio = options?.audio ?? getRecordingAudioAvailability(rec);
  const source = resolveManualRerunSourceFromFlags(
    audio.hasAudio,
    hasMeaningfulTranscript(rec.transcript),
  );
  if (source === 'none') return 'none';
  const mode = options?.summarizationMode ?? getProcessingSettingsReader().getSummarizationMode();
  cancelRecordingBackgroundProcessing(recordingId);
  if (source === 'audio') {
    startRecordingBackgroundProcessing(recordingId, {
      audioFallbackOnly: true,
      preservePreviousResults: options?.preservePreviousResults ?? false,
    });
    return 'audio';
  }
  startRecordingSummarizationRetry(recordingId, mode);
  return 'transcript';
}
/** Re-summarize from the saved transcript using current provider settings. */
export function executeSummarizationOnlyRerun(
  recordingId: string,
  options?: Pick<ExecuteManualRerunOptions, 'summarizationMode'>,
): boolean {
  const rec = useRecordingStore.getState().getRecordingById(recordingId);
  if (!rec || !hasMeaningfulTranscript(rec.transcript)) return false;
  const mode = options?.summarizationMode ?? getProcessingSettingsReader().getSummarizationMode();
  cancelRecordingBackgroundProcessing(recordingId);
  startRecordingSummarizationRetry(recordingId, mode);
  return true;
}
