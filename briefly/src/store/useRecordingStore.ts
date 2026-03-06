import { create } from 'zustand';
import { Recording, RecordingStatus, TranscriptSegment, KeyInsight, ProcessingMode } from '../types';
import { StorageService } from '../services/StorageService';

interface RecordingStore {
  recordings: Recording[];
  activeRecordingId: string | null;
  liveTranscript: string;

  // Actions
  loadRecordings: () => Promise<void>;
  addRecording: (recording: Recording) => Promise<void>;
  updateRecording: (id: string, updates: Partial<Recording>) => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;
  setActiveRecordingId: (id: string | null) => void;
  setLiveTranscript: (text: string) => void;
  getRecordingById: (id: string) => Recording | undefined;
}

export const useRecordingStore = create<RecordingStore>((set, get) => ({
  recordings: [],
  activeRecordingId: null,
  liveTranscript: '',

  loadRecordings: async () => {
    const recordings = await StorageService.loadRecordings();
    set({ recordings });
  },

  addRecording: async (recording) => {
    await StorageService.saveRecording(recording);
    set((state) => ({ recordings: [recording, ...state.recordings] }));
  },

  updateRecording: async (id, updates) => {
    await StorageService.updateRecording(id, updates);
    set((state) => ({
      recordings: state.recordings.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
  },

  deleteRecording: async (id) => {
    await StorageService.deleteRecording(id);
    set((state) => ({
      recordings: state.recordings.filter((r) => r.id !== id),
    }));
  },

  setActiveRecordingId: (id) => set({ activeRecordingId: id }),

  setLiveTranscript: (text) => set({ liveTranscript: text }),

  getRecordingById: (id) => get().recordings.find((r) => r.id === id),
}));
