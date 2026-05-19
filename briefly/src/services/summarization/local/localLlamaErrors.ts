const OOM_PATTERNS = [
  'out of memory',
  'oom',
  'failed to allocate',
  'cannot allocate',
  'memory allocation',
  'not enough memory',
  'kv cache',
  'ggml_alloc',
  'std::bad_alloc',
  'exceeds device',
  'mmap',
];

const DEVICE_PATTERNS = [
  'model not found',
  'failed to load model',
  'unable to load',
  'no such file',
  'invalid model',
];

export class LocalLlamaError extends Error {
  readonly code: 'oom' | 'device' | 'model_missing' | 'download' | 'unknown';

  constructor(code: LocalLlamaError['code'], message: string) {
    super(message);
    this.name = 'LocalLlamaError';
    this.code = code;
  }
}

export function mapLlamaNativeError(error: unknown): LocalLlamaError {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (OOM_PATTERNS.some((p) => lower.includes(p))) {
    return new LocalLlamaError(
      'oom',
      'On-device summarization needs more memory than this device has available. Close other apps, use a shorter recording, or switch to cloud summarization in Settings.',
    );
  }

  if (DEVICE_PATTERNS.some((p) => lower.includes(p))) {
    return new LocalLlamaError(
      'device',
      'The on-device model could not be loaded on this device. Try downloading the model again from Settings or use cloud summarization.',
    );
  }

  if (lower.includes('download') || lower.includes('network')) {
    return new LocalLlamaError(
      'download',
      'The on-device model could not be downloaded. Check your connection and try again.',
    );
  }

  return new LocalLlamaError(
    'unknown',
    raw.trim() || 'On-device summarization failed. Try again or switch to cloud summarization in Settings.',
  );
}

export function isLocalLlamaError(error: unknown): error is LocalLlamaError {
  return error instanceof LocalLlamaError;
}
