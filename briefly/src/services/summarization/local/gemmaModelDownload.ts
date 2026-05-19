import { Directory, File, Paths } from 'expo-file-system';
import {
  createDownloadResumable,
  getFreeDiskStorageAsync,
} from 'expo-file-system/legacy';
import { useSettingsStore } from '@/context/useSettingsStore';
import { logger } from '@/utils/logging/logger';
import {
  LOCAL_GEMMA_MIN_FREE_BYTES,
  LOCAL_GEMMA_MIN_MODEL_BYTES,
  LOCAL_GEMMA_MODEL_DOWNLOAD_URL,
  LOCAL_GEMMA_MODEL_FILENAME,
} from './localModelConfig';
import { LocalLlamaError } from './localLlamaErrors';

export type ModelDownloadProgress = {
  totalBytes: number;
  downloadedBytes: number;
  fraction: number;
};

function getModelFile(): File {
  return new File(Paths.document, 'models', LOCAL_GEMMA_MODEL_FILENAME);
}

function ensureModelsDirectory(): void {
  const modelsDir = new Directory(Paths.document, 'models');
  if (!modelsDir.exists) {
    modelsDir.create({ intermediates: true });
  }
}

export function getLocalGemmaModelPath(): string {
  return getModelFile().uri;
}

export function isLocalGemmaModelDownloaded(): boolean {
  const file = getModelFile();
  return file.exists && (file.size ?? 0) >= LOCAL_GEMMA_MIN_MODEL_BYTES;
}

/** True when a partial GGUF is on disk (download interrupted or in progress). */
export function isPartialLocalGemmaModelOnDisk(): boolean {
  const file = getModelFile();
  if (!file.exists) return false;
  const size = file.size ?? 0;
  return size > 0 && size < LOCAL_GEMMA_MIN_MODEL_BYTES;
}

export function isLocalLlmDownloadInProgress(): boolean {
  if (activeDownload !== null || activeDownloadPromise !== null) return true;
  const { localLlmDownloadStatus } = useSettingsStore.getState();
  if (localLlmDownloadStatus === 'downloading') return true;
  return isPartialLocalGemmaModelOnDisk();
}

function syncDownloadState(
  patch: Partial<{
    localLlmModelReady: boolean;
    localLlmDownloadProgress: number | null;
    localLlmDownloadStatus: 'idle' | 'downloading' | 'ready' | 'error';
    localLlmDownloadError: string | undefined;
  }>,
): void {
  useSettingsStore.setState(patch);
}

let activeDownload: ReturnType<typeof createDownloadResumable> | null = null;
let activeDownloadPromise: Promise<string> | null = null;

/**
 * Downloads the quantized Gemma GGUF into the app document directory if missing.
 * Reports progress via the settings store and optional callback.
 */
export async function ensureLocalGemmaModelDownloaded(options?: {
  onProgress?: (progress: ModelDownloadProgress) => void;
  force?: boolean;
}): Promise<string> {
  if (activeDownloadPromise) {
    return activeDownloadPromise;
  }

  const run = async (): Promise<string> => {
    ensureModelsDirectory();
    const dest = getModelFile();

    if (!options?.force && isLocalGemmaModelDownloaded()) {
      syncDownloadState({
        localLlmModelReady: true,
        localLlmDownloadProgress: 1,
        localLlmDownloadStatus: 'ready',
        localLlmDownloadError: undefined,
      });
      return dest.uri;
    }

    const freeBytes = await getFreeDiskStorageAsync();
    if (freeBytes < LOCAL_GEMMA_MIN_FREE_BYTES) {
      const err = new LocalLlamaError(
        'oom',
        `Not enough free storage to download the on-device model (need about ${Math.round(LOCAL_GEMMA_MIN_FREE_BYTES / 1_000_000_000)} GB free).`,
      );
      syncDownloadState({
        localLlmModelReady: false,
        localLlmDownloadProgress: null,
        localLlmDownloadStatus: 'error',
        localLlmDownloadError: err.message,
      });
      throw err;
    }

    if (dest.exists && (options?.force || isPartialLocalGemmaModelOnDisk())) {
      dest.delete();
    }

    syncDownloadState({
      localLlmModelReady: false,
      localLlmDownloadProgress: 0,
      localLlmDownloadStatus: 'downloading',
      localLlmDownloadError: undefined,
    });

    logger.info('SUMMARY', 'Downloading local Gemma model', {
      url: LOCAL_GEMMA_MODEL_DOWNLOAD_URL,
      dest: dest.uri,
    });

    const download = createDownloadResumable(
      LOCAL_GEMMA_MODEL_DOWNLOAD_URL,
      dest.uri,
      {},
      (data) => {
        const total = data.totalBytesExpectedToWrite || 0;
        const written = data.totalBytesWritten || 0;
        const fraction = total > 0 ? Math.min(1, written / total) : 0;
        syncDownloadState({ localLlmDownloadProgress: fraction });
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

      syncDownloadState({
        localLlmModelReady: true,
        localLlmDownloadProgress: 1,
        localLlmDownloadStatus: 'ready',
        localLlmDownloadError: undefined,
      });

      logger.info('SUMMARY', 'Local Gemma model ready', { uri: result.uri });
      return result.uri;
    } catch (error: unknown) {
      const message =
        error instanceof LocalLlamaError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Model download failed.';
      syncDownloadState({
        localLlmModelReady: false,
        localLlmDownloadProgress: null,
        localLlmDownloadStatus: 'error',
        localLlmDownloadError: message,
      });
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
  if (!activeDownload) return;
  try {
    await activeDownload.pauseAsync();
  } catch {
    // Best-effort cancel
  }
  activeDownload = null;
  syncDownloadState({
    localLlmModelReady: false,
    localLlmDownloadStatus: 'idle',
    localLlmDownloadProgress: null,
  });
}
