import * as SecureStore from 'expo-secure-store';
import { CloudProvider } from '@/types';
import { validateProviderApiKey } from './inputSchemas';

const SECURE_PREFIX = 'briefly.apikey.';

const PROVIDERS: CloudProvider[] = ['openrouter', 'openai', 'gemini'];

function secureKey(provider: CloudProvider): string {
  return `${SECURE_PREFIX}${provider}`;
}

export interface StoredProviderApiKeys {
  openrouterApiKey: string;
  openaiApiKey: string;
  geminiApiKey: string;
}

/**
 * Loads user BYOK keys from the OS secure enclave (Keychain / Keystore).
 */
export async function loadProviderApiKeysFromSecureStore(): Promise<StoredProviderApiKeys> {
  const entries = await Promise.all(
    PROVIDERS.map(async (provider) => {
      const value = await SecureStore.getItemAsync(secureKey(provider));
      return [provider, value ?? ''] as const;
    })
  );

  return {
    openrouterApiKey: entries.find(([p]) => p === 'openrouter')?.[1] ?? '',
    openaiApiKey: entries.find(([p]) => p === 'openai')?.[1] ?? '',
    geminiApiKey: entries.find(([p]) => p === 'gemini')?.[1] ?? '',
  };
}

export async function saveProviderApiKey(provider: CloudProvider, rawKey: string): Promise<void> {
  const key = validateProviderApiKey(rawKey, provider);
  if (!key) {
    await SecureStore.deleteItemAsync(secureKey(provider));
    return;
  }
  await SecureStore.setItemAsync(secureKey(provider), key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function deleteAllProviderApiKeys(): Promise<void> {
  await Promise.all(PROVIDERS.map((p) => SecureStore.deleteItemAsync(secureKey(p))));
}
