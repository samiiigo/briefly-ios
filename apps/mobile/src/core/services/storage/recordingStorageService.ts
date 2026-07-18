import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording } from '@briefly/types';
import { scopedStorageKey } from '@/core/services/storage/storageScope';
import { logger } from '@/lib/utils/logging/logger';
import { RecordingRepository } from './contracts';
import {
  deleteRemoteRecording,
  pushAllRecordings,
  pushRecording,
} from '@/features/auth/services/accountSync';

const RECORDINGS_BASE_KEY = '@briefly/recordings';
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

function withUpdatedAt(recording: Recording): Recording {
  return { ...recording, updatedAt: Date.now() };
}

function queueCloudPush(task: () => Promise<void>): void {
  void task().catch(() => undefined);
}

export const RecordingStorageService: RecordingRepository = {
  async loadAll(): Promise<Recording[]> {
    try {
      const json = await AsyncStorage.getItem(scopedStorageKey(RECORDINGS_BASE_KEY));
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
      const stamped = withUpdatedAt(recording);
      const existing = await this.loadAll();
      const updated = [stamped, ...existing.filter((r) => r.id !== stamped.id)];
      await AsyncStorage.setItem(scopedStorageKey(RECORDINGS_BASE_KEY), JSON.stringify(updated));
      logger.info('StorageService', 'Recording saved', {
        id: stamped.id,
        title: stamped.title,
      });
      queueCloudPush(() => pushRecording(stamped));
    });
  },
  async update(id: string, updates: Partial<Recording>): Promise<void> {
    return enqueuePersist(async () => {
      const existing = await this.loadAll();
      let nextRecording: Recording | undefined;
      const updated = existing.map((r) => {
        if (r.id !== id) return r;
        nextRecording = withUpdatedAt({ ...r, ...updates });
        return nextRecording;
      });
      await AsyncStorage.setItem(scopedStorageKey(RECORDINGS_BASE_KEY), JSON.stringify(updated));
      logger.info('StorageService', 'Recording updated', { id, fields: Object.keys(updates) });
      if (nextRecording) {
        queueCloudPush(() => pushRecording(nextRecording!));
      }
    });
  },
  async remove(id: string): Promise<void> {
    return enqueuePersist(async () => {
      const existing = await this.loadAll();
      const updated = existing.filter((r) => r.id !== id);
      await AsyncStorage.setItem(scopedStorageKey(RECORDINGS_BASE_KEY), JSON.stringify(updated));
      logger.info('StorageService', 'Recording deleted from storage', { id });
      queueCloudPush(() => deleteRemoteRecording(id));
    });
  },
  async saveAll(recordings: Recording[]): Promise<void> {
    return enqueuePersist(async () => {
      const stamped = recordings.map(withUpdatedAt);
      await AsyncStorage.setItem(scopedStorageKey(RECORDINGS_BASE_KEY), JSON.stringify(stamped));
      logger.info('StorageService', 'All recordings saved', { count: stamped.length });
      queueCloudPush(() => pushAllRecordings(stamped));
    });
  },
};
