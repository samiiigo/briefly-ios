import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProcessingMode, TranscriptionMode, CloudProvider } from '@/types';
import type { ThemePreference } from '@/utils/theme/themePreference';
import { registerLocalLlmDownloadStateSetter } from '@/services/summarization/local/localLlmDownloadState';
import {
  loadProviderApiKeysFromSecureStore,
  saveProviderApiKey,
} from '@/security/secureApiKeyStore';
import { ValidationError } from '@/security/schema';

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
  /** App-wide summarization mode (Settings is the only place to change this). */
  summarizationMode: ProcessingMode;
  /** App-wide transcription mode (Settings is the only place to change this). */
  transcriptionMode: TranscriptionMode;
  /** Decorative live transcript panel during recording (does not affect processing). */
  showLivePreview: boolean;
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

  /** Local Gemma GGUF download state (on-device summarization). */
  localLlmModelReady: boolean;
  localLlmDownloadProgress: number | null;
  localLlmDownloadStatus: 'idle' | 'downloading' | 'ready' | 'error';
  localLlmDownloadError?: string;
  themePreference: ThemePreference;

  setSummarizationMode: (mode: ProcessingMode) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setTranscriptionMode: (mode: TranscriptionMode) => void;
  setShowLivePreview: (enabled: boolean) => void;
  setCloudProvider: (provider: CloudProvider) => void;
  setCloudApiKey: (key: string) => void;
  setProviderApiKey: (provider: CloudProvider, key: string) => void;
  getActiveApiKey: () => string;

  /**
   * Called once on first launch after the environment has been probed.
   * Sets the transcription mode to the recommended value and marks
   * setup as complete. Subsequent calls are no-ops (idempotent).
   */
  applyEnvironmentDefaults: (recommendedMode: TranscriptionMode) => void;

  /** Deletes the on-device GGUF and resets download state to idle. */
  deleteLocalLlmModel: () => Promise<void>;
}

/** API keys live in SecureStore — never written to AsyncStorage. */
function partializeSettings(state: SettingsState): Omit<
  SettingsState,
  'openrouterApiKey' | 'openaiApiKey' | 'geminiApiKey' | 'cloudApiKey'
> & {
  openrouterApiKey?: never;
  openaiApiKey?: never;
  geminiApiKey?: never;
  cloudApiKey?: never;
} {
  const {
    openrouterApiKey: _o,
    openaiApiKey: _a,
    geminiApiKey: _g,
    cloudApiKey: _c,
    ...rest
  } = state;
  return rest;
}

async function persistProviderKey(provider: CloudProvider, key: string): Promise<void> {
  try {
    await saveProviderApiKey(provider, key);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      summarizationMode: 'cloud-shared-openrouter',
      transcriptionMode: 'cloud',
      showLivePreview: true,
      cloudProvider: 'openrouter',
      cloudApiKey: '',
      openrouterApiKey: '',
      openaiApiKey: '',
      geminiApiKey: '',
      hasCompletedEnvSetup: false,
      localLlmModelReady: false,
      localLlmDownloadProgress: null,
      localLlmDownloadStatus: 'idle',
      localLlmDownloadError: undefined,
      themePreference: 'system',

      setSummarizationMode: (mode) => set({ summarizationMode: mode }),
      setThemePreference: (preference) => set({ themePreference: preference }),
      setTranscriptionMode: (mode) => set({ transcriptionMode: mode }),
      setShowLivePreview: (enabled) => set({ showLivePreview: enabled }),
      setCloudProvider: (provider) => set({ cloudProvider: provider }),

      /**
       * Sets the API key for the currently selected cloud provider (OCP).
       * Persisted in OS secure storage, not AsyncStorage.
       */
      setCloudApiKey: (key) => {
        const { cloudProvider } = get();
        const field = PROVIDER_KEY_FIELD[cloudProvider];
        void persistProviderKey(cloudProvider, key);
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
        void persistProviderKey(provider, key);
        set(updates as Partial<SettingsState>);
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
          transcriptionMode: recommendedMode,
          hasCompletedEnvSetup: true,
        });
      },

      deleteLocalLlmModel: async () => {
        const { deleteLocalGemmaModel } = await import(
          '@/services/summarization/local/gemmaModelDownload'
        );
        await deleteLocalGemmaModel();
      },
    }),
    {
      name: '@briefly/settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: partializeSettings,
      onRehydrateStorage: () => async (state) => {
        const keys = await loadProviderApiKeysFromSecureStore();
        if (state) {
          const activeField = PROVIDER_KEY_FIELD[state.cloudProvider];
          useSettingsStore.setState({
            ...keys,
            cloudApiKey: keys[activeField],
          });
        }
      },
    },
  ),
);

registerLocalLlmDownloadStateSetter(
  (patch) => useSettingsStore.setState(patch),
  () => {
    const state = useSettingsStore.getState();
    return {
      localLlmDownloadStatus: state.localLlmDownloadStatus,
      localLlmDownloadProgress: state.localLlmDownloadProgress,
    };
  },
);
