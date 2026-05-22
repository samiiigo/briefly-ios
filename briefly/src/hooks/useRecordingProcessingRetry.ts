import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Recording } from '@/types';
import { useSettingsStore } from '@/context/useSettingsStore';
import { useRecordingRetryFlashStore } from '@/context/useRecordingRetryFlashStore';
import { alertIfLocalLlmNotReady } from '@/utils/processing/localLlmSummarizationGate';
import {
  resolveRecordingRetryAction,
  type RecordingRetryAction,
  type ResolveRecordingRetryOptions,
} from '@/utils/processing/recordingRetryAction';
import { executeManualRecordingRerun, executeSummarizationOnlyRerun } from '@/utils/recording/manualRecordingRerun';
import { isRecordingProcessing } from '@/utils/recording/recordingContentEmoji';
import { hasMeaningfulTranscript } from '@/utils/recording/recordingValidation';

export function useRecordingProcessingRetry(
  recording: Recording | undefined,
  options?: ResolveRecordingRetryOptions,
): {
  action: RecordingRetryAction | null;
  runRetry: () => void;
  isRetrying: boolean;
  /** List/detail: show emoji so the row stays openable after transcription. */
  showOpenableContent: boolean;
} {
  const summarizationMode = useSettingsStore((s) => s.summarizationMode);
  const markRetryPending = useRecordingRetryFlashStore((s) => s.markRetryPending);
  const clearRetryPending = useRecordingRetryFlashStore((s) => s.clearRetryPending);
  const triggerRetryFlash = useRecordingRetryFlashStore((s) => s.triggerRetryFlash);

  const action = useMemo(
    () =>
      recording
        ? resolveRecordingRetryAction(recording, summarizationMode, options)
        : null,
    [recording, summarizationMode, options?.forListAvatar],
  );

  const isRetrying = recording ? isRecordingProcessing(recording) : false;
  const showOpenableContent =
    recording != null && hasMeaningfulTranscript(recording.transcript);

  const prevStatusRef = useRef(recording?.status);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!recording) return;
    pendingRef.current = !!useRecordingRetryFlashStore.getState().pendingRetryIds[recording.id];
  }, [recording?.id]);

  useEffect(() => {
    if (!recording) return;

    const prev = prevStatusRef.current;
    const next = recording.status;
    prevStatusRef.current = next;

    const wasPending = pendingRef.current;
    if (!wasPending) return;

    const leftProcessing =
      (prev === 'transcribing' || prev === 'summarizing') && next === 'error';
    if (leftProcessing && wasPending) {
      triggerRetryFlash(recording.id);
      pendingRef.current = false;
      return;
    }

    if (next === 'ready') {
      clearRetryPending(recording.id);
      pendingRef.current = false;
    }
  }, [recording, recording?.status, clearRetryPending, triggerRetryFlash]);

  const runRetry = useCallback(() => {
    if (!recording || !action || isRetrying) return;
    const flashActive = (() => {
      const until = useRecordingRetryFlashStore.getState().flashUntilById[recording.id];
      return until != null && Date.now() < until;
    })();
    if (flashActive) return;

    markRetryPending(recording.id);
    pendingRef.current = true;

    if (
      action.kind === 'transcription' ||
      action.kind === 'full'
    ) {
      if (!alertIfLocalLlmNotReady(summarizationMode)) {
        clearRetryPending(recording.id);
        pendingRef.current = false;
        return;
      }
      const source = executeManualRecordingRerun(recording.id);
      if (source === 'none') {
        clearRetryPending(recording.id);
        pendingRef.current = false;
      }
      return;
    }

    const mode = action.summarizationMode ?? summarizationMode;
    if (!alertIfLocalLlmNotReady(mode)) {
      clearRetryPending(recording.id);
      pendingRef.current = false;
      return;
    }
    if (!hasMeaningfulTranscript(recording.transcript)) {
      clearRetryPending(recording.id);
      pendingRef.current = false;
      return;
    }
    executeSummarizationOnlyRerun(recording.id, { summarizationMode: mode });
  }, [
    action,
    clearRetryPending,
    isRetrying,
    markRetryPending,
    recording,
    summarizationMode,
  ]);

  return { action, runRetry, isRetrying, showOpenableContent };
}
