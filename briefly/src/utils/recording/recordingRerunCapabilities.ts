import type { Recording } from '@/types';
import {
  executeManualRecordingRerun,
  executeSummarizationOnlyRerun,
} from '@/utils/recording/manualRecordingRerun';
import { hasMeaningfulTranscript } from '@/utils/recording/recordingValidation';
import {
  getRecordingAudioAvailability,
  type RecordingAudioAvailability,
} from '@/utils/recording/recordingPlayableAudio';

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

export type TranscriptScreenRerunResult = 'audio' | 'transcript' | 'none';

/**
 * Transcript preview rerun: audio re-transcription when on-disk audio exists,
 * otherwise summarization from the saved transcript.
 */
export function runTranscriptScreenRerun(
  recording: Recording,
  audio: RecordingAudioAvailability = getRecordingAudioAvailability(recording),
): TranscriptScreenRerunResult {
  if (audio.hasAudio) {
    executeManualRecordingRerun(recording.id, {
      preservePreviousResults: true,
      audio,
    });
    return 'audio';
  }

  if (canRerunSummaryFromTranscript(recording)) {
    executeSummarizationOnlyRerun(recording.id);
    return 'transcript';
  }

  return 'none';
}
