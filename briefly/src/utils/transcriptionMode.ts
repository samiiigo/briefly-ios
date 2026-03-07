import { TranscriptionMode } from '../types';

export function transcriptionModeTitle(mode: TranscriptionMode): string {
  if (mode === 'on-device') return 'Always on-device';
  if (mode === 'cloud') return 'Always cloud';
  return 'On-device first, then cloud fallback';
}

export function transcriptionModeDescription(mode: TranscriptionMode): string {
  if (mode === 'on-device') {
    return 'Best privacy and low latency. Uses local processing and keeps audio on-device.';
  }
  if (mode === 'cloud') {
    return 'Potentially better accuracy and language coverage. Requires internet and sends audio to your AI provider.';
  }
  return 'Tries on-device first for privacy/speed, then falls back to cloud if local transcription is unavailable or fails.';
}

export function transcriptionModeBadge(mode: TranscriptionMode): string {
  if (mode === 'on-device') return 'ON-DEVICE';
  if (mode === 'cloud') return 'CLOUD';
  return 'ON-DEVICE FIRST';
}
