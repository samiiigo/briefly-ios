import { create } from 'zustand';
const FLASH_MS = 3000;
interface RecordingRetryFlashState {
  pendingRetryIds: Record<string, true>;
  flashUntilById: Record<string, number>;
  markRetryPending: (recordingId: string) => void;
  clearRetryPending: (recordingId: string) => void;
  triggerRetryFlash: (recordingId: string) => void;
}
export const useRecordingRetryFlashStore = create<RecordingRetryFlashState>((set, get) => ({
  pendingRetryIds: {},
  flashUntilById: {},
  markRetryPending: (recordingId) => {
    set((s) => ({
      pendingRetryIds: { ...s.pendingRetryIds, [recordingId]: true },
    }));
  },
  clearRetryPending: (recordingId) => {
    set((s) => {
      if (!s.pendingRetryIds[recordingId]) return s;
      const pendingRetryIds = { ...s.pendingRetryIds };
      delete pendingRetryIds[recordingId];
      return { pendingRetryIds };
    });
  },
  triggerRetryFlash: (recordingId) => {
    const until = Date.now() + FLASH_MS;
    set((s) => ({
      flashUntilById: { ...s.flashUntilById, [recordingId]: until },
      pendingRetryIds: (() => {
        if (!s.pendingRetryIds[recordingId]) return s.pendingRetryIds;
        const pendingRetryIds = { ...s.pendingRetryIds };
        delete pendingRetryIds[recordingId];
        return pendingRetryIds;
      })(),
    }));
    setTimeout(() => {
      const { flashUntilById } = get();
      if (flashUntilById[recordingId] !== until) return;
      set((s) => {
        const next = { ...s.flashUntilById };
        delete next[recordingId];
        return { flashUntilById: next };
      });
    }, FLASH_MS);
  },
}));
export { FLASH_MS as RECORDING_RETRY_FLASH_MS };
