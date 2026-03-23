import { create } from 'zustand';
import { ProcessingMode, TranscriptionMode, CloudProvider } from '../types';

interface SettingsState {
  defaultProcessingMode: ProcessingMode;
  defaultTranscriptionMode: TranscriptionMode;
  cloudProvider: CloudProvider;
  cloudApiKey: string; // For backward compatibility - syncs with selected provider key
  openrouterApiKey: string;
  openaiApiKey: string;
  geminiApiKey: string;
  setDefaultProcessingMode: (mode: ProcessingMode) => void;
  setDefaultTranscriptionMode: (mode: TranscriptionMode) => void;
  setCloudProvider: (provider: CloudProvider) => void;
  setCloudApiKey: (key: string) => void;
  setOpenrouterApiKey: (key: string) => void;
  setOpenaiApiKey: (key: string) => void;
  setGeminiApiKey: (key: string) => void;
  getActiveApiKey: () => string;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  defaultProcessingMode: 'cloud-shared-openrouter',
  defaultTranscriptionMode: 'live-assemblyai',
  cloudProvider: 'openrouter',
  cloudApiKey: '',
  openrouterApiKey: '',
  openaiApiKey: '',
  geminiApiKey: '',
  setDefaultProcessingMode: (mode) => set({ defaultProcessingMode: mode }),
  setDefaultTranscriptionMode: (mode) => set({ defaultTranscriptionMode: mode }),
  setCloudProvider: (provider) => set({ cloudProvider: provider }),
  setCloudApiKey: (key) => {
    const state = get();
    // Also update the provider-specific key
    if (state.cloudProvider === 'openrouter') {
      set({ cloudApiKey: key, openrouterApiKey: key });
    } else if (state.cloudProvider === 'openai') {
      set({ cloudApiKey: key, openaiApiKey: key });
    } else if (state.cloudProvider === 'gemini') {
      set({ cloudApiKey: key, geminiApiKey: key });
    }
  },
  setOpenrouterApiKey: (key) => {
    const state = get();
    set({ openrouterApiKey: key });
    if (state.cloudProvider === 'openrouter') {
      set({ cloudApiKey: key });
    }
  },
  setOpenaiApiKey: (key) => {
    const state = get();
    set({ openaiApiKey: key });
    if (state.cloudProvider === 'openai') {
      set({ cloudApiKey: key });
    }
  },
  setGeminiApiKey: (key) => {
    const state = get();
    set({ geminiApiKey: key });
    if (state.cloudProvider === 'gemini') {
      set({ cloudApiKey: key });
    }
  },
  getActiveApiKey: () => {
    const state = get();
    if (state.cloudProvider === 'openrouter') return state.openrouterApiKey;
    if (state.cloudProvider === 'openai') return state.openaiApiKey;
    if (state.cloudProvider === 'gemini') return state.geminiApiKey;
    return state.cloudApiKey;
  },
}));
