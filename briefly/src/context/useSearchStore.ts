import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_RECENT_SEARCHES } from '@/constants/search';

interface SearchState {
  recentQueries: string[];
  addRecentQuery: (raw: string) => void;
  clearRecentQueries: () => void;
}

function normalizeRecent(raw: string): string {
  return raw.trim();
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      recentQueries: [],

      addRecentQuery: (raw) => {
        const query = normalizeRecent(raw);
        if (!query) return;

        const lower = query.toLowerCase();
        const withoutDup = get().recentQueries.filter(
          (q) => q.toLowerCase() !== lower
        );
        set({
          recentQueries: [query, ...withoutDup].slice(0, MAX_RECENT_SEARCHES),
        });
      },

      clearRecentQueries: () => set({ recentQueries: [] }),
    }),
    {
      name: '@briefly/search-recent',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ recentQueries: state.recentQueries }),
    }
  )
);
