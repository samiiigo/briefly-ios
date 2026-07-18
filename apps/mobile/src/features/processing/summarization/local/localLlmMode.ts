import { ProcessingMode } from '@/shared/types';
export function isOnDeviceSummarizationModeFor(mode: ProcessingMode): boolean {
  return mode === 'on-device';
}
