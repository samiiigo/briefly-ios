import { Directory, File, Paths } from 'expo-file-system';
import { logger } from '@/utils/logging/logger';

export type ClearAppCacheResult = {
  deletedCount: number;
  freedBytes: number;
};

function entryByteSize(entry: File | Directory): number {
  if (entry instanceof Directory) {
    if (!entry.exists) return 0;
    return entry.list().reduce((sum, child) => sum + entryByteSize(child), 0);
  }
  return entry.exists ? (entry.size ?? 0) : 0;
}

function deleteCacheEntry(entry: File | Directory): void {
  if (!entry.exists) return;
  entry.delete();
}

/**
 * Removes temporary files under the app cache directory (export JSON, repaired
 * WAV copies for upload, PDFs, document-picker copies). Does not touch
 * recordings, transcripts, or on-device models in the documents directory.
 */
export function clearAppCache(): ClearAppCacheResult {
  const cache = Paths.cache;
  if (!cache.exists) {
    return { deletedCount: 0, freedBytes: 0 };
  }

  let deletedCount = 0;
  let freedBytes = 0;

  for (const entry of cache.list()) {
    freedBytes += entryByteSize(entry);
    deleteCacheEntry(entry);
    deletedCount += 1;
  }

  logger.info('Cache', 'App cache cleared', { deletedCount, freedBytes });
  return { deletedCount, freedBytes };
}
