import AsyncStorage from '@react-native-async-storage/async-storage';

export const LEGACY_STORAGE_KEYS = {
  recordings: '@briefly/recordings',
  userFolders: '@briefly/user_folders',
  settings: '@briefly/settings',
  searchRecent: '@briefly/search-recent',
} as const;

export type ScopedStorageBaseKey =
  | typeof LEGACY_STORAGE_KEYS.recordings
  | typeof LEGACY_STORAGE_KEYS.userFolders
  | typeof LEGACY_STORAGE_KEYS.settings
  | typeof LEGACY_STORAGE_KEYS.searchRecent;

let activeUserId: string | null = null;

export function setActiveStorageUserId(userId: string | null): void {
  activeUserId = userId;
}

export function getActiveStorageUserId(): string | null {
  return activeUserId;
}

export function scopedStorageKey(baseKey: string, userId: string | null = activeUserId): string {
  if (!userId) {
    throw new Error('Storage scope user id is required.');
  }
  return `${baseKey}:${userId}`;
}

export function createScopedJsonStorage() {
  return {
    getItem: async (name: string): Promise<string | null> => {
      const key = scopedStorageKey(name);
      return AsyncStorage.getItem(key);
    },
    setItem: async (name: string, value: string): Promise<void> => {
      const key = scopedStorageKey(name);
      await AsyncStorage.setItem(key, value);
    },
    removeItem: async (name: string): Promise<void> => {
      const key = scopedStorageKey(name);
      await AsyncStorage.removeItem(key);
    },
  };
}

export async function migrateLegacyStorageToUser(userId: string): Promise<void> {
  for (const legacyKey of Object.values(LEGACY_STORAGE_KEYS)) {
    const scopedKey = scopedStorageKey(legacyKey, userId);
    const [legacyValue, scopedValue] = await Promise.all([
      AsyncStorage.getItem(legacyKey),
      AsyncStorage.getItem(scopedKey),
    ]);
    if (legacyValue && !scopedValue) {
      await AsyncStorage.setItem(scopedKey, legacyValue);
      await AsyncStorage.removeItem(legacyKey);
    }
  }
}

export async function clearScopedStorageForUser(userId: string): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const suffix = `:${userId}`;
  const toRemove = keys.filter((key) => key.endsWith(suffix));
  if (toRemove.length > 0) {
    await AsyncStorage.multiRemove(toRemove);
  }
}
