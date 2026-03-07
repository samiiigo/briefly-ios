export type ProcessingMode = 'on-device' | 'cloud';

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
  processingMode: ProcessingMode;
  status: RecordingStatus;
  transcript?: TranscriptSegment[];
  summary?: string;
  keyInsights?: KeyInsight[];
  errorMessage?: string;
}

export type RootStackParamList = {
  Main: undefined;
  Recording: undefined;
  SaveRecording: {
    duration: number;
    filePath: string;
    fileSize: number;
    preTranscript?: TranscriptSegment[];
  };
  Summarizing: { recordingId: string };
  Transcript: { recordingId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Settings: undefined;
};
