import { ProcessingMode } from '@/types';

export function processingModeTitle(mode: ProcessingMode): string {
  if (mode === 'on-device') return 'Apple Intelligence';
  if (mode === 'cloud-shared-openrouter') return 'Built-in';
  if (mode === 'cloud-user-key' || mode === 'cloud') return 'Your API key';
  return 'Apple Intelligence';
}

export function processingModeDescription(mode: ProcessingMode): string {
  if (mode === 'on-device') {
    return 'Summaries are generated with Apple Intelligence. Fully private, no internet required.';
  }
  if (mode === 'cloud-shared-openrouter') {
    return 'Uses Briefly’s shared AI service for rich summaries with zero data retention.';
  }
  return 'Uses your API key for OpenAI, Google Gemini, or OpenRouter. Zero Data Retention (ZDR) policy applies.';
}
