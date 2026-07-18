import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserFolder } from '@/shared/types';
import { scopedStorageKey } from '@/shared/services/storage/storageScope';
import { FolderRepository } from './contracts';
import {
  deleteRemoteFolder,
  pushFolder,
} from '@/features/auth/services/accountSync';

const USER_FOLDERS_BASE_KEY = '@briefly/user_folders';

function withUpdatedAt(folder: UserFolder): UserFolder {
  return { ...folder, updatedAt: Date.now() };
}

function queueCloudPush(task: () => Promise<void>): void {
  void task().catch(() => undefined);
}

export const FolderStorageService: FolderRepository = {
  async loadAll(): Promise<UserFolder[]> {
    try {
      const json = await AsyncStorage.getItem(scopedStorageKey(USER_FOLDERS_BASE_KEY));
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },
  async save(folder: UserFolder): Promise<void> {
    const stamped = withUpdatedAt(folder);
    const existing = await this.loadAll();
    const updated = existing.some((f) => f.id === stamped.id)
      ? existing.map((f) => (f.id === stamped.id ? stamped : f))
      : [...existing, stamped];
    await AsyncStorage.setItem(scopedStorageKey(USER_FOLDERS_BASE_KEY), JSON.stringify(updated));
    queueCloudPush(() => pushFolder(stamped));
  },
  async remove(id: string): Promise<void> {
    const existing = await this.loadAll();
    const updated = existing.filter((f) => f.id !== id);
    await AsyncStorage.setItem(scopedStorageKey(USER_FOLDERS_BASE_KEY), JSON.stringify(updated));
    queueCloudPush(() => deleteRemoteFolder(id));
  },
};
