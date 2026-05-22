/**
 * LocalFileTranscriptionProvider — on-device file transcription placeholder
 *
 * Substitutes for TranscriptionProvider but fails fast with a stable, user-facing
 * error until batch on-device transcription is implemented. Callers can catch
 * this without instanceof checks on cloud-specific types.
 */
import { TranscriptSegment, TranscriptionMode } from '@/types';
import { logger } from '@/utils/logging/logger';
import { TranscriptionProvider } from './transcriptionProvider';
const LOCAL_FILE_TRANSCRIPTION_MESSAGE =
  'On-device transcription from saved audio is not available on this device. Try Cloud mode in Settings.';
export class LocalFileTranscriptionProvider implements TranscriptionProvider {
  readonly name = 'local-on-device';
  async transcribe(
    audioUri: string,
    _onSegment?: (segment: TranscriptSegment) => void,
    _mode?: TranscriptionMode,
  ): Promise<TranscriptSegment[]> {
    logger.warn(
      'TranscriptionService',
      'On-device file transcription unavailable; caller may fall back to cloud',
      { audioUri },
    );
    throw new Error(LOCAL_FILE_TRANSCRIPTION_MESSAGE);
  }
}
