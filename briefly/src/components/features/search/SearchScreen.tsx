import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { FlashList, type FlashListRef, type ListRenderItem } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useUserFolderStore } from '@/context/useUserFolderStore';
import { useSearchStore } from '@/context/useSearchStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  DEFAULT_SEARCH_FILTER,
  SEARCH_DEBOUNCE_MS,
  SearchFilterId,
} from '@/constants/search';
import { buildSearchCatalog, runIndexedSearch } from '@/utils/search/searchIndex';
import { normalizeSearchQuery } from '@/utils/search/searchEngine';
import { Recording } from '@/types';
import { SearchBar } from './SearchBar';
import {
  ScrollRevealSearchFilters,
  HIDE_THRESHOLD,
  REVEAL_THRESHOLD,
} from './ScrollRevealSearchFilters';
import { RecentSearchesSection } from './RecentSearchesSection';
import { SearchFolderCard } from './SearchFolderCard';
import { SearchResultItem } from './SearchResultItem';
import { SearchEmptyState } from './SearchEmptyState';
import { Colors, Spacing, withAppFont } from '@/theme';

const FOLDER_CARD_WIDTH_RATIO = 0.42;
const LIST_BOTTOM_PADDING = 48;
const RESULT_ROW_GAP = 12;

export function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const folderCardWidth = (windowWidth - 2 * Spacing.md) * FOLDER_CARD_WIDTH_RATIO;
  const listRef = useRef<FlashListRef<Recording>>(null);

  const recordings = useRecordingStore((s) => s.recordings);
  const loadRecordings = useRecordingStore((s) => s.loadRecordings);
  const folders = useUserFolderStore((s) => s.folders);
  const loadFolders = useUserFolderStore((s) => s.loadFolders);

  const recentQueries = useSearchStore((s) => s.recentQueries);
  const removeRecentQuery = useSearchStore((s) => s.removeRecentQuery);
  const clearRecentQueries = useSearchStore((s) => s.clearRecentQueries);

  const [query, setQuery] = useState('');
  const queryRef = useRef(query);
  queryRef.current = query;

  const [filterId, setFilterId] = useState<SearchFilterId>(DEFAULT_SEARCH_FILTER);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const deferredQuery = useDeferredValue(debouncedQuery);
  const filterReveal = useSharedValue(0);

  /** Only for keyboard Search / Enter — never wired to onChangeText. */
  const handleSearchSubmit = useCallback(() => {
    useSearchStore.getState().commitRecentQuery(queryRef.current);
  }, []);

  /** Only when the user opens a folder or recording from results. */
  const persistQueryOnResultTap = useCallback(() => {
    useSearchStore.getState().commitRecentQuery(queryRef.current);
  }, []);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
  }, []);

  useEffect(() => {
    void loadRecordings();
    void loadFolders();
  }, [loadRecordings, loadFolders]);

  const catalog = useMemo(
    () => buildSearchCatalog(folders, recordings),
    [folders, recordings]
  );

  const results = useMemo(
    () => runIndexedSearch(deferredQuery, filterId, catalog),
    [deferredQuery, filterId, catalog]
  );

  const isActiveSearch = normalizeSearchQuery(deferredQuery).length > 0;
  const hasResults = results.folders.length > 0 || results.recordings.length > 0;
  const isStaleResults = debouncedQuery !== deferredQuery;

  const collapseFilters = useCallback(() => {
    filterReveal.value = withTiming(0, { duration: 180 });
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filterReveal]);

  useEffect(() => {
    collapseFilters();
  }, [isActiveSearch, collapseFilters]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      if (y > REVEAL_THRESHOLD) {
        if (filterReveal.value < 1) {
          filterReveal.value = withTiming(1, { duration: 200 });
        }
      } else if (y < HIDE_THRESHOLD) {
        if (filterReveal.value > 0) {
          filterReveal.value = withTiming(0, { duration: 180 });
        }
      }
    },
    [filterReveal]
  );

  const handleCancel = useCallback(() => {
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
      persistQueryOnResultTap();
      router.push(`/recording/${id}`);
    },
    [router, persistQueryOnResultTap]
  );

  const handleRecentSelect = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const folderHeader = useMemo(() => {
    if (!isActiveSearch || results.folders.length === 0) return null;

    return (
      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Folders</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.folderRow}
        >
          {results.folders.map((folder) => (
            <SearchFolderCard
              key={`${folder.folderType}-${folder.id}`}
              folder={folder}
              query={deferredQuery}
              width={folderCardWidth}
              onPress={() => openFolder(folder.id, folder.name, folder.folderType)}
            />
          ))}
        </ScrollView>
        {results.recordings.length > 0 ? (
          <Text style={[styles.sectionTitle, styles.itemsSectionTitle]}>Items</Text>
        ) : null}
      </View>
    );
  }, [
    isActiveSearch,
    results.folders,
    results.recordings.length,
    deferredQuery,
    folderCardWidth,
    openFolder,
  ]);

  const renderRecording: ListRenderItem<Recording> = useCallback(
    ({ item }) => (
      <SearchResultItem
        recording={item}
        query={deferredQuery}
        onPress={() => openRecording(item.id)}
      />
    ),
    [deferredQuery, openRecording]
  );

  const keyExtractor = useCallback((item: Recording) => item.id, []);

  const listEmpty = useMemo(() => {
    if (!isActiveSearch) {
      return (
        <RecentSearchesSection
          queries={recentQueries}
          onSelect={handleRecentSelect}
          onRemove={removeRecentQuery}
          onClearAll={clearRecentQueries}
        />
      );
    }
    if (hasResults) return null;
    if (!isStaleResults) {
      return <SearchEmptyState query={deferredQuery.trim()} />;
    }
    return null;
  }, [
    isActiveSearch,
    hasResults,
    isStaleResults,
    recentQueries,
    handleRecentSelect,
    removeRecentQuery,
    clearRecentQueries,
    deferredQuery,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.chrome, { paddingTop: insets.top }]}>
        <SearchBar
          value={query}
          onChangeText={handleQueryChange}
          onCancel={handleCancel}
          onSubmit={handleSearchSubmit}
        />
        <ScrollRevealSearchFilters
          progress={filterReveal}
          selected={filterId}
          onSelect={setFilterId}
        />
      </View>

      <FlashList
        ref={listRef}
        style={styles.list}
        data={isActiveSearch ? results.recordings : []}
        renderItem={renderRecording}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ResultSeparator}
        ListHeaderComponent={folderHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={{
          paddingTop: Spacing.sm,
          paddingBottom: insets.bottom + LIST_BOTTOM_PADDING,
          paddingHorizontal: isActiveSearch && results.recordings.length > 0 ? Spacing.md : 0,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        drawDistance={320}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      />
    </KeyboardAvoidingView>
  );
}

function ResultSeparator() {
  return <View style={styles.itemGap} />;
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    flex: 1,
  },
  chrome: {
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  block: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.md,
  },
  sectionTitle: withAppFont({
    fontSize: 14,
    fontWeight: '500',
    color: Colors.subtext,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  }),
  itemsSectionTitle: {
    marginTop: Spacing.sm,
  },
  folderRow: {
    paddingHorizontal: Spacing.md,
  },
  itemGap: {
    height: RESULT_ROW_GAP,
  },
});
