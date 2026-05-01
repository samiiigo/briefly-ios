import { TranscriptionMode } from '../types';

export function normalizeTranscriptionMode(mode: string | undefined | null): TranscriptionMode {
  if (mode === 'live-assemblyai' || mode === 'post-assemblyai' || mode === 'local-on-device') {
    return mode;
  }
  // Legacy values from older builds.
  if (mode === 'on-device') return 'live-assemblyai';
  if (mode === 'cloud') return 'post-assemblyai';
  if (mode === 'on-device-first') return 'local-on-device';
  return 'live-assemblyai';
}

export function transcriptionModeTitle(mode: TranscriptionMode | string): string {
  const normalized = normalizeTranscriptionMode(mode);
  if (normalized === 'live-assemblyai') return 'Live (AssemblyAI)';
  if (normalized === 'post-assemblyai') return 'Post-recording (AssemblyAI)';
  return 'Local (on-device)';
}

export function transcriptionModeDescription(mode: TranscriptionMode | string): string {
  const normalized = normalizeTranscriptionMode(mode);
  if (normalized === 'live-assemblyai') {
    return 'Streams microphone audio to AssemblyAI for real-time transcript updates while recording.';
  }
  if (normalized === 'post-assemblyai') {
    return 'Records first, then transcribes with AssemblyAI after you stop recording.';
  }
  return 'Uses native on-device speech recognition so audio stays on your device.';
}

export function transcriptionModeBadge(mode: TranscriptionMode | string): string {
  const normalized = normalizeTranscriptionMode(mode);
  if (normalized === 'live-assemblyai') return 'LIVE';
  if (normalized === 'post-assemblyai') return 'POST';
  return 'LOCAL';
}
