import { TranscriptionMode } from '@/types';
import { normalizeTranscriptionMode } from '@/utils/processing/transcriptionMode';

export type TranscriptionRoute = 'cloud' | 'local';

export function resolveTranscriptionRoute(mode: TranscriptionMode): TranscriptionRoute {
  return normalizeTranscriptionMode(mode);
}
