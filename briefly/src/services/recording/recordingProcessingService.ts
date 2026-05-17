import { ProcessingMode, TranscriptSegment, TranscriptionMode } from '@/types';
import { SummarizationService } from '@/services/summarization';
import { TranscriptionService } from '@/services/transcription';
import {
  normalizeTranscriptionMode,
  resolvePostRecordingPipeline,
} from '@/utils/transcriptionMode';
import {
  ProcessingFailure,
  shouldSkipAudioFallback,
  toProcessingFailure,
  toUserFacingProcessingError,
} from '@/utils/processingErrors';
import {
  hasMeaningfulTranscript,
  validateRecordingAsset,
} from '@/utils/recordingValidation';
import { logger } from '@/utils/logger';

export type RecordingProcessingStage = 'transcribing' | 'summarizing';

/** Standard file-based transcription used when the primary path fails or the user retries. */
export const FALLBACK_TRANSCRIPTION_MODE: TranscriptionMode = 'post-assemblyai';

export interface RecordingProcessingResult {
  segments: TranscriptSegment[];
  summary: string;
  keyInsights: Awaited<ReturnType<typeof SummarizationService.summarize>>['keyInsights'];
  usedAudioFallback: boolean;
}

export interface RecordingProcessingCallbacks {
  onStage: (stage: RecordingProcessingStage) => void;
  onTranscriptReady?: (segments: TranscriptSegment[]) => void | Promise<void>;
}

function assertTranscriptHasContent(segments: TranscriptSegment[]): void {
  if (!hasMeaningfulTranscript(segments)) {
    throw new Error('No speech was detected in this recording.');
  }
}

/**
 * Transcribes the saved audio file via AssemblyAI (post-recording pipeline).
 */
export async function transcribeSavedAudioFile(
  filePath: string,
  meta?: { durationSec?: number; fileSizeBytes?: number },
): Promise<TranscriptSegment[]> {
  if (meta?.fileSizeBytes != null && meta.fileSizeBytes > 0) {
    validateRecordingAsset({
      filePath,
      durationSec: meta.durationSec ?? 0,
      fileSizeBytes: meta.fileSizeBytes,
    });
  } else if (!filePath?.trim()) {
    throw new Error('No audio file was saved for this recording.');
  }

  logger.info('RECORDING', 'Fallback: transcribing saved audio file', { filePath });
  const segments = await TranscriptionService.transcribe(
    filePath,
    undefined,
    FALLBACK_TRANSCRIPTION_MODE,
  );
  assertTranscriptHasContent(segments);
  return segments;
}

/**
 * Resolves transcript text after save based on global Settings mode.
 */
export async function obtainTranscriptForSummarization(
  settingsTranscriptionMode: TranscriptionMode | string,
  filePath: string,
  existingTranscript?: TranscriptSegment[] | null,
  meta?: { durationSec?: number; fileSizeBytes?: number },
): Promise<TranscriptSegment[]> {
  const settingsMode = normalizeTranscriptionMode(settingsTranscriptionMode);
  const pipeline = resolvePostRecordingPipeline(settingsMode, existingTranscript);

  if (pipeline.skipAsyncTranscription) {
    const segments = existingTranscript ?? [];
    assertTranscriptHasContent(segments);
    return segments;
  }

  if (settingsMode === 'local-on-device') {
    throw new Error('No on-device transcript was captured during recording.');
  }

  if (meta?.fileSizeBytes != null) {
    validateRecordingAsset({
      filePath,
      durationSec: meta.durationSec ?? 0,
      fileSizeBytes: meta.fileSizeBytes,
    });
  }

  const segments = await TranscriptionService.transcribe(
    filePath,
    undefined,
    pipeline.asyncTranscriptionMode,
  );

  assertTranscriptHasContent(segments);
  return segments;
}

/**
 * Primary path with automatic fallback: on transcript failure, transcribe saved audio.
 */
export async function obtainTranscriptWithAutoFallback(
  settingsTranscriptionMode: TranscriptionMode | string,
  filePath: string,
  existingTranscript: TranscriptSegment[] | undefined,
  callbacks: Pick<RecordingProcessingCallbacks, 'onStage' | 'onTranscriptReady'>,
  meta?: { durationSec?: number; fileSizeBytes?: number },
): Promise<{ segments: TranscriptSegment[]; usedAudioFallback: boolean }> {
  try {
    const segments = await obtainTranscriptForSummarization(
      settingsTranscriptionMode,
      filePath,
      existingTranscript,
      meta,
    );
    return { segments, usedAudioFallback: false };
  } catch (primaryError) {
    if (shouldSkipAudioFallback(primaryError)) {
      throw toProcessingFailure(primaryError, 'transcription');
    }

    logger.warn('RECORDING', 'Primary transcription failed; using saved audio fallback', {
      error: primaryError instanceof Error ? primaryError.message : String(primaryError),
    });

    callbacks.onStage('transcribing');

    try {
      const segments = await transcribeSavedAudioFile(filePath, meta);
      await callbacks.onTranscriptReady?.(segments);
      return { segments, usedAudioFallback: true };
    } catch (fallbackError) {
      throw toProcessingFailure(fallbackError, 'transcription');
    }
  }
}

async function summarizeTranscript(
  segments: TranscriptSegment[],
  summarizationMode: ProcessingMode,
): Promise<Pick<RecordingProcessingResult, 'summary' | 'keyInsights'>> {
  assertTranscriptHasContent(segments);
  try {
    return await SummarizationService.summarize(segments, summarizationMode);
  } catch (err) {
    throw new ProcessingFailure(
      'summarization',
      toUserFacingProcessingError(err).message,
      summarizationMode,
    );
  }
}

/**
 * Re-runs summarization only (transcript must already exist).
 */
export async function retrySummarization(
  segments: TranscriptSegment[],
  summarizationMode: ProcessingMode,
  callbacks: Pick<RecordingProcessingCallbacks, 'onStage'>,
): Promise<Pick<RecordingProcessingResult, 'summary' | 'keyInsights'>> {
  callbacks.onStage('summarizing');
  return summarizeTranscript(segments, summarizationMode);
}

export interface ProcessRecordingOptions {
  durationSec?: number;
  fileSizeBytes?: number;
}

/**
 * Always transcribes the saved audio file, then summarizes.
 */
export async function processRecordingFromSavedAudio(
  summarizationMode: ProcessingMode,
  filePath: string,
  callbacks: RecordingProcessingCallbacks,
  meta?: ProcessRecordingOptions,
): Promise<RecordingProcessingResult> {
  callbacks.onStage('transcribing');
  try {
    const segments = await transcribeSavedAudioFile(filePath, meta);
    await callbacks.onTranscriptReady?.(segments);
    callbacks.onStage('summarizing');
    const { summary, keyInsights } = await summarizeTranscript(segments, summarizationMode);
    return { segments, summary, keyInsights, usedAudioFallback: true };
  } catch (err) {
    throw toProcessingFailure(err, 'transcription');
  }
}

export async function processRecordingToReady(
  settingsTranscriptionMode: TranscriptionMode | string,
  summarizationMode: ProcessingMode,
  filePath: string,
  existingTranscript: TranscriptSegment[] | undefined,
  callbacks: RecordingProcessingCallbacks,
  meta?: ProcessRecordingOptions,
): Promise<RecordingProcessingResult> {
  if (!filePath?.trim()) {
    throw new ProcessingFailure(
      'transcription',
      'No audio file was saved for this recording.',
    );
  }

  const pipeline = resolvePostRecordingPipeline(
    settingsTranscriptionMode,
    existingTranscript,
  );

  callbacks.onStage(pipeline.skipAsyncTranscription ? 'summarizing' : 'transcribing');

  try {
    const { segments, usedAudioFallback } = await obtainTranscriptWithAutoFallback(
      settingsTranscriptionMode,
      filePath,
      existingTranscript,
      callbacks,
      meta,
    );

    if (!usedAudioFallback) {
      await callbacks.onTranscriptReady?.(segments);
    }

    callbacks.onStage('summarizing');
    const { summary, keyInsights } = await summarizeTranscript(segments, summarizationMode);

    return { segments, summary, keyInsights, usedAudioFallback };
  } catch (err) {
    if (err instanceof ProcessingFailure) throw err;
    throw toProcessingFailure(err, 'transcription');
  }
}
