import type { Recording } from '@/types';
import { hasMeaningfulTranscript } from '@/utils/recording/recordingValidation';
import { isRecordingProcessing } from '@/utils/recording/recordingContentEmoji';
/** First-pass processing failed before a usable transcript existed. */
export function isInitialProcessingFailure(recording: Recording): boolean {
  return recording.status === 'error' && !hasMeaningfulTranscript(recording.transcript);
}
/**
 * Block opening the recording detail until processing finishes or the entry is
 * openable (e.g. summarization failed but transcript exists).
 */
export function isRecordingEntryNavigationLocked(recording: Recording): boolean {
  return isRecordingProcessing(recording) || isInitialProcessingFailure(recording);
}
