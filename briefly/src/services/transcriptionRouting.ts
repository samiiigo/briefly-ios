import { TranscriptionMode } from '../types';

export type TranscriptionRoute = 'on-device' | 'cloud' | 'on-device-first';

export function resolveTranscriptionRoute(mode: TranscriptionMode): TranscriptionRoute {
  if (mode === 'cloud') return 'cloud';
  if (mode === 'on-device') return 'on-device';
  return 'on-device-first';
}
