import type { Recording } from '@briefly/types';
import { hasMeaningfulTranscript } from '@/features/recording/utils/recordingValidation';
import { isRecordingProcessing } from '@/features/recording/utils/recordingContentEmoji';
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
