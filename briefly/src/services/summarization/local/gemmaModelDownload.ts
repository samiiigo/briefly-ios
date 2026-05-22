import {
  createDownloadResumable,
  getFreeDiskStorageAsync,
} from 'expo-file-system/legacy';
import { LocalModelStorageService } from '@/services/storage/localModelStorageService';
import { logger } from '@/utils/logging/logger';
import {
  LOCAL_GEMMA_MIN_FREE_BYTES,
  LOCAL_GEMMA_MODEL_DOWNLOAD_URL,
} from './localModelConfig';
import { LocalLlamaError } from './localLlamaErrors';
import {
  applyLocalLlmDownloadState,
  markLocalLlmDownloadFailed,
  markLocalLlmDownloadReady,
  getMirroredLocalLlmDownloadStatus,
  markLocalLlmDownloadStarting,
  resetLocalLlmDownloadStateToIdle,
} from './localLlmDownloadState';
export type ModelDownloadProgress = {
  totalBytes: number;
  downloadedBytes: number;
  fraction: number;
};
export function getLocalGemmaModelPath(): string {
  return LocalModelStorageService.getModelUri();
}
export function isLocalGemmaModelDownloaded(): boolean {
  return LocalModelStorageService.isCompleteModelOnDisk();
}
/** True when a partial GGUF is on disk (download interrupted or in progress). */
export function isPartialLocalGemmaModelOnDisk(): boolean {
  return LocalModelStorageService.isPartialModelOnDisk();
}
export function isLocalLlmDownloadInProgress(): boolean {
  if (activeDownload !== null || activeDownloadPromise !== null) return true;
  if (getMirroredLocalLlmDownloadStatus() === 'downloading') return true;
  return isPartialLocalGemmaModelOnDisk();
}
let activeDownload: ReturnType<typeof createDownloadResumable> | null = null;
let activeDownloadPromise: Promise<string> | null = null;
/**
 * Downloads the quantized Gemma GGUF into the app document directory if missing.
 * Progress and status are mirrored on the settings store (idle → downloading → ready).
 */
export async function ensureLocalGemmaModelDownloaded(options?: {
  onProgress?: (progress: ModelDownloadProgress) => void;
  force?: boolean;
}): Promise<string> {
  if (activeDownloadPromise) {
    return activeDownloadPromise;
  }
  const run = async (): Promise<string> => {
    LocalModelStorageService.ensureModelsDirectory();
    const destUri = LocalModelStorageService.getModelUri();
    if (!options?.force && isLocalGemmaModelDownloaded()) {
      markLocalLlmDownloadReady();
      return destUri;
    }
    const freeBytes = await getFreeDiskStorageAsync();
    if (freeBytes < LOCAL_GEMMA_MIN_FREE_BYTES) {
      const err = new LocalLlamaError(
        'oom',
        `Not enough free storage to download the on-device model (need about ${Math.round(LOCAL_GEMMA_MIN_FREE_BYTES / 1_000_000_000)} GB free).`,
      );
      markLocalLlmDownloadFailed(err.message);
      throw err;
    }
    if (options?.force || isPartialLocalGemmaModelOnDisk()) {
      LocalModelStorageService.deleteModelFile();
    }
    markLocalLlmDownloadStarting();
    logger.info('SUMMARY', 'Downloading local Gemma model', {
      url: LOCAL_GEMMA_MODEL_DOWNLOAD_URL,
      dest: destUri,
    });
    const download = createDownloadResumable(
      LOCAL_GEMMA_MODEL_DOWNLOAD_URL,
      destUri,
      {},
      (data) => {
        const total = data.totalBytesExpectedToWrite || 0;
        const written = data.totalBytesWritten || 0;
        const fraction = total > 0 ? Math.min(1, written / total) : 0;
        applyLocalLlmDownloadState({ localLlmDownloadProgress: fraction });
        options?.onProgress?.({
          totalBytes: total,
          downloadedBytes: written,
          fraction,
        });
      },
    );
    activeDownload = download;
    try {
      const result = await download.downloadAsync();
      if (!result?.uri) {
        throw new LocalLlamaError('download', 'Model download did not return a file path.');
      }
      if (!isLocalGemmaModelDownloaded()) {
        throw new LocalLlamaError(
          'download',
          'Download finished but the model file looks incomplete. Try again on a stable connection.',
        );
      }
      markLocalLlmDownloadReady();
      logger.info('SUMMARY', 'Local Gemma model ready', { uri: result.uri });
      return result.uri;
    } catch (error: unknown) {
      const message =
        error instanceof LocalLlamaError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Model download failed.';
      markLocalLlmDownloadFailed(message);
      throw error;
    } finally {
      activeDownload = null;
    }
  };
  activeDownloadPromise = run().finally(() => {
    activeDownloadPromise = null;
  });
  return activeDownloadPromise;
}
export async function cancelLocalGemmaModelDownload(): Promise<void> {
  if (activeDownload) {
    try {
      await activeDownload.pauseAsync();
    } catch {
      // Best-effort cancel
    }
    activeDownload = null;
  }
  LocalModelStorageService.deleteModelFile();
  resetLocalLlmDownloadStateToIdle();
}
/**
 * Removes the on-device model file and resets download state to not downloaded.
 */
export async function deleteLocalGemmaModel(): Promise<void> {
  await cancelLocalGemmaModelDownload();
  LocalModelStorageService.deleteModelFile();
  resetLocalLlmDownloadStateToIdle();
}
