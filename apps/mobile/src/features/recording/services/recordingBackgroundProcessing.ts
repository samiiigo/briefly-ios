import { ProcessingMode } from '@briefly/types';
import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import { getProcessingSettingsReader } from '@/features/settings/services/processingSettingsReaderRegistry';
import {
  processRecordingFromSavedAudio,
  processRecordingToReady,
  retrySummarization,
  RecordingProcessingResult,
} from '@/features/recording/services/recordingProcessingService';
import {
  normalizeTranscriptionMode,
  resolvePostRecordingPipeline,
} from '@/features/processing/utils/transcriptionMode';
import { toProcessingFailure } from '@/features/processing/utils/processingErrors';
import {
  hasMeaningfulTranscript,
  isRecordingFileMissing,
  isRecordingTooShort,
} from '@/features/recording/utils/recordingValidation';
import { logger } from '@/lib/utils/logging/logger';
import { buildRecordingReadyFromSummarization } from '@/features/recording/utils/recordingSummarization';
import { applyResolvedAudioToRecording } from '@/features/recording/utils/recordingPlayableAudio';
import { getLocalLlmSummarizationBlocker } from '@/features/processing/summarization';
import { resolveInterruptedProcessingResume } from '@/features/recording/utils/recordingProcessingResume';
const PROCESSING_TIMEOUT_MS = 12 * 60 * 1000;
type JobHandle = {
  cancelled: boolean;
  timeoutId: ReturnType<typeof setTimeout>;
};
const activeJobs = new Map<string, JobHandle>();
function clearJob(recordingId: string): void {
  const job = activeJobs.get(recordingId);
  if (!job) return;
  clearTimeout(job.timeoutId);
  activeJobs.delete(recordingId);
}
async function failJob(recordingId: string, err: unknown, stage: 'transcribing' | 'summarizing') {
  const { getRecordingById, updateRecording } = useRecordingStore.getState();
  const rec = getRecordingById(recordingId);
  const failure = toProcessingFailure(
    err,
    hasMeaningfulTranscript(rec?.transcript) && stage === 'summarizing'
      ? 'summarization'
      : 'transcription',
  );
  try {
    await updateRecording(recordingId, {
      status: 'error',
      errorMessage: failure.message,
    });
  } catch {
    // List UI still reflects error via in-memory store when update succeeds partially
  }
  logger.warn('RECORDING', 'Background processing failed', {
    recordingId,
    phase: failure.phase,
    message: failure.message,
  });
}
async function completeJob(
  recordingId: string,
  result: RecordingProcessingResult,
  processingModeUsed?: ProcessingMode,
) {
  const { updateRecording, recordings } = useRecordingStore.getState();
  const modeUsed = processingModeUsed ?? getProcessingSettingsReader().getSummarizationMode();
  const existingTitles = recordings.filter((r) => r.id !== recordingId).map((r) => r.title);
  await updateRecording(recordingId, {
    status: 'ready',
    transcript: result.segments,
    processingMode: modeUsed,
    errorMessage: undefined,
    ...buildRecordingReadyFromSummarization(result, { existingTitles }),
  });
  logger.info('RECORDING', 'Background processing completed', { recordingId });
}
type BackgroundJobOptions = {
  audioFallbackOnly: boolean;
  /** Keep transcript, summary, and insights visible until the job finishes. */
  preservePreviousResults?: boolean;
};
async function runJob(
  recordingId: string,
  options: BackgroundJobOptions,
  stageRef: { current: 'transcribing' | 'summarizing' },
): Promise<RecordingProcessingResult | undefined> {
  const { getRecordingById, updateRecording } = useRecordingStore.getState();
  const rec = getRecordingById(recordingId);
  if (!rec) {
    throw new Error('Recording not found.');
  }
  const recWithAudio = applyResolvedAudioToRecording(rec);
  const filePath = recWithAudio.filePath;
  const fileSize = recWithAudio.fileSize;
  const asset = {
    durationSec: rec.duration,
    filePath,
    fileSizeBytes: fileSize,
  };
  if (isRecordingFileMissing(asset)) {
    throw new Error('No audio file was saved for this recording.');
  }
  if (!options.audioFallbackOnly && isRecordingTooShort(asset)) {
    throw new Error('Recording is too short. Record for at least 10 seconds and try again.');
  }
  const settingsMode = normalizeTranscriptionMode(
    getProcessingSettingsReader().getTranscriptionMode(),
  );
  const pMode = getProcessingSettingsReader().getSummarizationMode();
  const existingTranscript = options.audioFallbackOnly ? undefined : rec.transcript;
  const meta = { durationSec: rec.duration, fileSizeBytes: fileSize };
  const callbacks = {
    onStage: (nextStage: 'transcribing' | 'summarizing') => {
      const job = activeJobs.get(recordingId);
      if (!job || job.cancelled) return;
      stageRef.current = nextStage;
    },
    onTranscriptReady: async (segments: NonNullable<typeof rec.transcript>) => {
      const job = activeJobs.get(recordingId);
      if (!job || job.cancelled) return;
      await updateRecording(
        recordingId,
        options.preservePreviousResults
          ? {
              status: 'summarizing',
              errorMessage: undefined,
              processingMode: pMode,
              transcriptionMode: settingsMode,
            }
          : {
              status: 'summarizing',
              transcript: segments,
              transcriptionMode: settingsMode,
              processingMode: pMode,
              errorMessage: undefined,
            },
      );
    },
  };
  if (options.audioFallbackOnly) {
    await updateRecording(recordingId, {
      status: 'transcribing',
      errorMessage: undefined,
      processingMode: pMode,
      transcriptionMode: settingsMode,
      ...(options.preservePreviousResults
        ? {}
        : {
            transcript: undefined,
            summary: undefined,
            keyInsights: undefined,
            mainEmoji: undefined,
          }),
    });
    return processRecordingFromSavedAudio(pMode, filePath, callbacks, meta);
  }
  const pipeline = resolvePostRecordingPipeline(settingsMode, existingTranscript);
  if (pipeline.skipAsyncTranscription) {
    await updateRecording(recordingId, {
      status: 'summarizing',
      errorMessage: undefined,
      processingMode: pMode,
      transcriptionMode: settingsMode,
      transcript: rec.transcript,
    });
    stageRef.current = 'summarizing';
  } else {
    await updateRecording(recordingId, {
      status: 'transcribing',
      errorMessage: undefined,
      processingMode: pMode,
      transcriptionMode: settingsMode,
    });
    stageRef.current = 'transcribing';
  }
  return processRecordingToReady(
    settingsMode,
    pMode,
    filePath,
    existingTranscript,
    callbacks,
    meta,
  );
}
/**
 * Runs transcription (and summarization) without blocking navigation.
 * Safe to call multiple times; only one job runs per recording id.
 */
async function abortBlockedOnDeviceProcessing(recordingId: string, message: string): Promise<void> {
  const { updateRecording } = useRecordingStore.getState();
  try {
    await updateRecording(recordingId, { status: 'saved', errorMessage: undefined });
  } catch {
    // Store may still reflect saved in memory
  }
  logger.warn('RECORDING', 'On-device summarization blocked; background job not started', {
    recordingId,
    message,
  });
}
export function startRecordingBackgroundProcessing(
  recordingId: string,
  options?: { audioFallbackOnly?: boolean; preservePreviousResults?: boolean },
): void {
  if (activeJobs.has(recordingId)) return;
  const pMode = getProcessingSettingsReader().getSummarizationMode();
  const blocker = getLocalLlmSummarizationBlocker(pMode);
  if (blocker) {
    void abortBlockedOnDeviceProcessing(recordingId, blocker);
    return;
  }
  const stageRef = { current: 'transcribing' as 'transcribing' | 'summarizing' };
  const audioFallbackOnly = options?.audioFallbackOnly ?? false;
  const preservePreviousResults = options?.preservePreviousResults ?? false;
  const timeoutId = setTimeout(() => {
    const job = activeJobs.get(recordingId);
    if (!job || job.cancelled) return;
    job.cancelled = true;
    clearJob(recordingId);
    void failJob(
      recordingId,
      new Error(
        'Processing is taking longer than expected. Check your connection and try again from the recording.',
      ),
      stageRef.current,
    );
  }, PROCESSING_TIMEOUT_MS);
  activeJobs.set(recordingId, { cancelled: false, timeoutId });
  void (async () => {
    try {
      const result = await runJob(
        recordingId,
        { audioFallbackOnly, preservePreviousResults },
        stageRef,
      );
      const job = activeJobs.get(recordingId);
      if (!job?.cancelled && result) {
        await completeJob(recordingId, result);
      }
    } catch (err: unknown) {
      const job = activeJobs.get(recordingId);
      if (!job?.cancelled) {
        await failJob(recordingId, err, stageRef.current);
      }
    } finally {
      clearJob(recordingId);
    }
  })();
}
export function cancelRecordingBackgroundProcessing(recordingId: string): void {
  const job = activeJobs.get(recordingId);
  if (!job) return;
  job.cancelled = true;
  clearJob(recordingId);
}
/** Re-summarize an existing transcript without leaving the recording detail screen. */
export function startRecordingSummarizationRetry(
  recordingId: string,
  summarizationMode?: ProcessingMode,
): void {
  if (activeJobs.has(recordingId)) return;
  const pMode = summarizationMode ?? getProcessingSettingsReader().getSummarizationMode();
  const blocker = getLocalLlmSummarizationBlocker(pMode);
  if (blocker) {
    void abortBlockedOnDeviceProcessing(recordingId, blocker);
    return;
  }
  const stageRef = { current: 'summarizing' as const };
  const timeoutId = setTimeout(() => {
    const job = activeJobs.get(recordingId);
    if (!job || job.cancelled) return;
    job.cancelled = true;
    clearJob(recordingId);
    void failJob(
      recordingId,
      new Error(
        'Summarization is taking longer than expected. Check your connection and try again.',
      ),
      stageRef.current,
    );
  }, PROCESSING_TIMEOUT_MS);
  activeJobs.set(recordingId, { cancelled: false, timeoutId });
  void (async () => {
    try {
      const { getRecordingById, updateRecording, recordings } = useRecordingStore.getState();
      const rec = getRecordingById(recordingId);
      if (!rec?.transcript || !hasMeaningfulTranscript(rec.transcript)) {
        throw new Error('No transcript available to summarize.');
      }
      await updateRecording(recordingId, {
        status: 'summarizing',
        errorMessage: undefined,
        processingMode: pMode,
      });
      const result = await retrySummarization(rec.transcript, pMode, {
        onStage: () => {},
      });
      const job = activeJobs.get(recordingId);
      if (job?.cancelled) return;
      const existingTitles = recordings.filter((r) => r.id !== recordingId).map((r) => r.title);
      await updateRecording(recordingId, {
        status: 'ready',
        processingMode: pMode,
        errorMessage: undefined,
        ...buildRecordingReadyFromSummarization(result, { existingTitles }),
      });
      logger.info('RECORDING', 'Summarization retry completed', { recordingId });
    } catch (err: unknown) {
      const job = activeJobs.get(recordingId);
      if (!job?.cancelled) {
        await failJob(recordingId, err, stageRef.current);
      }
    } finally {
      clearJob(recordingId);
    }
  })();
}
export function initialStatusAfterSave(
  settingsTranscriptionMode: string,
): 'transcribing' | 'summarizing' {
  const pipeline = resolvePostRecordingPipeline(
    normalizeTranscriptionMode(settingsTranscriptionMode),
  );
  return pipeline.skipAsyncTranscription ? 'summarizing' : 'transcribing';
}
/**
 * Restarts background jobs for recordings left in a processing status when the app
 * was killed or backgrounded. Safe to call on every cold start after recordings load.
 */
export function resumeInterruptedRecordingProcessing(): void {
  const { recordings } = useRecordingStore.getState();
  const toResume = recordings.filter((rec) => resolveInterruptedProcessingResume(rec) !== 'skip');
  if (toResume.length === 0) return;
  logger.info('RECORDING', 'Resuming interrupted background processing', {
    count: toResume.length,
    ids: toResume.map((r) => r.id),
  });
  for (const rec of toResume) {
    const action = resolveInterruptedProcessingResume(rec);
    if (action === 'summarize-only') {
      startRecordingSummarizationRetry(rec.id, rec.processingMode);
    } else if (action === 'full') {
      startRecordingBackgroundProcessing(rec.id);
    }
  }
}
