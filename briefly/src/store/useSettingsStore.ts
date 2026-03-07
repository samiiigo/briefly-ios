import { create } from 'zustand';
import { ProcessingMode, TranscriptionMode } from '../types';
import { CloudProvider, detectProvider, providerEndpoint } from '../utils';

interface SettingsState {
  defaultProcessingMode: ProcessingMode;
  defaultTranscriptionMode: TranscriptionMode;
  cloudApiKey: string;
  cloudApiProvider: CloudProvider | null;
  cloudApiEndpoint: string;
  setDefaultProcessingMode: (mode: ProcessingMode) => void;
  setDefaultTranscriptionMode: (mode: TranscriptionMode) => void;
  setCloudApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultProcessingMode: 'cloud',
  defaultTranscriptionMode: 'on-device-first',
  cloudApiKey: '',
  cloudApiProvider: null,
  cloudApiEndpoint: '',
  setDefaultProcessingMode: (mode) => set({ defaultProcessingMode: mode }),
  setDefaultTranscriptionMode: (mode) => set({ defaultTranscriptionMode: mode }),
  setCloudApiKey: (key) => {
    const provider = detectProvider(key);
    set({
      cloudApiKey: key,
      cloudApiProvider: provider,
      cloudApiEndpoint: provider ? providerEndpoint(provider) : '',
    });
  },
}));
