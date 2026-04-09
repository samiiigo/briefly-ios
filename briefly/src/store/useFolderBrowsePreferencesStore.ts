import { create } from 'zustand';

export type FolderLayoutMode = 'list' | 'grid';
export type FolderSortField = 'date' | 'name' | 'type' | 'size';
export type FolderSortDirection = 'asc' | 'desc';
export type FolderGroupBy = 'none' | 'date' | 'type' | 'size';

export interface FolderBrowsePreferences {
  layout: FolderLayoutMode;
  sortField: FolderSortField;
  sortDirection: FolderSortDirection;
  groupBy: FolderGroupBy;
  /** When true, only non-deleted recordings marked favorite are shown. */
  favoritesOnly: boolean;
}

const defaultBrowse: FolderBrowsePreferences = {
  layout: 'list',
  sortField: 'date',
  sortDirection: 'desc',
  groupBy: 'none',
  favoritesOnly: false,
};

interface State {
  /** Merged state per folder key; missing keys use `defaultBrowse`. */
  byFolder: Record<string, FolderBrowsePreferences>;
  setForFolder: (folderKey: string, patch: Partial<FolderBrowsePreferences>) => void;
  resetForFolder: (folderKey: string) => void;
}

export const useFolderBrowsePreferencesStore = create<State>((set) => ({
  byFolder: {},
  setForFolder: (folderKey, patch) =>
    set((state) => {
      const prev = state.byFolder[folderKey] ?? defaultBrowse;
      return {
        byFolder: {
          ...state.byFolder,
          [folderKey]: { ...prev, ...patch },
        },
      };
    }),
  resetForFolder: (folderKey) =>
    set((state) => {
      const next = { ...state.byFolder };
      delete next[folderKey];
      return { byFolder: next };
    }),
}));

export function getFolderBrowsePreferences(
  byFolder: Record<string, FolderBrowsePreferences>,
  folderKey: string
): FolderBrowsePreferences {
  return { ...defaultBrowse, ...byFolder[folderKey] };
}

export { defaultBrowse as defaultFolderBrowsePreferences };
