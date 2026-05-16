import { create } from 'zustand';

type CloseFn = () => void;

interface ActiveSwipeableState {
  activeId: string | null;
  closeFn: CloseFn | null;
  /** Opens `id`, closing any other row that was open. */
  open: (id: string, close: CloseFn) => void;
  /** Clears registry when `id` closes. */
  release: (id: string) => void;
  /** Closes the open row, if any. */
  closeActive: () => void;
}

export const useActiveSwipeableStore = create<ActiveSwipeableState>((set, get) => ({
  activeId: null,
  closeFn: null,
  open: (id, close) => {
    const { activeId, closeFn } = get();
    if (activeId && activeId !== id && closeFn) {
      closeFn();
    }
    set({ activeId: id, closeFn: close });
  },
  release: (id) => {
    if (get().activeId === id) {
      set({ activeId: null, closeFn: null });
    }
  },
  closeActive: () => {
    const { closeFn } = get();
    closeFn?.();
    set({ activeId: null, closeFn: null });
  },
}));
