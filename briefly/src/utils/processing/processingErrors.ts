import { ProcessingMode } from '@/types';
export type ProcessingFailurePhase = 'transcription' | 'summarization';
export class ProcessingFailure extends Error {
  readonly phase: ProcessingFailurePhase;
  readonly summarizationMode?: ProcessingMode;
  constructor(
    phase: ProcessingFailurePhase,
    message: string,
    summarizationMode?: ProcessingMode,
  ) {
    super(message);
    this.name = 'ProcessingFailure';
    this.phase = phase;
    this.summarizationMode = summarizationMode;
  }
}
const SHORT_RECORDING_PATTERNS = [
  'too short',
  'too small',
  'empty',
  'no audio file',
  'audio file not found',
  'no transcript',
  'no live transcript',
  'no on-device transcript',
];
const NETWORK_PATTERNS = [
  'network',
  'timeout',
  'timed out',
  'fetch',
  'connection',
  'offline',
  'internet',
  'abort',
  'socket',
  'failed to connect',
  'upload failed',
  'poll failed',
];
export function isShortOrEmptyRecordingError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return SHORT_RECORDING_PATTERNS.some((p) => message.includes(p));
}
/** Missing on-disk audio (stale cache path, deleted file, etc.). */
export function isAudioFileMissingError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes('audio file not found') ||
    message.includes('no audio file was saved')
  );
}
export function isNetworkRelatedError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return NETWORK_PATTERNS.some((p) => message.includes(p));
}
/**
 * Maps internal errors to stable, user-facing copy for processing UI.
 */
export function toUserFacingProcessingError(
  error: unknown,
  context?: { afterFallback?: boolean },
): Error {
  if (error instanceof Error && error.message && !error.message.startsWith('AssemblyAI')) {
    const raw = error.message;
    if (isShortOrEmptyRecordingError(error)) {
      return new Error(raw);
    }
    if (isNetworkRelatedError(error)) {
      if (context?.afterFallback) {
        return new Error(
          'Could not reach the transcription service. Check your connection, then tap “Transcribe from recording” to try again.',
        );
      }
      return new Error(
        'Network connection was lost or timed out. Check your internet and try again.',
      );
    }
    return new Error(raw);
  }
  const message = error instanceof Error ? error.message : String(error);
  if (isShortOrEmptyRecordingError(error)) {
    return new Error(
      message.includes('short') || message.includes('empty')
        ? message
        : 'Recording is too short. Record for at least 10 seconds and try again.',
    );
  }
  if (isNetworkRelatedError(error)) {
    return new Error(
      context?.afterFallback
        ? 'Could not reach the transcription service. Check your connection, then tap “Transcribe from recording” to try again.'
        : 'Network connection was lost or timed out. Check your internet and try again.',
    );
  }
  return new Error(
    context?.afterFallback
      ? 'Transcription from your saved recording failed. Try again when you have a stable connection.'
      : 'Something went wrong while processing your recording. Try again or transcribe from the saved audio.',
  );
}
/** Primary path failed in a way where re-uploading the same short file will not help. */
export function shouldSkipAudioFallback(error: unknown): boolean {
  if (error instanceof ProcessingFailure && error.phase === 'summarization') {
    return true;
  }
  return isShortOrEmptyRecordingError(error);
}
export function toProcessingFailure(
  err: unknown,
  fallbackPhase: ProcessingFailurePhase,
  summarizationMode?: ProcessingMode,
): ProcessingFailure {
  if (err instanceof ProcessingFailure) return err;
  return new ProcessingFailure(
    fallbackPhase,
    toUserFacingProcessingError(err).message,
    summarizationMode,
  );
}
