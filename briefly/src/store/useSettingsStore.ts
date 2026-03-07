import { create } from 'zustand';
import { ProcessingMode } from '../types';
import { CloudProvider, detectProvider, providerEndpoint } from '../utils';

interface SettingsState {
  defaultProcessingMode: ProcessingMode;
  cloudApiKey: string;
  cloudApiProvider: CloudProvider | null;
  cloudApiEndpoint: string;
  setDefaultProcessingMode: (mode: ProcessingMode) => void;
  setCloudApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultProcessingMode: 'cloud',
  cloudApiKey: '',
  cloudApiProvider: null,
  cloudApiEndpoint: '',
  setDefaultProcessingMode: (mode) => set({ defaultProcessingMode: mode }),
  setCloudApiKey: (key) => {
    const provider = detectProvider(key);
    set({
      cloudApiKey: key,
      cloudApiProvider: provider,
      cloudApiEndpoint: provider ? providerEndpoint(provider) : '',
    });
  },
}));
