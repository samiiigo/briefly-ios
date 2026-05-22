import type { Recording } from '@/types';
import { hasMeaningfulTranscript } from '@/utils/recording/recordingValidation';
import { getRecordingAudioAvailability } from '@/utils/recording/recordingPlayableAudio';

/** Re-transcription requires the source audio file on device. */
export function canRerunTranscriptFromAudio(
  recording: Pick<Recording, 'id' | 'filePath' | 'fileSize'>,
): boolean {
  return getRecordingAudioAvailability(recording).hasAudio;
}

/** Summarization can run from a saved transcript when audio is missing. */
export function canRerunSummaryFromTranscript(
  recording: Pick<Recording, 'transcript'>,
): boolean {
  return hasMeaningfulTranscript(recording.transcript);
}
