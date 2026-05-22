import type { Recording , ProcessingMode } from '@/types';

export interface ImportRecordingStorePort {
  getRecordings(): Recording[];
  importRecordings(recordings: Recording[]): Promise<void>;
}
export interface ImportSettingsPort {
  getSummarizationMode(): ProcessingMode;
}
export interface ImportAudioFilePort {
  copyToDocuments(sourceUri: string, destName: string): Promise<string>;
  probeDurationSec(filePath: string): Promise<number>;
}
export interface ImportUserConfirmationPort {
  confirmImport(message: string, confirmLabel?: string): Promise<boolean>;
  alert(title: string, message: string): void;
}
export interface ImportRecordingPorts {
  store: ImportRecordingStorePort;
  settings: ImportSettingsPort;
  audio: ImportAudioFilePort;
  confirmation: ImportUserConfirmationPort;
}
