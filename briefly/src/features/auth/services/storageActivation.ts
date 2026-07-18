import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  migrateLegacyStorageToUser,
  scopedStorageKey,
  setActiveStorageUserId,
} from '@/shared/services/storage/storageScope';
import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import { useUserFolderStore } from '@/features/library/state/useUserFolderStore';
import { useFolderListLayoutStore } from '@/features/library/state/useFolderListLayoutStore';
import { useSearchStore } from '@/features/search/state/useSearchStore';
import { useSettingsStore } from '@/features/settings/state/useSettingsStore';
import { RecordingStorageService } from '@/shared/services/storage/recordingStorageService';
import { FolderStorageService } from '@/shared/services/storage/folderStorageService';
import {
  mergeFoldersByUpdatedAt,
  mergeRecordingsByUpdatedAt,
  pullRemoteFolders,
  pullRemoteRecordings,
  pullRemoteSettingsPayload,
  pushAllFolders,
  pushAllRecordings,
  pushSettingsPayload,
  upsertUserProfile,
} from '@/features/auth/services/accountSync';
import type { AuthUserProfile } from '@/features/auth/types/auth.types';
import { migrateLegacySecureApiKeysToUser } from '@/shared/security/secureApiKeyStore';
import { logger } from '@/shared/utils/logging/logger';

const RECORDINGS_BASE_KEY = '@briefly/recordings';
const USER_FOLDERS_BASE_KEY = '@briefly/user_folders';

let activeScopeUserId: string | null = null;

export async function activateStorageScopeForUser(
  user: AuthUserProfile | string,
): Promise<void> {
  const userId = typeof user === 'string' ? user : user.id;
  const profile = typeof user === 'string' ? null : user;

  if (activeScopeUserId === userId) {
    if (profile) {
      void upsertUserProfile(profile);
    }
    return;
  }

  if (activeScopeUserId) {
    resetInMemoryStores();
  }

  setActiveStorageUserId(userId);
  await migrateLegacyStorageToUser(userId);
  await migrateLegacySecureApiKeysToUser(userId);
  activeScopeUserId = userId;

  await Promise.all([
    rehydratePersistedStore(useSettingsStore),
    rehydratePersistedStore(useSearchStore),
  ]);

  await syncAccountLibrary(userId);

  await Promise.all([
    useRecordingStore.getState().loadRecordings(true),
    useUserFolderStore.getState().loadFolders(),
  ]);

  if (profile) {
    void upsertUserProfile(profile);
  }

  const settingsSnapshot = useSettingsStore.getState();
  void pushSettingsPayload({
    summarizationMode: settingsSnapshot.summarizationMode,
    transcriptionMode: settingsSnapshot.transcriptionMode,
    showLivePreview: settingsSnapshot.showLivePreview,
    cloudProvider: settingsSnapshot.cloudProvider,
    hasCompletedEnvSetup: settingsSnapshot.hasCompletedEnvSetup,
    themePreference: settingsSnapshot.themePreference,
  });
}

export function deactivateStorageScope(): void {
  activeScopeUserId = null;
  setActiveStorageUserId(null);
  resetInMemoryStores();
}

function resetInMemoryStores(): void {
  useRecordingStore.setState({
    recordings: [],
    hasLoaded: false,
    activeRecordingId: null,
    liveTranscript: '',
    isLoading: false,
  });
  useUserFolderStore.setState({ folders: [], hasLoaded: false });
  useSearchStore.setState({ recentQueries: [] });
  useFolderListLayoutStore.getState().resetToDefaults();
  useSettingsStore.setState({
    openrouterApiKey: '',
    openaiApiKey: '',
    geminiApiKey: '',
    cloudApiKey: '',
  });
}

async function rehydratePersistedStore(
  store: typeof useSettingsStore | typeof useSearchStore,
): Promise<void> {
  if (!store.persist) return;
  await store.persist.rehydrate();
}

async function syncAccountLibrary(userId: string): Promise<void> {
  try {
    const [localRecordings, localFolders, remoteRecordings, remoteFolders, remoteSettings] =
      await Promise.all([
        RecordingStorageService.loadAll(),
        FolderStorageService.loadAll(),
        pullRemoteRecordings(),
        pullRemoteFolders(),
        pullRemoteSettingsPayload(),
      ]);

    const mergedRecordings = mergeRecordingsByUpdatedAt(localRecordings, remoteRecordings);
    const mergedFolders = mergeFoldersByUpdatedAt(localFolders, remoteFolders);

    await AsyncStorage.setItem(
      scopedStorageKey(RECORDINGS_BASE_KEY, userId),
      JSON.stringify(mergedRecordings),
    );
    await AsyncStorage.setItem(
      scopedStorageKey(USER_FOLDERS_BASE_KEY, userId),
      JSON.stringify(mergedFolders),
    );

    await Promise.all([pushAllRecordings(mergedRecordings), pushAllFolders(mergedFolders)]);

    if (remoteSettings) {
      const current = useSettingsStore.getState();
      useSettingsStore.setState({
        summarizationMode:
          typeof remoteSettings.summarizationMode === 'string'
            ? (remoteSettings.summarizationMode as typeof current.summarizationMode)
            : current.summarizationMode,
        transcriptionMode:
          typeof remoteSettings.transcriptionMode === 'string'
            ? (remoteSettings.transcriptionMode as typeof current.transcriptionMode)
            : current.transcriptionMode,
        showLivePreview:
          typeof remoteSettings.showLivePreview === 'boolean'
            ? remoteSettings.showLivePreview
            : current.showLivePreview,
        cloudProvider:
          typeof remoteSettings.cloudProvider === 'string'
            ? (remoteSettings.cloudProvider as typeof current.cloudProvider)
            : current.cloudProvider,
        hasCompletedEnvSetup:
          typeof remoteSettings.hasCompletedEnvSetup === 'boolean'
            ? remoteSettings.hasCompletedEnvSetup
            : current.hasCompletedEnvSetup,
        themePreference:
          typeof remoteSettings.themePreference === 'string'
            ? (remoteSettings.themePreference as typeof current.themePreference)
            : current.themePreference,
      });
    }

    logger.info('StorageActivation', 'Account library synced', {
      userId,
      recordings: mergedRecordings.length,
      folders: mergedFolders.length,
    });
  } catch (error) {
    logger.warn('StorageActivation', 'Account library sync failed; continuing with local data', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
