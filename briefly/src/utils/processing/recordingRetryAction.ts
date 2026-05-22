import type { ProcessingMode, Recording } from '@/types';
import { getNextSummarizationFallback } from '@/utils/processing/summarizationFallback';
import {
  hasMeaningfulTranscript,
  hasRecordingAudio,
} from '@/utils/recording/recordingValidation';

export type RecordingRetryKind =
  | 'transcription'
  | 'summarization'
  | 'summarization-fallback'
  | 'full';

export type RecordingRetryAction = {
  icon: 'mic-outline' | 'sparkles' | 'refresh-outline';
  accessibilityLabel: string;
  kind: RecordingRetryKind;
  summarizationMode?: ProcessingMode;
};

export type ResolveRecordingRetryOptions = {
  /** List rows: retry only when transcription failed; open when a transcript exists. */
  forListAvatar?: boolean;
};

/** Primary retry affordance for a failed or stuck recording. */
export function resolveRecordingRetryAction(
  recording: Recording,
  defaultSummarizationMode: ProcessingMode,
  options?: ResolveRecordingRetryOptions,
): RecordingRetryAction | null {
  if (recording.status !== 'error') return null;

  const hasAudio = hasRecordingAudio(recording.filePath, recording.fileSize);
  const hasTranscript = hasMeaningfulTranscript(recording.transcript);

  if (options?.forListAvatar && hasTranscript) return null;
  const lastSummarizationMode = recording.processingMode ?? defaultSummarizationMode;
  const summarizationFallback = hasTranscript
    ? getNextSummarizationFallback(lastSummarizationMode, [lastSummarizationMode])
    : null;

  if (summarizationFallback) {
    return {
      icon: 'sparkles',
      accessibilityLabel: summarizationFallback.buttonLabel,
      kind: 'summarization-fallback',
      summarizationMode: summarizationFallback.mode,
    };
  }

  if (hasAudio && (!hasTranscript || !summarizationFallback)) {
    return {
      icon: 'mic-outline',
      accessibilityLabel: 'Retry transcription',
      kind: 'transcription',
    };
  }

  if (hasTranscript) {
    return {
      icon: 'sparkles',
      accessibilityLabel: 'Retry summarization',
      kind: 'summarization',
      summarizationMode: lastSummarizationMode,
    };
  }

  if (hasAudio) {
    return {
      icon: 'refresh-outline',
      accessibilityLabel: 'Retry processing',
      kind: 'full',
    };
  }

  return null;
}
