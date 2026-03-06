import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording } from '../types';

const RECORDINGS_KEY = '@briefly/recordings';

export const StorageService = {
  async loadRecordings(): Promise<Recording[]> {
    try {
      const json = await AsyncStorage.getItem(RECORDINGS_KEY);
      if (!json) return [];
      const recordings: Recording[] = JSON.parse(json);
      return recordings.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  },

  async saveRecording(recording: Recording): Promise<void> {
    const existing = await this.loadRecordings();
    const updated = [recording, ...existing.filter((r) => r.id !== recording.id)];
    await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
  },

  async updateRecording(id: string, updates: Partial<Recording>): Promise<void> {
    const existing = await this.loadRecordings();
    const updated = existing.map((r) => (r.id === id ? { ...r, ...updates } : r));
    await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
  },

  async deleteRecording(id: string): Promise<void> {
    const existing = await this.loadRecordings();
    const updated = existing.filter((r) => r.id !== id);
    await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
  },
};
