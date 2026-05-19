import { useSettingsStore } from '@/context/useSettingsStore';

export type LocalLlmDownloadStatus = 'idle' | 'downloading' | 'ready' | 'error';

export type LocalLlmDownloadStatePatch = Partial<{
  localLlmModelReady: boolean;
  localLlmDownloadProgress: number | null;
  localLlmDownloadStatus: LocalLlmDownloadStatus;
  localLlmDownloadError: string | undefined;
}>;

/** Applies a partial update to the persisted local LLM download slice. */
export function applyLocalLlmDownloadState(patch: LocalLlmDownloadStatePatch): void {
  useSettingsStore.setState(patch);
}

export function resetLocalLlmDownloadStateToIdle(): void {
  applyLocalLlmDownloadState({
    localLlmModelReady: false,
    localLlmDownloadProgress: null,
    localLlmDownloadStatus: 'idle',
    localLlmDownloadError: undefined,
  });
}

export function markLocalLlmDownloadReady(): void {
  applyLocalLlmDownloadState({
    localLlmModelReady: true,
    localLlmDownloadProgress: 1,
    localLlmDownloadStatus: 'ready',
    localLlmDownloadError: undefined,
  });
}

export function markLocalLlmDownloadStarting(): void {
  applyLocalLlmDownloadState({
    localLlmModelReady: false,
    localLlmDownloadProgress: 0,
    localLlmDownloadStatus: 'downloading',
    localLlmDownloadError: undefined,
  });
}

export function markLocalLlmDownloadFailed(message: string): void {
  applyLocalLlmDownloadState({
    localLlmModelReady: false,
    localLlmDownloadProgress: null,
    localLlmDownloadStatus: 'error',
    localLlmDownloadError: message,
  });
}
