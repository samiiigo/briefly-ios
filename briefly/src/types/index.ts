export type ProcessingMode = 'on-device' | 'cloud';
export type TranscriptionMode = 'on-device' | 'cloud' | 'on-device-first';
export type RecordingFolder = 'unlisted' | 'favorites' | 'archived';

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
};

export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Settings: undefined;
};
