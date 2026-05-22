import { ProcessingMode } from '@/types';
import {
  supportsLocalLlamaSummarization,
  supportsNativeOnDeviceSummarization,
} from '@/utils/platformCapabilities';
import { useSummarizationModeSlice } from '@/hooks/settings/settingsStoreSlices';
import { useCloudApiKeySettings } from '@/hooks/settings/useCloudApiKeySettings';
import { useLocalLlmModelSettings } from '@/hooks/settings/useLocalLlmModelSettings';
export const PROCESSING_MODE_OPTIONS: ProcessingMode[] = [
  'cloud-shared-openrouter',
  'cloud-user-key',
  'on-device',
];
export function useProcessingModeSettings() {
  const { summarizationMode, setSummarizationMode } = useSummarizationModeSlice();
  const cloudApiKey = useCloudApiKeySettings();
  const localLlm = useLocalLlmModelSettings();
  const canRunLocalLlama = supportsLocalLlamaSummarization();
  const canUseNativeExtractive = supportsNativeOnDeviceSummarization();
  const canUseOnDeviceSummarization = canRunLocalLlama || canUseNativeExtractive;
  const showUnsupportedBuild = !canUseOnDeviceSummarization;
  const isCloudUserKey =
    summarizationMode === 'cloud-user-key' || summarizationMode === 'cloud';
  return {
    summarizationMode,
    setSummarizationMode,
    isCloudUserKey,
    canRunLocalLlama,
    canUseNativeExtractive,
    canUseOnDeviceSummarization,
    showUnsupportedBuild,
    ...cloudApiKey,
    ...localLlm,
  };
}
