import { ProcessingMode } from '@briefly/types';
import {
  supportsLocalLlamaSummarization,
  supportsNativeOnDeviceSummarization,
} from '@/lib/utils/platformCapabilities';
import { useSummarizationModeSlice } from '@/features/settings/hooks/settingsStoreSlices';
import { useCloudApiKeySettings } from '@/features/settings/hooks/useCloudApiKeySettings';
import { useLocalLlmModelSettings } from '@/features/settings/hooks/useLocalLlmModelSettings';
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
  const isCloudUserKey = summarizationMode === 'cloud-user-key' || summarizationMode === 'cloud';
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
