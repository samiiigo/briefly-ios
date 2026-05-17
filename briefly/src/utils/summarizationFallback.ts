import { ProcessingMode } from '@/types';

export interface SummarizationFallbackAction {
  mode: ProcessingMode;
  buttonLabel: string;
}

export function isUserKeySummarizationMode(mode: ProcessingMode): boolean {
  return mode === 'cloud-user-key' || mode === 'cloud';
}

/**
 * Next summarization provider to try after a failure:
 * custom API key → default shared cloud → on-device.
 */
export function getNextSummarizationFallback(
  lastFailedMode: ProcessingMode,
  attemptedModes: readonly ProcessingMode[],
): SummarizationFallbackAction | null {
  const tried = new Set<ProcessingMode>(attemptedModes);

  if (isUserKeySummarizationMode(lastFailedMode) && !tried.has('cloud-shared-openrouter')) {
    return {
      mode: 'cloud-shared-openrouter',
      buttonLabel: 'Try with Default Cloud AI',
    };
  }

  if (lastFailedMode !== 'on-device' && !tried.has('on-device')) {
    return {
      mode: 'on-device',
      buttonLabel: 'Try with On-device AI',
    };
  }

  return null;
}

export function summarizationRetryProgressLabel(mode: ProcessingMode): string {
  if (mode === 'cloud-shared-openrouter') return 'Trying Default Cloud AI…';
  if (mode === 'on-device') return 'Trying On-device AI…';
  return 'Retrying summary…';
}
