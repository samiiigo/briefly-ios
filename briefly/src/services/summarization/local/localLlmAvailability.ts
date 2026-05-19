import { ProcessingMode } from '@/types';
import { useSettingsStore } from '@/context/useSettingsStore';
import { LocalModelStorageService } from '@/services/storage/localModelStorageService';
import {
  isLocalGemmaModelDownloaded,
  isLocalLlmDownloadInProgress,
  isPartialLocalGemmaModelOnDisk,
} from './gemmaModelDownload';
import { LocalLlamaError } from './localLlamaErrors';

export type LocalLlmBlockReason = 'downloading' | 'not_ready';

export interface LocalLlmAvailability {
  canSummarize: boolean;
  reason?: LocalLlmBlockReason;
  userMessage?: string;
}

export const LOCAL_LLM_DOWNLOAD_IN_PROGRESS_MESSAGE =
  'The Gemma 4 E2B model is still downloading. Wait until the download finishes, then try summarizing again. Open Settings → Summarization to check progress.';

export const LOCAL_LLM_MODEL_NOT_READY_MESSAGE =
  'The on-device model is not downloaded yet. Open Settings → Summarization to download Gemma 4 E2B (~3.5 GB), then try again.';

/**
 * Reconciles Zustand download flags with the on-disk GGUF (expo-file-system).
 * Call before gating summarization or after app rehydrate.
 */
export function refreshLocalLlmModelStateFromDisk(): void {
  const ready = LocalModelStorageService.isCompleteModelOnDisk();
  const partial = LocalModelStorageService.isPartialModelOnDisk();
  const activeSession = isLocalLlmDownloadInProgress();

  if (ready) {
    useSettingsStore.setState({
      localLlmModelReady: true,
      localLlmDownloadStatus: 'ready',
      localLlmDownloadProgress: 1,
      localLlmDownloadError: undefined,
    });
    return;
  }

  if (activeSession || partial) {
    const { localLlmDownloadProgress } = useSettingsStore.getState();
    useSettingsStore.setState({
      localLlmModelReady: false,
      localLlmDownloadStatus: 'downloading',
      localLlmDownloadProgress:
        partial && localLlmDownloadProgress == null ? 0 : localLlmDownloadProgress,
    });
    return;
  }

  const { localLlmDownloadStatus } = useSettingsStore.getState();
  if (localLlmDownloadStatus === 'ready' || localLlmDownloadStatus === 'downloading') {
    useSettingsStore.setState({
      localLlmModelReady: false,
      localLlmDownloadStatus: 'idle',
      localLlmDownloadProgress: null,
      localLlmDownloadError: undefined,
    });
  }
}

export function evaluateLocalLlmAvailability(): LocalLlmAvailability {
  refreshLocalLlmModelStateFromDisk();

  if (isLocalGemmaModelDownloaded()) {
    return { canSummarize: true };
  }

  if (isLocalLlmDownloadInProgress()) {
    return {
      canSummarize: false,
      reason: 'downloading',
      userMessage: LOCAL_LLM_DOWNLOAD_IN_PROGRESS_MESSAGE,
    };
  }

  return {
    canSummarize: false,
    reason: 'not_ready',
    userMessage: LOCAL_LLM_MODEL_NOT_READY_MESSAGE,
  };
}

export function isOnDeviceSummarizationMode(mode?: ProcessingMode): boolean {
  return (mode ?? useSettingsStore.getState().summarizationMode) === 'on-device';
}

/**
 * Returns a user-facing blocker message when on-device summarization cannot run, else null.
 */
export function getLocalLlmSummarizationBlocker(mode?: ProcessingMode): string | null {
  if (!isOnDeviceSummarizationMode(mode)) return null;
  const availability = evaluateLocalLlmAvailability();
  return availability.canSummarize ? null : (availability.userMessage ?? LOCAL_LLM_MODEL_NOT_READY_MESSAGE);
}

/**
 * Throws before inference when the GGUF is missing or still downloading.
 */
export function assertLocalLlmReadyForSummarization(): void {
  const availability = evaluateLocalLlmAvailability();
  if (availability.canSummarize) return;

  if (availability.reason === 'downloading') {
    throw new LocalLlamaError('download_in_progress', availability.userMessage!);
  }

  throw new LocalLlamaError('model_not_ready', availability.userMessage!);
}
