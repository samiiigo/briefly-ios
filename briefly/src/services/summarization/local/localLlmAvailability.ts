import { ProcessingMode } from '@/types';
import { useSettingsStore } from '@/context/useSettingsStore';
import { LocalModelStorageService } from '@/services/storage/localModelStorageService';
import {
  supportsLocalLlamaSummarization,
  supportsNativeOnDeviceSummarization,
} from '@/utils/platformCapabilities';
import { isOnDeviceSummarizationModeFor } from './localLlmMode';
import {
  isLocalGemmaModelDownloaded,
  isLocalLlmDownloadInProgress,
} from './gemmaModelDownload';
import {
  applyLocalLlmDownloadState,
  getMirroredLocalLlmDownloadProgress,
  getMirroredLocalLlmDownloadStatus,
  markLocalLlmDownloadReady,
  resetLocalLlmDownloadStateToIdle,
} from './localLlmDownloadState';
import { LocalLlamaError } from './localLlamaErrors';
import {
  LOCAL_LLM_DOWNLOAD_IN_PROGRESS_MESSAGE,
  LOCAL_LLM_MODEL_NOT_READY_MESSAGE,
  LOCAL_LLM_UNSUPPORTED_BUILD_MESSAGE,
} from './localLlmMessages';
export type LocalLlmBlockReason = 'unsupported_build' | 'downloading' | 'not_ready';
export interface LocalLlmAvailability {
  canSummarize: boolean;
  reason?: LocalLlmBlockReason;
  userMessage?: string;
}
export {
  LOCAL_LLM_DOWNLOAD_IN_PROGRESS_MESSAGE,
  LOCAL_LLM_MODEL_NOT_READY_MESSAGE,
  LOCAL_LLM_UNSUPPORTED_BUILD_MESSAGE,
};
/**
 * Reconciles Zustand download flags with the on-disk GGUF (expo-file-system).
 * Call before gating summarization or after app rehydrate.
 */
export function refreshLocalLlmModelStateFromDisk(): void {
  const ready = LocalModelStorageService.isCompleteModelOnDisk();
  const partial = LocalModelStorageService.isPartialModelOnDisk();
  const activeSession = isLocalLlmDownloadInProgress();
  if (ready) {
    markLocalLlmDownloadReady();
    return;
  }
  if (activeSession || partial) {
    const progress = getMirroredLocalLlmDownloadProgress();
    applyLocalLlmDownloadState({
      localLlmModelReady: false,
      localLlmDownloadStatus: 'downloading',
      localLlmDownloadProgress: partial && progress == null ? 0 : progress,
    });
    return;
  }
  const status = getMirroredLocalLlmDownloadStatus();
  if (status === 'ready' || status === 'downloading') {
    resetLocalLlmDownloadStateToIdle();
  }
}
export function evaluateLocalLlmAvailability(): LocalLlmAvailability {
  refreshLocalLlmModelStateFromDisk();
  if (isLocalGemmaModelDownloaded() && supportsLocalLlamaSummarization()) {
    return { canSummarize: true };
  }
  if (supportsNativeOnDeviceSummarization()) {
    return { canSummarize: true };
  }
  if (!supportsLocalLlamaSummarization()) {
    return {
      canSummarize: false,
      reason: 'unsupported_build',
      userMessage: LOCAL_LLM_UNSUPPORTED_BUILD_MESSAGE,
    };
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
  return isOnDeviceSummarizationModeFor(
    mode ?? useSettingsStore.getState().summarizationMode,
  );
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
  if (availability.reason === 'unsupported_build') {
    throw new LocalLlamaError('unsupported_runtime', availability.userMessage!);
  }
  if (availability.reason === 'downloading') {
    throw new LocalLlamaError('download_in_progress', availability.userMessage!);
  }
  throw new LocalLlamaError('model_not_ready', availability.userMessage!);
}
