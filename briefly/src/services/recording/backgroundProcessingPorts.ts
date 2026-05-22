import { ProcessingMode, Recording, TranscriptionMode } from '@/types';
export interface RecordingBackgroundStorePort {
  getRecordingById(id: string): Recording | undefined;
  getAllRecordings(): Recording[];
  updateRecording(id: string, updates: Partial<Recording>): Promise<void>;
}
export interface BackgroundProcessingSettingsPort {
  getTranscriptionMode(): TranscriptionMode;
  getSummarizationMode(): ProcessingMode;
}
export interface BackgroundProcessingPorts {
  store: RecordingBackgroundStorePort;
  settings: BackgroundProcessingSettingsPort;
}
