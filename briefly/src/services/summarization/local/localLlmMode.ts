import { ProcessingMode } from '@/types';
export function isOnDeviceSummarizationModeFor(mode: ProcessingMode): boolean {
  return mode === 'on-device';
}
