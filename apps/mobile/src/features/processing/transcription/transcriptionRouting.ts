import { TranscriptionMode } from '@/shared/types';
import { normalizeTranscriptionMode } from '@/features/processing/utils/transcriptionMode';
export type TranscriptionRoute = 'cloud' | 'local';
export function resolveTranscriptionRoute(mode: TranscriptionMode): TranscriptionRoute {
  return normalizeTranscriptionMode(mode);
}
