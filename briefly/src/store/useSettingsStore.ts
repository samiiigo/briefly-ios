import { create } from 'zustand';
import { ProcessingMode, TranscriptionMode, CloudProvider } from '../types';

/**
 * Provider API key field mapping (OCP).
 *
 * Adding a new cloud provider only requires adding an entry here —
 * no if/else chains need modification anywhere in the store.
 */
const PROVIDER_KEY_FIELD: Record<CloudProvider, keyof Pick<SettingsState, 'openrouterApiKey' | 'openaiApiKey' | 'geminiApiKey'>> = {
  openrouter: 'openrouterApiKey',
  openai: 'openaiApiKey',
  gemini: 'geminiApiKey',
};

interface SettingsState {
  defaultProcessingMode: ProcessingMode;
  defaultTranscriptionMode: TranscriptionMode;
  cloudProvider: CloudProvider;
  cloudApiKey: string;
  openrouterApiKey: string;
  openaiApiKey: string;
  geminiApiKey: string;
  setDefaultProcessingMode: (mode: ProcessingMode) => void;
  setDefaultTranscriptionMode: (mode: TranscriptionMode) => void;
  setCloudProvider: (provider: CloudProvider) => void;
  setCloudApiKey: (key: string) => void;
  setProviderApiKey: (provider: CloudProvider, key: string) => void;
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

  /**
   * Sets the API key for the currently selected cloud provider (OCP).
   * Uses the PROVIDER_KEY_FIELD map instead of if/else chains.
   */
  setCloudApiKey: (key) => {
    const { cloudProvider } = get();
    const field = PROVIDER_KEY_FIELD[cloudProvider];
    set({ cloudApiKey: key, [field]: key });
  },

  /**
   * Sets the API key for a specific provider, syncing cloudApiKey if it's
   * the currently active provider (OCP).
   */
  setProviderApiKey: (provider, key) => {
    const field = PROVIDER_KEY_FIELD[provider];
    const updates: Partial<SettingsState> = { [field]: key };
    if (get().cloudProvider === provider) {
      updates.cloudApiKey = key;
    }
    set(updates as any);
  },

  /**
   * Returns the API key for the active cloud provider (OCP).
   * Lookup via map — no branching.
   */
  getActiveApiKey: () => {
    const state = get();
    const field = PROVIDER_KEY_FIELD[state.cloudProvider];
    return field ? state[field] : state.cloudApiKey;
  },
}));
