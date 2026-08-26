import { ProcessingMode } from '@briefly/types';
export function isOnDeviceSummarizationModeFor(mode: ProcessingMode): boolean {
  return mode === 'on-device';
}
