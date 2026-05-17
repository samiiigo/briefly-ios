import { TranscriptSegment, TranscriptionMode } from '@/types';
import { hasMeaningfulTranscript } from '@/utils/recordingValidation';

export type LiveTranscriptionEngine = 'cloud' | 'on-device' | 'none';

export interface RecordingTranscriptionPlan {
  settingsMode: TranscriptionMode;
  useLiveCapture: boolean;
  liveEngine: LiveTranscriptionEngine;
}

export function normalizeTranscriptionMode(mode: string | undefined | null): TranscriptionMode {
  if (mode === 'live-assemblyai' || mode === 'post-assemblyai' || mode === 'local-on-device') {
    return mode;
  }
  // Legacy values from older builds.
  if (mode === 'on-device') return 'live-assemblyai';
  if (mode === 'cloud') return 'post-assemblyai';
  if (mode === 'on-device-first') return 'local-on-device';
  return 'live-assemblyai';
}

export function transcriptionModeTitle(mode: TranscriptionMode | string): string {
  const normalized = normalizeTranscriptionMode(mode);
  if (normalized === 'live-assemblyai') return 'Live';
  if (normalized === 'post-assemblyai') return 'After recording';
  return 'Private';
}

export function transcriptionModeDescription(mode: TranscriptionMode | string): string {
  const normalized = normalizeTranscriptionMode(mode);
  if (normalized === 'live-assemblyai') {
    return 'Updates the transcript in real time while you record.';
  }
  if (normalized === 'post-assemblyai') {
    return 'Transcribes the full recording after you stop.';
  }
  return 'Transcribes on your device. Audio does not leave your phone.';
}

/**
 * Maps the global Settings transcription mode to one that can run against a
 * saved audio file. Live capture uses post-recording AssemblyAI only when the
 * live stream did not produce a transcript.
 */
export function resolveAsyncTranscriptionMode(mode: TranscriptionMode | string): TranscriptionMode {
  const normalized = normalizeTranscriptionMode(mode);
  if (normalized === 'live-assemblyai') return 'post-assemblyai';
  return normalized;
}

export interface PostRecordingPipeline {
  /** When true, use the live transcript and skip file upload / async transcription. */
  skipAsyncTranscription: boolean;
  /** Mode for TranscriptionService when async file transcription is required. */
  asyncTranscriptionMode: TranscriptionMode;
}

export function hasUsableTranscript(transcript?: TranscriptSegment[] | null): boolean {
  return hasMeaningfulTranscript(transcript);
}

/**
 * Handoff from recording stop → summarization based on Settings transcription mode.
 */
export function resolvePostRecordingPipeline(
  settingsMode: TranscriptionMode | string,
  existingTranscript?: TranscriptSegment[] | null,
): PostRecordingPipeline {
  const mode = normalizeTranscriptionMode(settingsMode);
  const hasTranscript = hasUsableTranscript(existingTranscript);

  if (mode === 'post-assemblyai') {
    return {
      skipAsyncTranscription: false,
      asyncTranscriptionMode: 'post-assemblyai',
    };
  }

  if (mode === 'local-on-device') {
    return {
      skipAsyncTranscription: hasTranscript,
      asyncTranscriptionMode: 'local-on-device',
    };
  }

  return {
    skipAsyncTranscription: hasTranscript,
    asyncTranscriptionMode: 'post-assemblyai',
  };
}

/**
 * Derives capture behavior from global Settings only. Local (on-device) is always
 * treated as a live stream when native speech is available.
 */
export function resolveRecordingTranscriptionPlan(
  settingsMode: TranscriptionMode | string,
  capabilities: { canCloudLive: boolean; canOnDeviceLive: boolean },
): RecordingTranscriptionPlan {
  const mode = normalizeTranscriptionMode(settingsMode);

  if (mode === 'local-on-device') {
    return {
      settingsMode: mode,
      useLiveCapture: capabilities.canOnDeviceLive,
      liveEngine: capabilities.canOnDeviceLive ? 'on-device' : 'none',
    };
  }

  if (mode === 'live-assemblyai') {
    return {
      settingsMode: mode,
      useLiveCapture: capabilities.canCloudLive,
      liveEngine: capabilities.canCloudLive ? 'cloud' : 'none',
    };
  }

  return {
    settingsMode: mode,
    useLiveCapture: false,
    liveEngine: 'none',
  };
}

export function showsLivePreviewDuringRecording(plan: RecordingTranscriptionPlan): boolean {
  return plan.settingsMode !== 'post-assemblyai';
}

export function requiresLiveOnDeviceCapture(plan: RecordingTranscriptionPlan): boolean {
  return plan.settingsMode === 'local-on-device';
}
