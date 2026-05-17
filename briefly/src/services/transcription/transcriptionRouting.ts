import { TranscriptionMode } from '@/types';
import { normalizeTranscriptionMode } from '@/utils/processing/transcriptionMode';

export type TranscriptionRoute = 'live-assemblyai' | 'post-assemblyai' | 'local-on-device';

export function resolveTranscriptionRoute(mode: TranscriptionMode): TranscriptionRoute {
  return normalizeTranscriptionMode(mode);
}
