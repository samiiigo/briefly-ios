import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording, UserFolder } from '../types';
import { logger } from '../utils/logger';

const RECORDINGS_KEY = '@briefly/recordings';
const USER_FOLDERS_KEY = '@briefly/user_folders';

export const StorageService = {
  async loadRecordings(): Promise<Recording[]> {
    try {
      const json = await AsyncStorage.getItem(RECORDINGS_KEY);
      if (!json) return [];
      const recordings: Recording[] = JSON.parse(json);
      logger.info('StorageService', 'Recordings loaded from storage', {
        count: recordings.length,
      });
      return recordings.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error: any) {
      logger.error('StorageService', 'Failed to load recordings', {
        error: error?.message ?? String(error),
      });
      return [];
    }
  },

  async saveRecording(recording: Recording): Promise<void> {
    const existing = await this.loadRecordings();
    const updated = [recording, ...existing.filter((r) => r.id !== recording.id)];
    await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
    logger.info('StorageService', 'Recording saved', {
      id: recording.id,
      title: recording.title,
    });
  },

  async updateRecording(id: string, updates: Partial<Recording>): Promise<void> {
    const existing = await this.loadRecordings();
    const updated = existing.map((r) => (r.id === id ? { ...r, ...updates } : r));
    await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
    logger.info('StorageService', 'Recording updated', { id, fields: Object.keys(updates) });
  },

  async deleteRecording(id: string): Promise<void> {
    const existing = await this.loadRecordings();
    const updated = existing.filter((r) => r.id !== id);
    await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
    logger.info('StorageService', 'Recording deleted from storage', { id });
  },

  async saveAllRecordings(recordings: Recording[]): Promise<void> {
    await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
    logger.info('StorageService', 'All recordings saved', { count: recordings.length });
  },

  async loadUserFolders(): Promise<UserFolder[]> {
    try {
      const json = await AsyncStorage.getItem(USER_FOLDERS_KEY);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  async saveUserFolder(folder: UserFolder): Promise<void> {
    const existing = await this.loadUserFolders();
    const updated = existing.some((f) => f.id === folder.id)
      ? existing.map((f) => (f.id === folder.id ? folder : f))
      : [...existing, folder];
    await AsyncStorage.setItem(USER_FOLDERS_KEY, JSON.stringify(updated));
  },

  async deleteUserFolder(id: string): Promise<void> {
    const existing = await this.loadUserFolders();
    const updated = existing.filter((f) => f.id !== id);
    await AsyncStorage.setItem(USER_FOLDERS_KEY, JSON.stringify(updated));
  },
};
