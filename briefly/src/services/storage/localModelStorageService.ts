/**
 * LocalModelStorageService
 *
 * Physical on-disk storage for the on-device Gemma GGUF (expo-file-system).
 * Model download state lives in gemmaModelDownload.
 */
import { Directory, File, Paths } from 'expo-file-system';
import {
  LOCAL_GEMMA_MIN_MODEL_BYTES,
  LOCAL_GEMMA_MODEL_FILENAME,
} from '@/services/summarization/local/localModelConfig';
import { logger } from '@/utils/logging/logger';
function getModelFile(): File {
  return new File(Paths.document, 'models', LOCAL_GEMMA_MODEL_FILENAME);
}
export const LocalModelStorageService = {
  ensureModelsDirectory(): void {
    const modelsDir = new Directory(Paths.document, 'models');
    if (!modelsDir.exists) {
      modelsDir.create({ intermediates: true });
    }
  },
  getModelUri(): string {
    return getModelFile().uri;
  },
  isCompleteModelOnDisk(): boolean {
    const file = getModelFile();
    return file.exists && (file.size ?? 0) >= LOCAL_GEMMA_MIN_MODEL_BYTES;
  },
  isPartialModelOnDisk(): boolean {
    const file = getModelFile();
    if (!file.exists) return false;
    const size = file.size ?? 0;
    return size > 0 && size < LOCAL_GEMMA_MIN_MODEL_BYTES;
  },
  /**
   * Deletes the GGUF from app documents. Returns true when a file was removed.
   */
  deleteModelFile(): boolean {
    const file = getModelFile();
    if (!file.exists) return false;
    file.delete();
    logger.info('StorageService', 'Local Gemma model file deleted', { uri: file.uri });
    return true;
  },
};
