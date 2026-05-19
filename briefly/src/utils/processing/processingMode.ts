import { ProcessingMode } from '@/types';

export function processingModeTitle(mode: ProcessingMode): string {
  if (mode === 'on-device') return 'Local';
  if (mode === 'cloud-shared-openrouter') return 'Cloud';
  if (mode === 'cloud-user-key' || mode === 'cloud') return 'Your API key';
  return 'Local';
}

export function processingModeDescription(mode: ProcessingMode): string {
  if (mode === 'on-device') {
    return 'Summaries run fully on your phone with a downloaded Gemma model (~1.6 GB). No API key required; first run downloads the model.';
  }
  if (mode === 'cloud-shared-openrouter') {
    return 'Uses Briefly’s cloud AI service for rich summaries with zero data retention.';
  }
  return 'Uses your API key for OpenAI, Google Gemini, or OpenRouter. Zero Data Retention (ZDR) policy applies.';
}
