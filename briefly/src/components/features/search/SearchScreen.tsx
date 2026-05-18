import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { FlashList, type FlashListRef, type ListRenderItem } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSearchScreen } from '@/hooks/useSearchScreen';
import {
  SCREEN_LIST_BOTTOM_PADDING,
  screenLayoutStyles,
} from '@/components/navigation/screenLayout';
import { Recording } from '@/types';
import { RECORDING_LIST_ITEM_GAP } from '@/utils/list/flattenRecordingSections';
import { SearchTopChrome } from './SearchTopChrome';
import { RecentSearchesSection } from './RecentSearchesSection';
import { SearchFolderCard } from './SearchFolderCard';
import { SearchResultItem } from './SearchResultItem';
import { SearchEmptyState } from './SearchEmptyState';
import {
  SEARCH_CHROME_HORIZONTAL_PADDING,
  getSearchScrollPaddingTop,
} from './searchLayout';
import { Colors, Spacing, withAppFont } from '@/theme';

const FOLDER_CARD_WIDTH_RATIO = 0.42;

const sectionHeaderStyle = withAppFont({
  fontSize: 14,
  fontWeight: '500',
  lineHeight: 16,
  color: Colors.subtext,
  marginBottom: 0,
  paddingHorizontal: Spacing.sm,
});

export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const scrollPaddingTop = getSearchScrollPaddingTop(insets.top);
  const { width: windowWidth } = useWindowDimensions();
  const folderCardWidth =
    (windowWidth - 2 * SEARCH_CHROME_HORIZONTAL_PADDING) * FOLDER_CARD_WIDTH_RATIO;
  const listRef = useRef<FlashListRef<Recording>>(null);
  const pristineScrollRef = useRef<ScrollView>(null);

  const {
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
  } = useSearchScreen();

  useEffect(() => {
    if (isActiveSearch) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    } else {
      pristineScrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [deferredQuery, isActiveSearch]);

  const folderHeader = useMemo(() => {
    if (!isActiveSearch || results.folders.length === 0) return null;

    return (
      <View style={styles.folderBlock}>
        <Text style={sectionHeaderStyle}>Folders</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.folderRow}
          keyboardShouldPersistTaps="handled"
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
          <Text style={[sectionHeaderStyle, styles.itemsSectionHeader]}>Items</Text>
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
    if (hasResults) return null;
    if (!isStaleResults) {
      return <SearchEmptyState query={deferredQuery.trim()} />;
    }
    return null;
  }, [hasResults, isStaleResults, deferredQuery]);

  const listContentStyle = useMemo(
    () => [styles.listContent, { paddingTop: scrollPaddingTop }],
    [scrollPaddingTop]
  );

  const pristineContent = (
    <RecentSearchesSection
      queries={scopedRecentQueries}
      onSelect={handleRecentSelect}
      onRemove={removeRecentQuery}
      onClearAll={clearRecentQueries}
    />
  );

  return (
    <View style={styles.container}>
      {isActiveSearch ? (
        <FlashList
          ref={listRef}
          style={styles.list}
          data={results.recordings}
          renderItem={renderRecording}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ResultSeparator}
          ListHeaderComponent={folderHeader}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={listContentStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          drawDistance={400}
        />
      ) : (
        <ScrollView
          ref={pristineScrollRef}
          style={styles.list}
          contentContainerStyle={listContentStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          {pristineContent}
        </ScrollView>
      )}

      <SearchTopChrome
        query={query}
        onChangeText={handleQueryChange}
        onClearQuery={handleClearQuery}
        onSubmit={handleSearchSubmit}
        onClose={handleClose}
      />
    </View>
  );
}

function ResultSeparator() {
  return <View style={styles.itemGap} />;
}

const styles = StyleSheet.create({
  container: screenLayoutStyles.container,
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SEARCH_CHROME_HORIZONTAL_PADDING,
    paddingBottom: SCREEN_LIST_BOTTOM_PADDING,
  },
  itemGap: {
    height: RECORDING_LIST_ITEM_GAP,
  },
  folderBlock: {
    marginBottom: Spacing.sm,
    gap: 7,
  },
  folderRow: {
    paddingHorizontal: Spacing.sm,
  },
  itemsSectionHeader: {
    marginTop: Spacing.sm,
  },
});
