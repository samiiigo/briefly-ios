/**
 * AudioFileService (SRP)
 *
 * Single responsibility: audio file operations (delete, copy).
 * Separated from recording/playback concerns.
 */

import { deleteAsync, copyAsync, documentDirectory } from 'expo-file-system/legacy';
import { logger } from '../../utils/logger';

class AudioFileServiceClass {
  async deleteFile(uri: string): Promise<void> {
    try {
      await deleteAsync(uri, { idempotent: true });
      logger.info('AUDIO', 'Audio file deleted', { uri });
    } catch (error: any) {
      logger.warn('AUDIO', 'Failed to delete audio file', {
        uri,
        error: error?.message ?? String(error),
      });
    }
  }

  async copyToDocuments(uri: string, filename: string): Promise<string> {
    const dest = documentDirectory + filename;
    await copyAsync({ from: uri, to: dest });
    logger.info('AUDIO', 'Audio file copied to documents', { from: uri, to: dest });
    return dest;
  }
}

export const AudioFileService = new AudioFileServiceClass();
