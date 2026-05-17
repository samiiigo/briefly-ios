export type CloudProvider = 'openrouter' | 'openai' | 'gemini';
export type ProcessingMode = 'on-device' | 'cloud' | 'cloud-shared-openrouter' | 'cloud-user-key';
export type TranscriptionMode = 'live-assemblyai' | 'post-assemblyai' | 'local-on-device';
/**
 * System-managed storage buckets for recordings.
 *
 * Favorites are item state (`isFavorite`) only, not a storage location. The
 * Favorites folder aggregates favorited items; originals stay in their buckets.
 * Imports aggregates items brought in from outside the app (`isImported`); originals
 * stay in their storage buckets (same pattern as favorites).
 * "unlisted" is the default non-archived, non-deleted system bucket.
 */
export type RecordingFolder = 'unlisted' | 'archived' | 'recently-deleted';

export interface UserFolder {
  id: string;
  name: string;
  /** When true, folder appears in the Library Pinned section (max 6). */
  pinned?: boolean;
  /** Set when pinned; most recently pinned sorts first among pinned folders. */
  pinnedAt?: number;
}

export type RecordingStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'saved'
  | 'transcribing'
  | 'summarizing'
  | 'ready'
  | 'error';

export interface TranscriptSegment {
  id: string;
  speaker?: string;
  speakerInitial?: string;
  text: string;
  startTime: number; // seconds from recording start
  endTime: number;
  isFinal: boolean;
}

export interface KeyInsight {
  id: string;
  text: string;
}

export interface Recording {
  id: string;
  title: string;
  createdAt: number; // Unix timestamp ms
  duration: number; // seconds
  filePath: string;
  fileSize: number; // bytes
  transcriptionMode?: TranscriptionMode;
  processingMode: ProcessingMode;
  folder?: RecordingFolder;
  userFolderId?: string;
  isFavorite?: boolean;
  /** True when the file was brought in from outside the app (import) or saved from the Imports folder. */
  isImported?: boolean;
  isArchived?: boolean;
  /** Set when moved to Recently Deleted; cleared on restore. Used for purge after retention. */
  deletedAt?: number;
  status: RecordingStatus;
  transcript?: TranscriptSegment[];
  summary?: string;
  keyInsights?: KeyInsight[];
  errorMessage?: string;
}

