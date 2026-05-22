import type { Recording } from '@/types';
import { executeManualRecordingRerun } from '@/utils/recording/manualRecordingRerun';
import { hasMeaningfulTranscript } from '@/utils/recording/recordingValidation';
import {
  getRecordingAudioAvailability,
  type RecordingAudioAvailability,
} from '@/utils/recording/recordingPlayableAudio';

/** Re-transcription requires the source audio file on device. */
export function canRerunTranscriptFromAudio(
  recording: Pick<Recording, 'id' | 'filePath' | 'fileSize'>,
  audio: RecordingAudioAvailability = getRecordingAudioAvailability(recording),
): boolean {
  return audio.hasAudio;
}

/** Summarization can run from a saved transcript when audio is missing. */
export function canRerunSummaryFromTranscript(
  recording: Pick<Recording, 'transcript'>,
): boolean {
  return hasMeaningfulTranscript(recording.transcript);
}

/** VoiceOver / accessibility label for the transcript preview re-run control. */
export const TRANSCRIPT_SCREEN_RERUN_FROM_AUDIO_LABEL =
  'Re-run transcription and summarization from the audio';

export type TranscriptScreenRerunFromAudioResult = 'audio' | 'none';

/**
 * Transcript preview re-run: always re-transcribe and summarize from on-disk audio.
 * Returns `none` when no audio file is available (button should stay disabled).
 */
export function runTranscriptScreenRerunFromAudio(
  recording: Recording,
  audio: RecordingAudioAvailability = getRecordingAudioAvailability(recording),
): TranscriptScreenRerunFromAudioResult {
  if (!audio.hasAudio) return 'none';

  executeManualRecordingRerun(recording.id, {
    preservePreviousResults: true,
    audio,
  });
  return 'audio';
}
