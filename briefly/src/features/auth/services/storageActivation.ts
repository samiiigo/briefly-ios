import {
  migrateLegacyStorageToUser,
  setActiveStorageUserId,
} from '@/shared/services/storage/storageScope';
import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import { useUserFolderStore } from '@/features/library/state/useUserFolderStore';
import { useSearchStore } from '@/features/search/state/useSearchStore';
import { useSettingsStore } from '@/features/settings/state/useSettingsStore';

let activeScopeUserId: string | null = null;

export async function activateStorageScopeForUser(userId: string): Promise<void> {
  if (activeScopeUserId === userId) return;

  if (activeScopeUserId) {
    resetInMemoryStores();
  }

  setActiveStorageUserId(userId);
  await migrateLegacyStorageToUser(userId);
  activeScopeUserId = userId;

  await Promise.all([
    rehydratePersistedStore(useSettingsStore),
    rehydratePersistedStore(useSearchStore),
    useRecordingStore.getState().loadRecordings(),
    useUserFolderStore.getState().loadFolders(),
  ]);
}

export function deactivateStorageScope(): void {
  activeScopeUserId = null;
  setActiveStorageUserId(null);
  resetInMemoryStores();
}

function resetInMemoryStores(): void {
  useRecordingStore.setState({ recordings: [], hasLoaded: false, activeRecordingId: null, liveTranscript: '', isLoading: false });
  useUserFolderStore.setState({ folders: [], hasLoaded: false });
  useSearchStore.setState({ recentQueries: [] });
}

async function rehydratePersistedStore(
  store: typeof useSettingsStore | typeof useSearchStore,
): Promise<void> {
  if (!store.persist) return;
  await store.persist.rehydrate();
}
