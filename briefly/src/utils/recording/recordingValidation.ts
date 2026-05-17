import { TranscriptSegment } from '@/types';

/** Minimum captured duration (seconds) before save / cloud transcription. */
export const MIN_RECORDING_DURATION_SEC = 10;

/** Below this duration, Stop asks for confirmation and will not be saved. */
export const STOP_EARLY_CONFIRM_THRESHOLD_SEC = 5;

/** WAV header size (44 bytes) — keep in sync with recordingOptions.WAV_HEADER_BYTES. */
const WAV_HEADER_BYTES = 44;

/** ~0.25 s of 16 kHz mono PCM — matches TranscriptionService threshold. */
export const MIN_RECORDING_FILE_BYTES = WAV_HEADER_BYTES + 8000;

export interface RecordingAssetCheck {
  durationSec: number;
  filePath: string;
  fileSizeBytes: number;
}

export function transcriptTextContent(transcript?: TranscriptSegment[] | null): string {
  if (!transcript?.length) return '';
  return transcript
    .map((s) => s.text?.trim() ?? '')
    .filter(Boolean)
    .join(' ')
    .trim();
}

export function hasMeaningfulTranscript(transcript?: TranscriptSegment[] | null): boolean {
  return transcriptTextContent(transcript).length > 0;
}

export function isRecordingTooShort(check: RecordingAssetCheck): boolean {
  return (
    check.durationSec < MIN_RECORDING_DURATION_SEC ||
    check.fileSizeBytes < MIN_RECORDING_FILE_BYTES
  );
}

export function isRecordingFileMissing(check: RecordingAssetCheck): boolean {
  return !check.filePath?.trim();
}

export function validateRecordingAsset(check: RecordingAssetCheck): void {
  if (isRecordingFileMissing(check)) {
    throw new Error('No audio file was saved for this recording. Please record again.');
  }
  if (isRecordingTooShort(check)) {
    throw new Error(
      `Recording is too short. Record for at least ${MIN_RECORDING_DURATION_SEC} seconds and try again.`,
    );
  }
}

export function minRecordingDurationHint(action: 'save' | 'stop' = 'save'): string {
  const verb = action === 'stop' ? 'stopping' : 'saving';
  return `Record for at least ${MIN_RECORDING_DURATION_SEC} seconds before ${verb}.`;
}
