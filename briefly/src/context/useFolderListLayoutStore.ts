import { create } from 'zustand';
export type FolderListLayoutMode = 'list' | 'grid';
export function folderListLayoutTitle(layout: FolderListLayoutMode): string {
  return layout === 'grid' ? 'Grid' : 'List';
}
export function folderListLayoutDescription(layout: FolderListLayoutMode): string {
  return layout === 'grid'
    ? 'Two columns of folder tiles.'
    : 'One folder per row with more detail.';
}
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
