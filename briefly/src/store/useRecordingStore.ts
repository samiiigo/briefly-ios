import { create } from 'zustand';
import { Recording } from '../types';
import { RecordingStorageService } from '../services/storage';
import { folderFlagsFor } from '../utils/recordingFolder';
import { logger } from '../utils/logger';

const RECENTLY_DELETED_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface RecordingStore {
  recordings: Recording[];
  activeRecordingId: string | null;
  liveTranscript: string;
  hasLoaded: boolean;
  isLoading: boolean;

  loadRecordings: (force?: boolean) => Promise<void>;
  addRecording: (recording: Recording) => Promise<void>;
  updateRecording: (id: string, updates: Partial<Recording>) => Promise<void>;
  /** Moves recording to Recently Deleted (soft delete). */
  deleteRecording: (id: string) => Promise<void>;
  /** Restores a recording from Recently Deleted. */
  restoreRecording: (id: string) => Promise<void>;
  /** Permanently removes a recording (e.g. from Recently Deleted). */
  permanentDelete: (id: string) => Promise<void>;
  setActiveRecordingId: (id: string | null) => void;
  setLiveTranscript: (text: string) => void;
  getRecordingById: (id: string) => Recording | undefined;
}

export const useRecordingStore = create<RecordingStore>((set, get) => ({
  recordings: [],
  activeRecordingId: null,
  liveTranscript: '',
  hasLoaded: false,
  isLoading: false,

  loadRecordings: async (force = false) => {
    const { hasLoaded, isLoading } = get();
    if (!force && (hasLoaded || isLoading)) {
      return;
    }
    set({ isLoading: true });
    const start = Date.now();
    try {
      let recordings = await RecordingStorageService.loadAll();
      const cutoff = Date.now() - RECENTLY_DELETED_RETENTION_MS;
      const kept = recordings.filter((r) => !r.deletedAt || r.deletedAt > cutoff);
      if (kept.length < recordings.length) {
        await RecordingStorageService.saveAll(kept);
        recordings = kept;
      }
      if (__DEV__) {
        console.debug(
          `[perf] loadRecordings: ${Date.now() - start}ms (${recordings.length} recordings)`
        );
      }
      logger.info('useRecordingStore', 'Recordings loaded', {
        count: recordings.length,
        elapsedMs: Date.now() - start,
      });
      set({ recordings, hasLoaded: true, isLoading: false });
    } catch (error: any) {
      logger.error('useRecordingStore', 'Failed to load recordings', {
        error: error?.message ?? String(error),
      });
      set({ isLoading: false });
    }
  },

  addRecording: async (recording) => {
    logger.info('useRecordingStore', 'Recording added', {
      id: recording.id,
      title: recording.title,
      durationSec: recording.duration,
      fileSize: recording.fileSize,
    });
    await RecordingStorageService.save(recording);
    set((state) => ({ recordings: [recording, ...state.recordings] }));
  },

  updateRecording: async (id, updates) => {
    logger.info('useRecordingStore', 'Recording updated', {
      id,
      fields: Object.keys(updates),
    });
    await RecordingStorageService.update(id, updates);
    set((state) => ({
      recordings: state.recordings.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
  },

  deleteRecording: async (id) => {
    logger.info('useRecordingStore', 'Recording soft-deleted', { id });
    const flags = folderFlagsFor('recently-deleted');
    await RecordingStorageService.update(id, flags);
    set((state) => ({
      recordings: state.recordings.map((r) =>
        r.id === id ? { ...r, ...flags } : r
      ),
    }));
  },

  restoreRecording: async (id) => {
    logger.info('useRecordingStore', 'Recording restored', { id });
    await get().updateRecording(id, { deletedAt: undefined });
  },

  permanentDelete: async (id) => {
    logger.info('useRecordingStore', 'Recording permanently deleted', { id });
    await RecordingStorageService.remove(id);
    set((state) => ({
      recordings: state.recordings.filter((r) => r.id !== id),
    }));
  },

  setActiveRecordingId: (id) => set({ activeRecordingId: id }),

  setLiveTranscript: (text) => set({ liveTranscript: text }),

  getRecordingById: (id) => get().recordings.find((r) => r.id === id),
}));
