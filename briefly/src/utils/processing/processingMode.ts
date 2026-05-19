import { ProcessingMode } from '@/types';

export function processingModeTitle(mode: ProcessingMode): string {
  if (mode === 'on-device') return 'Local';
  if (mode === 'cloud-shared-openrouter') return 'Cloud';
  if (mode === 'cloud-user-key' || mode === 'cloud') return 'Your API key';
  return 'Local';
}

export function processingModeDescription(mode: ProcessingMode): string {
  if (mode === 'on-device') {
    return 'On-device summaries; currently implementing Apple Intelligence, or use Gemma for the AI. No internet required.';
  }
  if (mode === 'cloud-shared-openrouter') {
    return 'Uses Briefly’s cloud AI service for rich summaries with zero data retention.';
  }
  return 'Uses your API key for OpenAI, Google Gemini, or OpenRouter. Zero Data Retention (ZDR) policy applies.';
}
