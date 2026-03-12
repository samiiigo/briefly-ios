import { ProcessingMode } from '../types';

export function processingModeTitle(mode: ProcessingMode): string {
  if (mode === 'on-device') return 'On-Device';
  return 'Cloud AI';
}

export function processingModeDescription(mode: ProcessingMode): string {
  if (mode === 'on-device') {
    return 'Summaries are generated locally using Apple Intelligence. Fully private, no internet required.';
  }
  return 'Uses your configured API key (OpenAI, Gemini, Claude, etc.) for richer summaries. Zero Data Retention (ZDR) policy applies.';
}
