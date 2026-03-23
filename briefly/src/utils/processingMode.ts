import { ProcessingMode } from '../types';

export function processingModeTitle(mode: ProcessingMode): string {
  if (mode === 'on-device') return 'On-device (Apple Intelligence)';
  if (mode === 'cloud-shared-openrouter') return 'Cloud summarization (default)';
  if (mode === 'cloud-user-key' || mode === 'cloud') return 'Cloud (use your own key)';
  return 'On-device (Apple Intelligence)';
}

export function processingModeDescription(mode: ProcessingMode): string {
  if (mode === 'on-device') {
    return 'Summaries are generated locally using Apple Intelligence. Fully private, no internet required.';
  }
  if (mode === 'cloud-shared-openrouter') {
    return 'Uses a shared OpenRouter key configured by Briefly for rich cloud summaries with zero data retention.';
  }
  return 'Uses your API key for OpenAI, Google Gemini, or OpenRouter. Zero Data Retention (ZDR) policy applies.';
}
