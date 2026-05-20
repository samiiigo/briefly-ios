export type LocalLlmDownloadStatus = 'idle' | 'downloading' | 'ready' | 'error';

export type LocalLlmDownloadStatePatch = Partial<{
  localLlmModelReady: boolean;
  localLlmDownloadProgress: number | null;
  localLlmDownloadStatus: LocalLlmDownloadStatus;
  localLlmDownloadError: string | undefined;
}>;

type LocalLlmDownloadStateSnapshot = {
  localLlmDownloadStatus: LocalLlmDownloadStatus;
  localLlmDownloadProgress: number | null;
};

type StateSetter = (patch: LocalLlmDownloadStatePatch) => void;

let setLocalLlmDownloadState: StateSetter | null = null;
let mirroredDownloadStatus: LocalLlmDownloadStatus = 'idle';
let mirroredDownloadProgress: number | null = null;

/**
 * Wires download-state helpers to the settings store without importing it here
 * (avoids require cycles with gemmaModelDownload).
 */
export function registerLocalLlmDownloadStateSetter(
  setter: StateSetter,
  getSnapshot?: () => LocalLlmDownloadStateSnapshot,
): void {
  setLocalLlmDownloadState = setter;
  if (getSnapshot) {
    const snapshot = getSnapshot();
    mirroredDownloadStatus = snapshot.localLlmDownloadStatus;
    mirroredDownloadProgress = snapshot.localLlmDownloadProgress;
  }
}

export function getMirroredLocalLlmDownloadStatus(): LocalLlmDownloadStatus {
  return mirroredDownloadStatus;
}

export function getMirroredLocalLlmDownloadProgress(): number | null {
  return mirroredDownloadProgress;
}

/** Applies a partial update to the persisted local LLM download slice. */
export function applyLocalLlmDownloadState(patch: LocalLlmDownloadStatePatch): void {
  if (patch.localLlmDownloadStatus !== undefined) {
    mirroredDownloadStatus = patch.localLlmDownloadStatus;
  }
  if (patch.localLlmDownloadProgress !== undefined) {
    mirroredDownloadProgress = patch.localLlmDownloadProgress;
  }
  setLocalLlmDownloadState?.(patch);
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
