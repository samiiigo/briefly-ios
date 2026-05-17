import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { RecordingService } from '@/services/audio';
import { useActiveSwipeableStore } from '@/context/useActiveSwipeableStore';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useLibraryFolderPreferencesStore } from '@/context/useLibraryFolderPreferencesStore';
import {
  getFolderBrowsePreferences,
  useFolderBrowsePreferencesStore,
} from '@/context/useFolderBrowsePreferencesStore';
import { applyFolderRecordingPreferences } from '@/utils/folders/folderRecordingPreferences';
import { buildFolderSections } from '@/utils/folders/folderBrowse';
import { ensureUniqueTitle } from '@/utils';
import { RecentsEntryCard } from '@/components/features/recents/RecentsEntryCard';
import { RecordingCard } from '@/components/features/recording/RecordingCard';
import { RecordingSwipeableRow } from '@/components/features/recording/RecordingSwipeableRow';
import { RecordButton } from '@/components/features/recording/RecordButton';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import { FolderViewOptionsSheet } from '@/components/features/library/FolderViewOptionsSheet';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { TopBlurFade } from '@/components/navigation/TopBlurFade';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { screenLayoutStyles as sl } from '@/components/navigation/screenLayout';
import { Recording } from '@/types';
import { resolveRecordingFolder } from '@/utils/folders/recordingFolder';
import { Colors, Spacing, withAppFont } from '@/theme';

const LIST_BOTTOM_PADDING = 140;

export default function FolderRecordingsScreen() {
  const { scrollPaddingTop, topInset } = useTopChromeLayout();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; folderName?: string; folderType?: string }>();
  const folderId = params.id!;
  const folderName = params.folderName ?? folderId;
  const folderType = (params.folderType ?? 'built-in') as 'built-in' | 'user';
  const recordings = useRecordingStore((s) => s.recordings);
  const deleteRecording = useRecordingStore((s) => s.deleteRecording);
  const restoreRecording = useRecordingStore((s) => s.restoreRecording);
  const permanentDelete = useRecordingStore((s) => s.permanentDelete);
  const updateRecording = useRecordingStore((s) => s.updateRecording);
  const prefs = useLibraryFolderPreferencesStore(
    useShallow((s) => ({ datePreset: s.datePreset, scopeRefinement: s.scopeRefinement }))
  );
  const folderKey = useMemo(() => `${folderType}:${folderId}`, [folderType, folderId]);
  const byFolder = useFolderBrowsePreferencesStore((s) => s.byFolder);
  const browse = useMemo(
    () => getFolderBrowsePreferences(byFolder, folderKey),
    [byFolder, folderKey]
  );
  const [now, setNow] = useState(() => Date.now());
  const [viewSheetVisible, setViewSheetVisible] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const isRecentlyDeleted = folderId === 'recently-deleted';

  const filtered = useMemo(() => {
    if (folderType === 'built-in') {
      if (folderId === 'all') return recordings;
      if (folderId === 'unlisted') {
        return recordings.filter(
          (r) => r.deletedAt == null && resolveRecordingFolder(r) === 'unlisted'
        );
      }
      if (folderId === 'favorites') {
        return recordings.filter((r) => r.deletedAt == null && r.isFavorite);
      }
      if (folderId === 'imports') {
        return recordings.filter((r) => r.deletedAt == null && !!r.isImported);
      }
      return recordings.filter((r) => resolveRecordingFolder(r) === folderId);
    }
    return recordings.filter((r) => r.userFolderId === folderId);
  }, [recordings, folderId, folderType]);

  const afterLibraryFilters = useMemo(
    () => applyFolderRecordingPreferences(filtered, prefs, now),
    [filtered, prefs, now]
  );
  const afterBrowseFilter = useMemo(
    () =>
      browse.favoritesOnly
        ? afterLibraryFilters.filter((r) => r.deletedAt == null && !!r.isFavorite)
        : afterLibraryFilters,
    [afterLibraryFilters, browse.favoritesOnly]
  );
  const sections = useMemo(
    () => buildFolderSections(afterBrowseFilter, browse),
    [afterBrowseFilter, browse]
  );
  const effectiveLayout = browse.layout;
  const flatData = useMemo(() => sections.flatMap((s) => s.data), [sections]);
  const listEmpty = afterBrowseFilter.length === 0;

  const handleRename = useCallback(
    async (recording: Recording, newTitle: string) => {
      const existingTitles = recordings
        .filter((r) => r.id !== recording.id)
        .map((r) => r.title);
      try {
        await updateRecording(recording.id, {
          title: ensureUniqueTitle(newTitle, existingTitles),
        });
      } catch (err) {
        console.error('Failed to rename recording:', err);
      }
    },
    [recordings, updateRecording]
  );

  const handleRecordIntoFolder = useCallback(async () => {
    if (isRecentlyDeleted) return;
    const granted = await RecordingService.requestPermissions();
    if (!granted) return;
    if (folderType === 'user') {
      router.push({
        pathname: '/recording/new',
        params: { targetFolder: 'unlisted', targetUserFolderId: folderId },
      });
    } else if (folderId === 'archived') {
      router.push({ pathname: '/recording/new', params: { targetFolder: 'archived' } });
    } else if (folderId === 'imports') {
      router.push({
        pathname: '/recording/new',
        params: { targetFolder: 'unlisted', markImported: 'true' },
      });
    } else {
      router.push({ pathname: '/recording/new', params: { targetFolder: 'unlisted' } });
    }
  }, [router, folderType, folderId, isRecentlyDeleted]);

  const renderListCard = useCallback(
    (item: Recording) => (
      <RecordingSwipeableRow
        recording={item}
        onPress={() => router.push(`/recording/${item.id}`)}
        onDelete={
          isRecentlyDeleted ? () => permanentDelete(item.id) : () => deleteRecording(item.id)
        }
        onRestore={isRecentlyDeleted ? () => restoreRecording(item.id) : undefined}
        isRecentlyDeleted={isRecentlyDeleted}
      >
        <RecentsEntryCard
          recording={item}
          onPress={() => router.push(`/recording/${item.id}`)}
          onDelete={
            isRecentlyDeleted ? () => permanentDelete(item.id) : () => deleteRecording(item.id)
          }
          onRename={(newTitle) => handleRename(item, newTitle)}
        />
      </RecordingSwipeableRow>
    ),
    [
      router,
      isRecentlyDeleted,
      permanentDelete,
      deleteRecording,
      restoreRecording,
      handleRename,
    ]
  );

  const renderGridCard = useCallback(
    (item: Recording, compact: boolean) => (
      <RecordingSwipeableRow
        recording={item}
        onPress={() => router.push(`/recording/${item.id}`)}
        onDelete={
          isRecentlyDeleted ? () => permanentDelete(item.id) : () => deleteRecording(item.id)
        }
        onRestore={isRecentlyDeleted ? () => restoreRecording(item.id) : undefined}
        isRecentlyDeleted={isRecentlyDeleted}
      >
        <RecordingCard
          recording={item}
          compact={compact}
          onPress={() => router.push(`/recording/${item.id}`)}
          onDelete={
            isRecentlyDeleted ? () => permanentDelete(item.id) : () => deleteRecording(item.id)
          }
          onRestore={isRecentlyDeleted ? () => restoreRecording(item.id) : undefined}
        />
      </RecordingSwipeableRow>
    ),
    [router, isRecentlyDeleted, permanentDelete, deleteRecording, restoreRecording]
  );

  const renderGridItem: ListRenderItem<Recording> = useCallback(
    ({ item }) => <View style={styles.gridCell}>{renderGridCard(item, true)}</View>,
    [renderGridCard]
  );

  const closeOpenSwipe = useCallback(() => {
    useActiveSwipeableStore.getState().closeActive();
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => closeOpenSwipe();
    }, [closeOpenSwipe])
  );

  return (
    <View style={sl.container}>
      {listEmpty ? (
        <View style={[styles.emptyWrap, { paddingTop: scrollPaddingTop }]}>
          <Text style={styles.emptyText}>No recordings match this view.</Text>
        </View>
      ) : effectiveLayout === 'grid' ? (
        <FlatList
          key={`grid-${folderKey}`}
          data={flatData}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[styles.listContent, { paddingTop: scrollPaddingTop }]}
          renderItem={renderGridItem}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={closeOpenSwipe}
          onMomentumScrollBegin={closeOpenSwipe}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingTop: scrollPaddingTop }]}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={closeOpenSwipe}
          onMomentumScrollBegin={closeOpenSwipe}
          ItemSeparatorComponent={() => <View style={sl.listItemGap} />}
          SectionSeparatorComponent={() => <View style={sl.listSectionGap} />}
          renderSectionHeader={({ section }) =>
            section.title ? (
              <Text style={sl.listSectionHeader}>{section.title}</Text>
            ) : null
          }
          renderItem={({ item }) => renderListCard(item)}
        />
      )}

      {!isRecentlyDeleted ? (
        <RecordButton onPress={handleRecordIntoFolder} />
      ) : null}

      <FolderViewOptionsSheet
        visible={viewSheetVisible}
        folderKey={folderKey}
        onClose={() => setViewSheetVisible(false)}
      />

      <TopBlurFade />
      <View style={[sl.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
        <StackScreenHeader
          title={folderName}
          showBack
          onBack={() => {
            closeOpenSwipe();
            router.back();
          }}
          trailing={
            <CircularIconButton
              icon="funnel-outline"
              accessibilityLabel="Filters"
              onPress={() => setViewSheetVisible(true)}
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: LIST_BOTTOM_PADDING,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  gridCell: {
    flex: 1,
    maxWidth: '50%',
    paddingHorizontal: 4,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: LIST_BOTTOM_PADDING,
  },
  emptyText: withAppFont({
    fontSize: 15,
    fontWeight: '500',
    color: Colors.subtext,
    textAlign: 'center',
  }),
});
