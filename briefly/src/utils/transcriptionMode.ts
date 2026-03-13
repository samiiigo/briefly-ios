import { TranscriptionMode } from '../types';

export function transcriptionModeTitle(mode: TranscriptionMode): string {
  if (mode === 'on-device') return 'Live (AssemblyAI)';
  if (mode === 'cloud') return 'Post-recording (AssemblyAI)';
  return 'Live (AssemblyAI)'; // fallback for legacy data
}

export function transcriptionModeDescription(mode: TranscriptionMode): string {
  if (mode === 'on-device') {
    return 'Streams microphone audio live to AssemblyAI for real-time transcript updates while recording.';
  }
  if (mode === 'cloud') {
    return 'Records first, then transcribes with AssemblyAI after you stop recording.';
  }
  return 'Streams microphone audio live to AssemblyAI for real-time transcript updates while recording.'; // fallback for legacy data
}

export function transcriptionModeBadge(mode: TranscriptionMode): string {
  if (mode === 'on-device') return 'LIVE';
  if (mode === 'cloud') return 'POST';
  return 'LIVE'; // fallback for legacy data
}
