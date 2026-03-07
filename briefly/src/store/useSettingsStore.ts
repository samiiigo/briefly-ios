import { create } from 'zustand';
import { ProcessingMode, RecordingFolder, TranscriptionMode } from '../types';
import { CloudProvider, detectProvider, providerEndpoint } from '../utils';

interface SettingsState {
  defaultProcessingMode: ProcessingMode;
  defaultTranscriptionMode: TranscriptionMode;
  defaultRecordingFolder: RecordingFolder;
  cloudApiKey: string;
  cloudApiProvider: CloudProvider | null;
  cloudApiEndpoint: string;
  setDefaultProcessingMode: (mode: ProcessingMode) => void;
  setDefaultTranscriptionMode: (mode: TranscriptionMode) => void;
  setDefaultRecordingFolder: (folder: RecordingFolder) => void;
  setCloudApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultProcessingMode: 'cloud',
  defaultTranscriptionMode: 'on-device-first',
  defaultRecordingFolder: 'unlisted',
  cloudApiKey: '',
  cloudApiProvider: null,
  cloudApiEndpoint: '',
  setDefaultProcessingMode: (mode) => set({ defaultProcessingMode: mode }),
  setDefaultTranscriptionMode: (mode) => set({ defaultTranscriptionMode: mode }),
  setDefaultRecordingFolder: (folder) => set({ defaultRecordingFolder: folder }),
  setCloudApiKey: (key) => {
    const provider = detectProvider(key);
    set({
      cloudApiKey: key,
      cloudApiProvider: provider,
      cloudApiEndpoint: provider ? providerEndpoint(provider) : '',
    });
  },
}));
