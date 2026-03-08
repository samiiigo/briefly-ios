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

export const useSettingsStore = create<SettingsState>((set, get) => {
  // #region agent log
  fetch('http://127.0.0.1:7276/ingest/3b8a80c6-5c97-439c-93c0-97e4ed6ba274',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a409d8'},body:JSON.stringify({sessionId:'a409d8',location:'useSettingsStore.ts:create',message:'store created',data:{hasDefaultTranscriptionMode:true},hypothesisId:'H1',timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return {
  defaultProcessingMode: 'cloud',
  defaultTranscriptionMode: 'on-device',
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
  };
});
