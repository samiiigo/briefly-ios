import { create } from 'zustand';

export type FolderListLayoutMode = 'list' | 'grid';

interface State {
  layout: FolderListLayoutMode;
  setLayout: (layout: FolderListLayoutMode) => void;
  toggleLayout: () => void;
  resetToDefaults: () => void;
}

export const useFolderListLayoutStore = create<State>((set, get) => ({
  layout: 'grid',
  setLayout: (layout) => set({ layout }),
  toggleLayout: () =>
    set({ layout: get().layout === 'list' ? 'grid' : 'list' }),
  resetToDefaults: () => set({ layout: 'grid' }),
}));
