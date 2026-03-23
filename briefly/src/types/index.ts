export type CloudProvider = 'openrouter' | 'openai' | 'gemini';
export type ProcessingMode = 'on-device' | 'cloud' | 'cloud-shared-openrouter' | 'cloud-user-key';
export type TranscriptionMode = 'live-assemblyai' | 'post-assemblyai' | 'local-on-device';
/**
 * System-managed storage buckets for recordings.
 *
 * Favorites are modeled as a boolean flag (`isFavorite`) rather than a folder;
 * "unlisted" represents the default, non-archived, non-deleted bucket.
 */
export type RecordingFolder = 'unlisted' | 'archived' | 'recently-deleted';

export interface UserFolder {
  id: string;
  name: string;
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
  isArchived?: boolean;
  /** Set when moved to Recently Deleted; cleared on restore. Used for purge after retention. */
  deletedAt?: number;
  status: RecordingStatus;
  transcript?: TranscriptSegment[];
  summary?: string;
  keyInsights?: KeyInsight[];
  errorMessage?: string;
}

export type RootStackParamList = {
  Main: undefined;
  Recording:
    | {
        transcriptionModeOverride?: TranscriptionMode;
        targetFolder?: RecordingFolder;
        targetUserFolderId?: string;
      }
    | undefined;
  SaveRecording: {
    duration: number;
    filePath: string;
    fileSize: number;
    preTranscript?: TranscriptSegment[];
    transcriptionMode?: TranscriptionMode;
    targetFolder?: RecordingFolder;
    targetUserFolderId?: string;
  };
  Summarizing: { recordingId: string };
  Transcript: { recordingId: string };
  FolderList: undefined;
  FolderRecordings: {
    folderId: string;
    folderName: string;
    folderType: 'built-in' | 'user';
  };
  TranscriptionModePicker: undefined;
  ProcessingModePicker: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Settings: undefined;
};
