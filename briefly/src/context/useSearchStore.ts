import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  commitRecentSearchList,
  sanitizeRecentSearchList,
} from '@/utils/search/recentSearchPersistence';
interface SearchState {
  recentQueries: string[];
  /**
   * Persist a search term — call only on keyboard Search/Enter or result tap,
   * never from text onChange handlers.
   */
  commitRecentQuery: (raw: string) => void;
  removeRecentQuery: (raw: string) => void;
  clearRecentQueries: () => void;
}
export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      recentQueries: [],
      commitRecentQuery: (raw) => {
        const prev = get().recentQueries;
        const next = commitRecentSearchList(prev, raw);
        if (prev.length === next.length && prev.every((entry, i) => entry === next[i])) {
          return;
        }
        set({ recentQueries: next });
      },
      removeRecentQuery: (raw) => {
        const lower = raw.trim().toLowerCase();
        if (!lower) return;
        const next = get().recentQueries.filter((entry) => entry.toLowerCase() !== lower);
        if (next.length === get().recentQueries.length) return;
        set({ recentQueries: next });
      },
      clearRecentQueries: () => set({ recentQueries: [] }),
    }),
    {
      name: '@briefly/search-recent',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ recentQueries: state.recentQueries }),
      migrate: (persisted) => {
        const state = persisted as { recentQueries?: string[] } | undefined;
        if (!state?.recentQueries) return persisted;
        return {
          ...state,
          recentQueries: sanitizeRecentSearchList(state.recentQueries),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const cleaned = sanitizeRecentSearchList(state.recentQueries);
        if (cleaned.length !== state.recentQueries.length) {
          state.recentQueries = cleaned;
        }
      },
    }
  )
);
