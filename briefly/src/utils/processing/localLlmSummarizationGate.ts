import { Alert } from 'react-native';
import { ProcessingMode } from '@/types';
import {
  evaluateLocalLlmAvailability,
  getLocalLlmSummarizationBlocker,
  isOnDeviceSummarizationMode,
} from '@/services/summarization';

function blockAlertTitle(mode?: ProcessingMode): string {
  if (!isOnDeviceSummarizationMode(mode)) return 'On-device model not ready';
  const { reason } = evaluateLocalLlmAvailability();
  if (reason === 'unsupported_build') return 'Development build required';
  if (reason === 'downloading') return 'Model download in progress';
  return 'On-device model not ready';
}

/**
 * Blocks navigation / processing when on-device mode is selected but the GGUF is not ready.
 * @returns true if summarization may proceed.
 */
export function alertIfLocalLlmNotReady(
  mode?: ProcessingMode,
  title?: string,
): boolean {
  const message = getLocalLlmSummarizationBlocker(mode);
  if (!message) return true;
  Alert.alert(title ?? blockAlertTitle(mode), message);
  return false;
}

/**
 * Immediately blocks on-device summarization (download in progress or model missing).
 * Shows an alert and returns true when the caller must abort — do not queue processing.
 */
export function interceptOnDeviceSummarizationIfBlocked(mode?: ProcessingMode): boolean {
  const message = getLocalLlmSummarizationBlocker(mode);
  if (!message) return false;
  Alert.alert(blockAlertTitle(mode), message);
  return true;
}
