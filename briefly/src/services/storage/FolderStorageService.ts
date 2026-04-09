/**
 * FolderStorageService (SRP)
 *
 * Single responsibility: persist and retrieve UserFolder entities.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserFolder } from '../../types';
import { FolderRepository } from './contracts';

const USER_FOLDERS_KEY = '@briefly/user_folders';

export const FolderStorageService: FolderRepository = {
  async loadAll(): Promise<UserFolder[]> {
    try {
      const json = await AsyncStorage.getItem(USER_FOLDERS_KEY);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  async save(folder: UserFolder): Promise<void> {
    const existing = await this.loadAll();
    const updated = existing.some((f) => f.id === folder.id)
      ? existing.map((f) => (f.id === folder.id ? folder : f))
      : [...existing, folder];
    await AsyncStorage.setItem(USER_FOLDERS_KEY, JSON.stringify(updated));
  },

  async remove(id: string): Promise<void> {
    const existing = await this.loadAll();
    const updated = existing.filter((f) => f.id !== id);
    await AsyncStorage.setItem(USER_FOLDERS_KEY, JSON.stringify(updated));
  },
};
