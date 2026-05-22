import { CloudProvider } from '@/types';
import { isValidApiKeyFormat } from '@/utils/providers/cloudProvider';
import { ValidationError, validateObject } from './schema';

/** OWASP-recommended bounds for user-visible text fields. */
export const MAX_FOLDER_NAME_LENGTH = 80;
export const MAX_RECORDING_TITLE_LENGTH = 200;
export const MAX_SEARCH_QUERY_LENGTH = 200;
export const MAX_API_KEY_LENGTH = 512;

const ID_PATTERN = /^[a-zA-Z0-9_-]{4,128}$/;
const USER_FOLDER_ID_PATTERN = /^uf_[a-zA-Z0-9_-]{2,120}$/;

const folderNameSchema = {
  type: 'object' as const,
  strict: true,
  fields: {
    name: {
      type: 'string' as const,
      minLength: 1,
      maxLength: MAX_FOLDER_NAME_LENGTH,
      trim: true,
    },
  },
};

const recordingTitleSchema = {
  type: 'object' as const,
  strict: true,
  fields: {
    title: {
      type: 'string' as const,
      minLength: 1,
      maxLength: MAX_RECORDING_TITLE_LENGTH,
      trim: true,
    },
  },
};

const searchQuerySchema = {
  type: 'object' as const,
  strict: true,
  fields: {
    query: {
      type: 'string' as const,
      minLength: 1,
      maxLength: MAX_SEARCH_QUERY_LENGTH,
      trim: true,
    },
  },
};

/** Allow-list for recording patch keys (internal + UI). */
const RECORDING_PATCH_KEYS = new Set([
  'title',
  'duration',
  'filePath',
  'fileSize',
  'transcriptionMode',
  'processingMode',
  'folder',
  'userFolderId',
  'isFavorite',
  'isImported',
  'isArchived',
  'deletedAt',
  'status',
  'transcript',
  'summary',
  'keyInsights',
  'mainEmoji',
  'errorMessage',
]);

const MAX_TRANSCRIPT_SEGMENTS = 10_000;

/** AssemblyAI async transcript create payload — strict allow-list. */
export const assemblyAiTranscriptCreateSchema = {
  type: 'object' as const,
  strict: true,
  fields: {
    audio_url: { type: 'string' as const, minLength: 8, maxLength: 4096 },
    punctuate: { type: 'boolean' as const },
    format_text: { type: 'boolean' as const },
    language_detection: { type: 'boolean' as const },
    speech_models: {
      type: 'array' as const,
      maxItems: 4,
      items: { type: 'string' as const, minLength: 1, maxLength: 64 },
    },
  },
};

export function validateFolderName(name: string): string {
  const { name: validated } = validateObject<{ name: string }>({ name }, folderNameSchema);
  return validated;
}

export function validateRecordingTitle(title: string): string {
  const { title: validated } = validateObject<{ title: string }>(
    { title },
    recordingTitleSchema
  );
  return validated;
}

export function validateSearchQuery(query: string): string {
  const { query: validated } = validateObject<{ query: string }>({ query }, searchQuerySchema);
  return validated;
}

export function validateRecordingId(id: string): string {
  const trimmed = id.trim();
  if (!ID_PATTERN.test(trimmed)) {
    throw new ValidationError('Invalid recording id', 'id');
  }
  return trimmed;
}

export function validateUserFolderId(id: string): string {
  const trimmed = id.trim();
  if (!USER_FOLDER_ID_PATTERN.test(trimmed)) {
    throw new ValidationError('Invalid folder id', 'id');
  }
  return trimmed;
}

export function validateProviderApiKey(key: string, provider: CloudProvider): string {
  const trimmed = key.trim();
  if (!trimmed) return '';
  if (trimmed.length > MAX_API_KEY_LENGTH) {
    throw new ValidationError('API key is too long', 'apiKey');
  }
  if (!isValidApiKeyFormat(trimmed, provider)) {
    throw new ValidationError(`API key format is invalid for ${provider}`, 'apiKey');
  }
  return trimmed;
}

/**
 * Validates recording store patches: rejects unknown keys; sanitizes text fields.
 * `undefined` values are allowed (used to clear transcript/summary during re-runs).
 */
export function validateRecordingUpdates(
  updates: Record<string, unknown>
): Record<string, unknown> {
  for (const key of Object.keys(updates)) {
    if (!RECORDING_PATCH_KEYS.has(key)) {
      throw new ValidationError(`${key} is not allowed on recording updates`, key);
    }
  }

  const out: Record<string, unknown> = { ...updates };

  if (typeof out.title === 'string') {
    out.title = validateRecordingTitle(out.title);
  }
  if (typeof out.filePath === 'string') {
    out.filePath = out.filePath.trim().slice(0, 2048);
  }
  if (typeof out.userFolderId === 'string') {
    out.userFolderId = validateUserFolderId(out.userFolderId);
  }
  if (typeof out.summary === 'string') {
    out.summary = out.summary.slice(0, 200_000);
  }
  if (typeof out.errorMessage === 'string') {
    out.errorMessage = out.errorMessage.trim().slice(0, 2000);
  }
  if (typeof out.mainEmoji === 'string') {
    out.mainEmoji = out.mainEmoji.trim().slice(0, 16);
  }
  if (out.transcript != null && !Array.isArray(out.transcript)) {
    throw new ValidationError('transcript must be an array', 'transcript');
  }
  if (Array.isArray(out.transcript) && out.transcript.length > MAX_TRANSCRIPT_SEGMENTS) {
    throw new ValidationError('transcript has too many segments', 'transcript');
  }
  if (out.keyInsights != null && !Array.isArray(out.keyInsights)) {
    throw new ValidationError('keyInsights must be an array', 'keyInsights');
  }

  return out;
}

export function validateAssemblyAiTranscriptCreateBody(
  body: Record<string, unknown>
): Record<string, unknown> {
  return validateObject(body, assemblyAiTranscriptCreateSchema);
}
