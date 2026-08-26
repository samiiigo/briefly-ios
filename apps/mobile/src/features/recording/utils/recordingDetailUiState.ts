import type { Recording } from '@briefly/types';
import { isAudioFileMissingError } from '@/features/processing/utils/processingErrors';
import { isRecordingProcessing } from '@/features/recording/utils/recordingContentEmoji';
import type { RecordingAudioAvailability } from '@/features/recording/utils/recordingPlayableAudio';
import { resolveManualRerunSourceFromFlags } from '@/features/recording/utils/manualRecordingRerunSource';
import { hasMeaningfulTranscript } from '@/features/recording/utils/recordingValidation';
export interface RecordingDetailUiState {
  isProcessing: boolean;
  hasTranscript: boolean;
  hasAudio: boolean;
  canRerunSummary: boolean;
  manualRerunSource: ReturnType<typeof resolveManualRerunSourceFromFlags>;
  canManualRerun: boolean;
  summaryRerunDisabled: boolean;
  manualRerunDisabled: boolean;
  isSummarizing: boolean;
  showProcessingBanner: boolean;
  hideAudioMissingBanner: boolean;
}
export function deriveRecordingDetailUiState(
  recording: Recording | undefined,
  audioAvailability: RecordingAudioAvailability,
): RecordingDetailUiState {
  const hasTranscript = hasMeaningfulTranscript(recording?.transcript);
  const hasAudio = audioAvailability.hasAudio;
  const isProcessing = recording != null && isRecordingProcessing(recording);
  const canRerunSummary = recording != null && hasMeaningfulTranscript(recording.transcript);
  const manualRerunSource = resolveManualRerunSourceFromFlags(hasAudio, hasTranscript);
  const canManualRerun = manualRerunSource !== 'none';
  const summaryRerunDisabled = !recording || isProcessing || !canRerunSummary;
  const manualRerunDisabled = !recording || isProcessing || !canManualRerun;
  const isSummarizing = recording?.status === 'summarizing';
  const showProcessingBanner =
    recording != null &&
    (recording.status === 'saved' || (isSummarizing && !hasTranscript)) &&
    (hasAudio || (recording.status === 'saved' && hasTranscript));
  const hideAudioMissingBanner =
    recording?.status === 'error' && isAudioFileMissingError(recording.errorMessage ?? '');
  return {
    isProcessing,
    hasTranscript,
    hasAudio,
    canRerunSummary,
    manualRerunSource,
    canManualRerun,
    summaryRerunDisabled,
    manualRerunDisabled,
    isSummarizing,
    showProcessingBanner,
    hideAudioMissingBanner,
  };
}
