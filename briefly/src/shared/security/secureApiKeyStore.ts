import * as SecureStore from 'expo-secure-store';
import { CloudProvider } from '@/shared/types';
import { getActiveStorageUserId } from '@/shared/services/storage/storageScope';
import { validateProviderApiKey } from './inputSchemas';

const SECURE_PREFIX = 'briefly.apikey.';
const PROVIDERS: CloudProvider[] = ['openrouter', 'openai', 'gemini'];

function legacySecureKey(provider: CloudProvider): string {
  return `${SECURE_PREFIX}${provider}`;
}

function secureKey(provider: CloudProvider, userId: string): string {
  return `${SECURE_PREFIX}${userId}.${provider}`;
}

export interface StoredProviderApiKeys {
  openrouterApiKey: string;
  openaiApiKey: string;
  geminiApiKey: string;
}

/**
 * Loads user BYOK keys from the OS secure enclave (Keychain / Keystore).
 * Keys are scoped to the active account.
 */
export async function loadProviderApiKeysFromSecureStore(): Promise<StoredProviderApiKeys> {
  const userId = getActiveStorageUserId();
  if (!userId) {
    return { openrouterApiKey: '', openaiApiKey: '', geminiApiKey: '' };
  }
  const entries = await Promise.all(
    PROVIDERS.map(async (provider) => {
      const value = await SecureStore.getItemAsync(secureKey(provider, userId));
      return [provider, value ?? ''] as const;
    }),
  );
  return {
    openrouterApiKey: entries.find(([p]) => p === 'openrouter')?.[1] ?? '',
    openaiApiKey: entries.find(([p]) => p === 'openai')?.[1] ?? '',
    geminiApiKey: entries.find(([p]) => p === 'gemini')?.[1] ?? '',
  };
}

export async function saveProviderApiKey(provider: CloudProvider, rawKey: string): Promise<void> {
  const userId = getActiveStorageUserId();
  if (!userId) {
    throw new Error('Sign in before saving API keys.');
  }
  const key = validateProviderApiKey(rawKey, provider);
  const scoped = secureKey(provider, userId);
  if (!key) {
    await SecureStore.deleteItemAsync(scoped);
    return;
  }
  await SecureStore.setItemAsync(scoped, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function deleteAllProviderApiKeys(): Promise<void> {
  const userId = getActiveStorageUserId();
  if (!userId) return;
  await Promise.all(PROVIDERS.map((p) => SecureStore.deleteItemAsync(secureKey(p, userId))));
}

/** Copy pre-account SecureStore keys into the first signed-in account once. */
export async function migrateLegacySecureApiKeysToUser(userId: string): Promise<void> {
  await Promise.all(
    PROVIDERS.map(async (provider) => {
      const scoped = secureKey(provider, userId);
      const existing = await SecureStore.getItemAsync(scoped);
      if (existing) return;
      const legacy = await SecureStore.getItemAsync(legacySecureKey(provider));
      if (!legacy) return;
      await SecureStore.setItemAsync(scoped, legacy, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }),
  );
}
