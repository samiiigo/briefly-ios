import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording } from '@/types';
import { logger } from '@/utils/logging/logger';
import { RecordingRepository } from './contracts';
const RECORDINGS_KEY = '@briefly/recordings';
/** Serializes read-modify-write so concurrent saves cannot drop fields. */
let persistChain: Promise<void> = Promise.resolve();
function enqueuePersist<T>(task: () => Promise<T>): Promise<T> {
  const next = persistChain.then(task);
  persistChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}
export const RecordingStorageService: RecordingRepository = {
  async loadAll(): Promise<Recording[]> {
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
  async save(recording: Recording): Promise<void> {
    return enqueuePersist(async () => {
      const existing = await this.loadAll();
      const updated = [recording, ...existing.filter((r) => r.id !== recording.id)];
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
      logger.info('StorageService', 'Recording saved', {
        id: recording.id,
        title: recording.title,
      });
    });
  },
  async update(id: string, updates: Partial<Recording>): Promise<void> {
    return enqueuePersist(async () => {
      const existing = await this.loadAll();
      const updated = existing.map((r) => (r.id === id ? { ...r, ...updates } : r));
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
      logger.info('StorageService', 'Recording updated', { id, fields: Object.keys(updates) });
    });
  },
  async remove(id: string): Promise<void> {
    return enqueuePersist(async () => {
      const existing = await this.loadAll();
      const updated = existing.filter((r) => r.id !== id);
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
      logger.info('StorageService', 'Recording deleted from storage', { id });
    });
  },
  async saveAll(recordings: Recording[]): Promise<void> {
    return enqueuePersist(async () => {
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
      logger.info('StorageService', 'All recordings saved', { count: recordings.length });
    });
  },
};
