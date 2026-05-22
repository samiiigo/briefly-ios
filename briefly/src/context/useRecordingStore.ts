import { create } from 'zustand';
import { Recording } from '@/types';
import { AudioFileService } from '@/services/audio';
import { RecordingStorageService } from '@/services/storage';
import type { RecordingRepository } from '@/services/storage';
import { folderFlagsFor } from '@/utils/folders/recordingFolder';
import { logger } from '@/utils/logging/logger';
import { repairRecordingFilePaths } from '@/utils/fileSystem/persistRecordingAudio';
import { validateRecordingId, validateRecordingUpdates } from '@/security/inputSchemas';
import { ValidationError } from '@/security/schema';
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
  /** Permanently removes multiple recordings in one persistence write. */
  permanentDeleteAll: (ids: string[]) => Promise<void>;
  setActiveRecordingId: (id: string | null) => void;
  setLiveTranscript: (text: string) => void;
  getRecordingById: (id: string) => Recording | undefined;
  /** Adds multiple imported recordings in one persistence write. */
  importRecordings: (recordings: Recording[]) => Promise<void>;
}
let recordingRepository: RecordingRepository = RecordingStorageService;
export function configureRecordingRepository(repository: RecordingRepository): void {
  recordingRepository = repository;
}
export function resetRecordingRepository(): void {
  recordingRepository = RecordingStorageService;
}
function purgeExpiredRecentlyDeleted(
  recordings: Recording[],
  retentionMs: number
): { kept: Recording[]; removedCount: number } {
  const cutoff = Date.now() - retentionMs;
  const kept = recordings.filter((recording) => !recording.deletedAt || recording.deletedAt > cutoff);
  return { kept, removedCount: recordings.length - kept.length };
}
/** Prefer in-memory state when a background load finishes after local edits. */
function mergeRecordingsFromPersistence(
  memory: Recording[],
  persisted: Recording[],
): Recording[] {
  const memoryById = new Map(memory.map((r) => [r.id, r]));
  const persistedById = new Map(persisted.map((r) => [r.id, r]));
  const ids = new Set([...memoryById.keys(), ...persistedById.keys()]);
  const merged = Array.from(ids, (id) => {
    const inMemory = memoryById.get(id);
    const fromDisk = persistedById.get(id);
    if (!inMemory) return fromDisk!;
    if (!fromDisk) return inMemory;
    // In-memory wins when both exist — e.g. re-transcribe replaces many live
    // segments with fewer AssemblyAI segments; disk may still be stale.
    return inMemory;
  });
  return merged.sort((a, b) => b.createdAt - a.createdAt);
}
let mutationEpoch = 0;
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
    const epochAtStart = mutationEpoch;
    set({ isLoading: true });
    const start = Date.now();
    try {
      let recordings = await recordingRepository.loadAll();
      const { kept, removedCount } = purgeExpiredRecentlyDeleted(
        recordings,
        RECENTLY_DELETED_RETENTION_MS
      );
      if (removedCount > 0) {
        mutationEpoch += 1;
        await recordingRepository.saveAll(kept);
        recordings = kept;
      }
      const repaired = repairRecordingFilePaths(recordings);
      if (repaired.changed) {
        mutationEpoch += 1;
        await recordingRepository.saveAll(repaired.recordings);
        recordings = repaired.recordings;
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
      set((state) => ({
        recordings:
          epochAtStart === mutationEpoch
            ? recordings
            : mergeRecordingsFromPersistence(state.recordings, recordings),
        hasLoaded: true,
        isLoading: false,
      }));
    } catch (error: any) {
      logger.error('useRecordingStore', 'Failed to load recordings', {
        error: error?.message ?? String(error),
      });
      set({ isLoading: false });
    }
  },
  addRecording: async (recording) => {
    mutationEpoch += 1;
    logger.info('useRecordingStore', 'Recording added', {
      id: recording.id,
      title: recording.title,
      durationSec: recording.duration,
      fileSize: recording.fileSize,
    });
    set((state) => ({ recordings: [recording, ...state.recordings] }));
    try {
      await recordingRepository.save(recording);
    } catch (error) {
      set((state) => ({
        recordings: state.recordings.filter((r) => r.id !== recording.id),
      }));
      throw error;
    }
  },
  updateRecording: async (id, updates) => {
    const safeId = validateRecordingId(id);
    let safeUpdates: Partial<Recording>;
    try {
      safeUpdates = validateRecordingUpdates(
        updates as Record<string, unknown>
      ) as Partial<Recording>;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(error.message);
      }
      throw error;
    }
    mutationEpoch += 1;
    logger.info('useRecordingStore', 'Recording updated', {
      id: safeId,
      fields: Object.keys(safeUpdates),
    });
    const previous = get().recordings.find((r) => r.id === safeId);
    set((state) => ({
      recordings: state.recordings.map((r) =>
        r.id === safeId ? { ...r, ...safeUpdates } : r
      ),
    }));
    const next = get().recordings.find((r) => r.id === safeId);
    if (!next) return;
    try {
      await recordingRepository.save(next);
    } catch (error) {
      if (previous) {
        set((state) => ({
          recordings: state.recordings.map((r) => (r.id === safeId ? previous : r)),
        }));
      }
      throw error;
    }
  },
  deleteRecording: async (id) => {
    logger.info('useRecordingStore', 'Recording soft-deleted', { id });
    const recording = get().recordings.find((r) => r.id === id);
    const flags = folderFlagsFor('recently-deleted', recording);
    await recordingRepository.update(id, flags);
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
    const recording = get().recordings.find((r) => r.id === id);
    if (recording?.filePath) {
      await AudioFileService.deleteFile(recording.filePath);
    }
    logger.info('useRecordingStore', 'Recording permanently deleted', { id });
    await recordingRepository.remove(id);
    set((state) => ({
      recordings: state.recordings.filter((r) => r.id !== id),
    }));
  },
  permanentDeleteAll: async (ids) => {
    if (ids.length === 0) return;
    mutationEpoch += 1;
    const idSet = new Set(ids);
    const toRemove = get().recordings.filter((r) => idSet.has(r.id));
    await Promise.all(
      toRemove.map((r) =>
        r.filePath ? AudioFileService.deleteFile(r.filePath) : Promise.resolve()
      )
    );
    logger.info('useRecordingStore', 'Recordings permanently deleted (bulk)', {
      count: ids.length,
    });
    const remaining = get().recordings.filter((r) => !idSet.has(r.id));
    await recordingRepository.saveAll(remaining);
    set({ recordings: remaining });
  },
  setActiveRecordingId: (id) => set({ activeRecordingId: id }),
  setLiveTranscript: (text) => set({ liveTranscript: text }),
  getRecordingById: (id) => get().recordings.find((r) => r.id === id),
  importRecordings: async (incoming) => {
    if (incoming.length === 0) return;
    mutationEpoch += 1;
    const epochAtStart = mutationEpoch;
    const previous = get().recordings;
    const merged = [...incoming, ...previous].sort((a, b) => b.createdAt - a.createdAt);
    set({ recordings: merged });
    try {
      await recordingRepository.saveAll(merged);
      logger.info('useRecordingStore', 'Recordings imported', { count: incoming.length });
    } catch (error) {
      if (epochAtStart === mutationEpoch) {
        set({ recordings: previous });
      }
      throw error;
    }
  },
}));
