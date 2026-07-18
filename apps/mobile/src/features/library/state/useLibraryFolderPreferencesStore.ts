import { create } from 'zustand';
export type LibraryDatePreset = 'all' | 'today' | 'last7' | 'last30';
export type LibraryScopeRefinement = 'none' | 'favorites' | 'unlisted' | 'archived';
export interface LibraryFolderPreferences {
  datePreset: LibraryDatePreset;
  scopeRefinement: LibraryScopeRefinement;
}
const defaults: LibraryFolderPreferences = {
  datePreset: 'all',
  scopeRefinement: 'none',
};
interface LibraryFolderPreferencesState extends LibraryFolderPreferences {
  setDatePreset: (v: LibraryDatePreset) => void;
  setScopeRefinement: (v: LibraryScopeRefinement) => void;
  resetFilters: () => void;
}
export const useLibraryFolderPreferencesStore = create<LibraryFolderPreferencesState>((set) => ({
  ...defaults,
  setDatePreset: (datePreset) => set({ datePreset }),
  setScopeRefinement: (scopeRefinement) => set({ scopeRefinement }),
  resetFilters: () => set({ ...defaults }),
}));
export function hasActiveFolderPreferences(p: LibraryFolderPreferences): boolean {
  return p.datePreset !== 'all' || p.scopeRefinement !== 'none';
}
