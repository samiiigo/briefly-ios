import { useCallback, useState } from 'react';
import {
  getProviderTitle,
  getApiKeyPlaceholder,
  isValidApiKeyFormat,
  detectCloudProviderFromKey,
} from '@/utils/providers/cloudProvider';
import { useCloudApiKeySettingsSlice } from './settingsStoreSlices';
export function useCloudApiKeySettings() {
  const { cloudProvider, setCloudProvider, setProviderApiKey, getActiveApiKey } =
    useCloudApiKeySettingsSlice();
  const [apiKeyInput, setApiKeyInput] = useState(getActiveApiKey());
  const isValidFormat = isValidApiKeyFormat(apiKeyInput, cloudProvider);
  const handleApiKeyChange = useCallback(
    (value: string) => {
      setApiKeyInput(value);
      const detected = detectCloudProviderFromKey(value);
      const provider = detected ?? cloudProvider;
      if (detected && detected !== cloudProvider) setCloudProvider(detected);
      setProviderApiKey(provider, value);
    },
    [cloudProvider, setCloudProvider, setProviderApiKey],
  );
  const clearApiKey = useCallback(() => {
    setApiKeyInput('');
    setProviderApiKey(cloudProvider, '');
  }, [cloudProvider, setProviderApiKey]);
  const commitApiKeyOnBlur = useCallback(() => {
    setProviderApiKey(cloudProvider, apiKeyInput);
  }, [apiKeyInput, cloudProvider, setProviderApiKey]);
  return {
    cloudProvider,
    apiKeyInput,
    isValidFormat,
    handleApiKeyChange,
    clearApiKey,
    commitApiKeyOnBlur,
    getApiKeyPlaceholder,
    getProviderTitle,
  };
}
