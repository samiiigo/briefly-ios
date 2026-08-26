import { useCallback } from 'react';
import type { Recording } from '@briefly/types';
import { useRecordingRetryFlashActive } from '@/features/recording/hooks/useRecordingRetryFlashActive';
import { deriveRecordingDetailUiState } from '@/features/recording/utils/recordingDetailUiState';
import type { RecordingAudioAvailability } from '@/features/recording/utils/recordingPlayableAudio';
import {
  dispatchManualRecordingRerun,
  dispatchSummarizationOnlyRerun,
  dispatchTranscriptScreenAudioRerun,
  markRecordingRerunPending,
  runRecordingRerunIfLlmReady,
} from '@/features/recording/utils/recordingManualRerunActions';
export function useRecordingManualRerun(
  recording: Recording | undefined,
  audioAvailability: RecordingAudioAvailability,
) {
  const ui = deriveRecordingDetailUiState(recording, audioAvailability);
  const flashActive = useRecordingRetryFlashActive(recording?.id);
  const manualRerunButtonDisabled = ui.manualRerunDisabled || flashActive;
  const runSummarizationOnly = useCallback(() => {
    if (!recording || ui.summaryRerunDisabled) return;
    if (
      !runRecordingRerunIfLlmReady(() => {
        markRecordingRerunPending(recording.id);
        dispatchSummarizationOnlyRerun(recording.id);
      })
    ) {
      return;
    }
  }, [recording, ui.summaryRerunDisabled]);
  const runManualPipeline = useCallback(() => {
    if (!recording || manualRerunButtonDisabled) return;
    if (
      !runRecordingRerunIfLlmReady(() => {
        markRecordingRerunPending(recording.id);
        if (ui.manualRerunSource === 'audio') {
          dispatchManualRecordingRerun(recording.id, audioAvailability);
        } else {
          dispatchSummarizationOnlyRerun(recording.id);
        }
      })
    ) {
      return;
    }
  }, [audioAvailability, manualRerunButtonDisabled, recording, ui.manualRerunSource]);
  const runTranscriptAudioRerun = useCallback(() => {
    if (!recording || manualRerunButtonDisabled) return 'blocked' as const;
    let result: ReturnType<typeof dispatchTranscriptScreenAudioRerun> = 'none';
    if (
      !runRecordingRerunIfLlmReady(() => {
        markRecordingRerunPending(recording.id);
        result = dispatchTranscriptScreenAudioRerun(recording, audioAvailability);
      })
    ) {
      return 'blocked' as const;
    }
    return result;
  }, [audioAvailability, manualRerunButtonDisabled, recording]);
  return {
    ...ui,
    flashActive,
    manualRerunButtonDisabled,
    runSummarizationOnly,
    runManualPipeline,
    runTranscriptAudioRerun,
  };
}
