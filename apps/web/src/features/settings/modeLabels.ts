import type { CloudProvider, ProcessingMode, TranscriptionMode } from '@briefly/types';

export function processingModeTitle(mode: ProcessingMode): string {
  if (mode === 'cloud-shared-openrouter') return 'Briefly Cloud';
  if (mode === 'cloud-user-key' || mode === 'cloud') return 'Your API key';
  return 'Briefly Cloud';
}

export function processingModeDescription(mode: ProcessingMode): string {
  if (mode === 'cloud-shared-openrouter') {
    return 'Uses Briefly’s cloud AI service for rich summaries with zero data retention.';
  }
  return 'Uses your own API key for OpenAI, Google Gemini, or OpenRouter.';
}

export function transcriptionModeTitle(mode: TranscriptionMode | string): string {
  return mode === 'local' ? 'Local' : 'Cloud';
}

export function transcriptionModeDescription(mode: TranscriptionMode | string): string {
  if (mode === 'local') {
    return 'On-device transcription is not available on web.';
  }
  return 'Transcribes your recording in the cloud after you stop, then summarizes.';
}

export const WEB_SUMMARIZATION_MODES: ProcessingMode[] = [
  'cloud-shared-openrouter',
  'cloud-user-key',
];

export const WEB_TRANSCRIPTION_MODES: TranscriptionMode[] = ['cloud'];

export const WEB_CLOUD_PROVIDERS: CloudProvider[] = ['openrouter', 'openai', 'gemini'];
