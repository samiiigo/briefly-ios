import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProcessingMode, TranscriptionMode, CloudProvider } from '../types';

/**
 * Provider API key field mapping (OCP).
 *
 * Adding a new cloud provider only requires adding an entry here —
 * no if/else chains need modification anywhere in the store.
 */
const PROVIDER_KEY_FIELD: Record<
  CloudProvider,
  keyof Pick<SettingsState, 'openrouterApiKey' | 'openaiApiKey' | 'geminiApiKey'>
> = {
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

  /**
   * Persisted flag: true once the first-run environment check has been
   * completed and the recommended default has been written. Prevents
   * the env check from overwriting user-chosen preferences on subsequent runs.
   */
  hasCompletedEnvSetup: boolean;

  setDefaultProcessingMode: (mode: ProcessingMode) => void;
  setDefaultTranscriptionMode: (mode: TranscriptionMode) => void;
  setCloudProvider: (provider: CloudProvider) => void;
  setCloudApiKey: (key: string) => void;
  setProviderApiKey: (provider: CloudProvider, key: string) => void;
  getActiveApiKey: () => string;

  /**
   * Called once on first launch after the environment has been probed.
   * Sets the default transcription mode to the recommended value and marks
   * setup as complete. Subsequent calls are no-ops (idempotent).
   */
  applyEnvironmentDefaults: (recommendedMode: TranscriptionMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      defaultProcessingMode: 'cloud-shared-openrouter',
      defaultTranscriptionMode: 'live-assemblyai',
      cloudProvider: 'openrouter',
      cloudApiKey: '',
      openrouterApiKey: '',
      openaiApiKey: '',
      geminiApiKey: '',
      hasCompletedEnvSetup: false,

      setDefaultProcessingMode: (mode) => set({ defaultProcessingMode: mode }),
      setDefaultTranscriptionMode: (mode) => set({ defaultTranscriptionMode: mode }),
      setCloudProvider: (provider) => set({ cloudProvider: provider }),

      /**
       * Sets the API key for the currently selected cloud provider (OCP).
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
       */
      getActiveApiKey: () => {
        const state = get();
        const field = PROVIDER_KEY_FIELD[state.cloudProvider];
        return field ? state[field] : state.cloudApiKey;
      },

      applyEnvironmentDefaults: (recommendedMode) => {
        if (get().hasCompletedEnvSetup) return;
        set({
          defaultTranscriptionMode: recommendedMode,
          hasCompletedEnvSetup: true,
        });
      },
    }),
    {
      name: '@briefly/settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
