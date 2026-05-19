import { Alert } from 'react-native';
import { ProcessingMode } from '@/types';
import { getLocalLlmSummarizationBlocker } from '@/services/summarization';

/**
 * Blocks navigation / processing when on-device mode is selected but the GGUF is not ready.
 * @returns true if summarization may proceed.
 */
export function alertIfLocalLlmNotReady(
  mode?: ProcessingMode,
  title = 'On-device model not ready',
): boolean {
  const message = getLocalLlmSummarizationBlocker(mode);
  if (!message) return true;
  Alert.alert(title, message);
  return false;
}
