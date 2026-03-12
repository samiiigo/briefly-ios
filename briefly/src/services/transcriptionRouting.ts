import { TranscriptionMode } from '../types';

export type TranscriptionRoute = 'on-device' | 'cloud';

export function resolveTranscriptionRoute(mode: TranscriptionMode): TranscriptionRoute {
  if (mode === 'cloud') return 'cloud';
  // Legacy 'on-device-first' from stored recordings maps to on-device
  if ((mode as string) === 'on-device-first') return 'on-device';
  return 'on-device';
}
