import type { Recording } from '@/types';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import {
  cancelRecordingBackgroundProcessing,
  startRecordingBackgroundProcessing,
  startRecordingSummarizationRetry,
} from '@/services/recording/recordingBackgroundProcessing';
import { hasMeaningfulTranscript } from '@/utils/recording/recordingValidation';
import {
  getRecordingAudioAvailability,
  type RecordingAudioAvailability,
} from '@/utils/recording/recordingPlayableAudio';
import {
  resolveManualRerunSourceFromFlags,
  type ManualRerunSource,
} from '@/utils/recording/manualRecordingRerunSource';

export type { ManualRerunSource } from '@/utils/recording/manualRecordingRerunSource';
export { resolveManualRerunSourceFromFlags } from '@/utils/recording/manualRecordingRerunSource';

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
  summarizationMode?: import('@/types').ProcessingMode;
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

  const mode =
    options?.summarizationMode ?? useSettingsStore.getState().summarizationMode;

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

  const mode =
    options?.summarizationMode ?? useSettingsStore.getState().summarizationMode;

  cancelRecordingBackgroundProcessing(recordingId);
  startRecordingSummarizationRetry(recordingId, mode);
  return true;
}
