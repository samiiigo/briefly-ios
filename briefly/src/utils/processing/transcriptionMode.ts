import { TranscriptSegment, TranscriptionMode } from '@/types';
import { hasMeaningfulTranscript } from '../recording/recordingValidation';
export type DecorativePreviewEngine = 'cloud' | 'on-device' | 'none';
export interface PostRecordingPipeline {
  /** When true, use the live transcript and skip file upload / async transcription. */
  skipAsyncTranscription: boolean;
  /** Mode for TranscriptionService when async file transcription is required. */
  asyncTranscriptionMode: TranscriptionMode;
}
export function normalizeTranscriptionMode(mode: string | undefined | null): TranscriptionMode {
  if (mode === 'cloud' || mode === 'local') {
    return mode;
  }
  // Legacy values from older builds.
  if (
    mode === 'live-assemblyai' ||
    mode === 'post-assemblyai' ||
    mode === 'cloud-user-key' ||
    mode === 'cloud-shared-openrouter'
  ) {
    return 'cloud';
  }
  if (mode === 'local-on-device' || mode === 'on-device-first' || mode === 'on-device') {
    return 'local';
  }
  return 'cloud';
}
export function transcriptionModeTitle(mode: TranscriptionMode | string): string {
  const normalized = normalizeTranscriptionMode(mode);
  return normalized === 'local' ? 'Local' : 'Cloud';
}
export function transcriptionModeDescription(mode: TranscriptionMode | string): string {
  const normalized = normalizeTranscriptionMode(mode);
  if (normalized === 'local') {
    return 'Processes your recording on-device after you stop when supported on this build.';
  }
  return 'Transcribes your recording in the cloud after you stop, then summarizes.';
}
/**
 * Post-recording transcription always runs from the saved audio file.
 * Live preview text is never used for processing.
 */
export function resolvePostRecordingPipeline(
  settingsMode: TranscriptionMode | string,
  _existingTranscript?: TranscriptSegment[] | null,
): PostRecordingPipeline {
  const mode = normalizeTranscriptionMode(settingsMode);
  return {
    skipAsyncTranscription: false,
    asyncTranscriptionMode: mode,
  };
}
export function hasUsableTranscript(transcript?: TranscriptSegment[] | null): boolean {
  return hasMeaningfulTranscript(transcript);
}
/**
 * Engine used only for optional decorative live preview while recording.
 * Does not affect save, transcription, or summarization pipelines.
 */
export function resolveDecorativePreviewEngine(
  settingsMode: TranscriptionMode | string,
  capabilities: { canCloudLive: boolean; canOnDeviceLive: boolean },
): DecorativePreviewEngine {
  const mode = normalizeTranscriptionMode(settingsMode);
  if (mode === 'local' && capabilities.canOnDeviceLive) {
    return 'on-device';
  }
  if (capabilities.canCloudLive) {
    return 'cloud';
  }
  return 'none';
}
export function canRunDecorativeLivePreview(
  showLivePreview: boolean,
  engine: DecorativePreviewEngine,
): boolean {
  return showLivePreview && engine !== 'none';
}
