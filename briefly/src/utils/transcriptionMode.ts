import { TranscriptionMode } from '../types';

export function transcriptionModeTitle(mode: TranscriptionMode): string {
  if (mode === 'on-device') return 'On-device';
  if (mode === 'cloud') return 'Cloud';
  return 'On-device'; // fallback for legacy data
}

export function transcriptionModeDescription(mode: TranscriptionMode): string {
  if (mode === 'on-device') {
    return 'Best privacy and low latency. Uses local processing and keeps audio on-device.';
  }
  if (mode === 'cloud') {
    return 'Potentially better accuracy and language coverage. Requires internet and sends audio to your AI provider.';
  }
  return 'Best privacy and low latency. Uses local processing and keeps audio on-device.'; // fallback for legacy data
}

export function transcriptionModeBadge(mode: TranscriptionMode): string {
  if (mode === 'on-device') return 'ON-DEVICE';
  if (mode === 'cloud') return 'CLOUD';
  return 'ON-DEVICE'; // fallback for legacy data
}
