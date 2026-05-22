import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useUserFolderStore } from '@/context/useUserFolderStore';
import { useSearchStore } from '@/context/useSearchStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { SEARCH_DEBOUNCE_MS } from '@/constants/search';
import { buildSearchCatalog, runIndexedSearch } from '@/utils/search/searchIndex';
import { normalizeSearchQuery } from '@/utils/search/searchEngine';
import { filterRecentQueriesWithHits } from '@/utils/search/searchPristineContent';
import { isRecordingEntryNavigationLocked } from '@/utils/recording/recordingEntryAccess';

export function useSearchScreen() {
  const router = useRouter();

  const recordings = useRecordingStore((s) => s.recordings);
  const recordingsLoaded = useRecordingStore((s) => s.hasLoaded);
  const loadRecordings = useRecordingStore((s) => s.loadRecordings);
  const folders = useUserFolderStore((s) => s.folders);
  const loadFolders = useUserFolderStore((s) => s.loadFolders);

  const recentQueries = useSearchStore((s) => s.recentQueries);
  const removeRecentQuery = useSearchStore((s) => s.removeRecentQuery);
  const clearRecentQueries = useSearchStore((s) => s.clearRecentQueries);

  const [query, setQuery] = useState('');
  const queryRef = useRef(query);
  queryRef.current = query;

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const deferredQuery = useDeferredValue(debouncedQuery);

  useEffect(() => {
    void loadRecordings();
    void loadFolders();
  }, [loadRecordings, loadFolders]);

  const catalog = useMemo(
    () => buildSearchCatalog(folders, recordings),
    [folders, recordings]
  );

  const results = useMemo(
    () => runIndexedSearch(deferredQuery, catalog),
    [deferredQuery, catalog]
  );

  const isActiveSearch = normalizeSearchQuery(deferredQuery).length > 0;
  const hasResults = results.folders.length > 0 || results.recordings.length > 0;
  const isStaleResults = debouncedQuery !== deferredQuery;

  const scopedRecentQueries = useMemo(
    () =>
      filterRecentQueriesWithHits(recentQueries, catalog, {
        scopeRecents: recordingsLoaded,
      }),
    [recentQueries, catalog, recordingsLoaded]
  );

  const handleSearchSubmit = useCallback(() => {
    useSearchStore.getState().commitRecentQuery(queryRef.current);
  }, []);

  const persistQueryOnResultTap = useCallback(() => {
    useSearchStore.getState().commitRecentQuery(queryRef.current);
  }, []);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
  }, []);

  const handleClearQuery = useCallback(() => {
    setQuery('');
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const openFolder = useCallback(
    (folderId: string, folderName: string, folderType: 'built-in' | 'user') => {
      persistQueryOnResultTap();
      router.push({
        pathname: `/folder/${folderId}` as any,
        params: { folderName, folderType },
      });
    },
    [router, persistQueryOnResultTap]
  );

  const openRecording = useCallback(
    (id: string) => {
      const rec = useRecordingStore.getState().getRecordingById(id);
      if (!rec || isRecordingEntryNavigationLocked(rec)) return;
      persistQueryOnResultTap();
      router.push(`/recording/${id}`);
    },
    [router, persistQueryOnResultTap]
  );

  const handleRecentSelect = useCallback((term: string) => {
    setQuery(term);
  }, []);

  return {
    query,
    deferredQuery,
    results,
    isActiveSearch,
    hasResults,
    isStaleResults,
    scopedRecentQueries,
    handleQueryChange,
    handleClearQuery,
    handleSearchSubmit,
    handleClose,
    openFolder,
    openRecording,
    handleRecentSelect,
    removeRecentQuery,
    clearRecentQueries,
  };
}
