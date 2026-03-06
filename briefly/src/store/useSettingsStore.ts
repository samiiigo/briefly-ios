import { create } from 'zustand';
import { ProcessingMode } from '../types';

interface SettingsState {
  defaultProcessingMode: ProcessingMode;
  cloudApiKey: string;
  cloudApiProvider: 'openai' | 'anthropic';
  cloudApiEndpoint: string;
  setDefaultProcessingMode: (mode: ProcessingMode) => void;
  setCloudApiKey: (key: string) => void;
  setCloudApiProvider: (provider: 'openai' | 'anthropic') => void;
  setCloudApiEndpoint: (endpoint: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultProcessingMode: 'on-device',
  cloudApiKey: '',
  cloudApiProvider: 'openai',
  cloudApiEndpoint: 'https://api.openai.com/v1',
  setDefaultProcessingMode: (mode) => set({ defaultProcessingMode: mode }),
  setCloudApiKey: (key) => set({ cloudApiKey: key }),
  setCloudApiProvider: (provider) => set({ cloudApiProvider: provider }),
  setCloudApiEndpoint: (endpoint) => set({ cloudApiEndpoint: endpoint }),
}));
