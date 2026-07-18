import type { Recording } from '@briefly/types';
import { hasMeaningfulTranscript } from '@/features/recording/utils/recordingValidation';
export type InterruptedProcessingResumeAction = 'full' | 'summarize-only' | 'skip';
/** Whether a persisted status should be picked up again after app restart. */
export function resolveInterruptedProcessingResume(
  recording: Pick<Recording, 'status' | 'transcript' | 'folder' | 'deletedAt'>,
): InterruptedProcessingResumeAction {
  if (recording.deletedAt || recording.folder === 'recently-deleted') {
    return 'skip';
  }
  if (recording.status === 'summarizing' && hasMeaningfulTranscript(recording.transcript)) {
    return 'summarize-only';
  }
  if (recording.status === 'transcribing' || recording.status === 'summarizing') {
    return 'full';
  }
  return 'skip';
}
