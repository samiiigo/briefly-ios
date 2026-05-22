import { copyToDocumentDirectory, deletePath } from '@/utils/fileSystem/pathInfo';
import { logger } from '@/utils/logging/logger';
class AudioFileServiceClass {
  async deleteFile(uri: string): Promise<void> {
    try {
      deletePath(uri);
      logger.info('AUDIO', 'Audio file deleted', { uri });
    } catch (error: any) {
      logger.warn('AUDIO', 'Failed to delete audio file', {
        uri,
        error: error?.message ?? String(error),
      });
    }
  }
  async copyToDocuments(uri: string, filename: string): Promise<string> {
    const dest = copyToDocumentDirectory(uri, filename);
    logger.info('AUDIO', 'Audio file copied to documents', { from: uri, to: dest });
    return dest;
  }
}
export const AudioFileService = new AudioFileServiceClass();
