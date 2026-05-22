import type { ProcessingMode, Recording } from '@/types';
import { getNextSummarizationFallback } from '@/utils/processing/summarizationFallback';
import {
  resolveRecordingAudioOnDiskCore,
  type RecordingAudioPathProbe,
} from '@/utils/fileSystem/recordingAudioResolveCore';
import { hasMeaningfulTranscript } from '@/utils/recording/recordingValidation';

let recordingAudioProbeOverride: RecordingAudioPathProbe | null = null;

/** @internal Test-only hook for filesystem probes without loading Expo. */
export function __setRecordingAudioProbeForTests(
  probe: RecordingAudioPathProbe | null,
): void {
  recordingAudioProbeOverride = probe;
}

function hasAudioOnDevice(recording: Recording): boolean {
  if (recordingAudioProbeOverride) {
    return resolveRecordingAudioOnDiskCore(recording, recordingAudioProbeOverride) != null;
  }

  // Lazy import keeps node unit tests free of expo-file-system / react-native.
  const { resolveRecordingAudioOnDisk } =
    require('@/utils/fileSystem/persistRecordingAudio') as typeof import('@/utils/fileSystem/persistRecordingAudio');
  return resolveRecordingAudioOnDisk(recording) != null;
}

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

  const hasAudio = hasAudioOnDevice(recording);
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
      summarizationMode: defaultSummarizationMode,
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
