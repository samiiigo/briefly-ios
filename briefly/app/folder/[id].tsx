import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useActiveSwipeableStore } from '@/context/useActiveSwipeableStore';
import { useRecordingStore } from '@/context/useRecordingStore';
import {
  getFolderBrowsePreferences,
  useFolderBrowsePreferencesStore,
} from '@/context/useFolderBrowsePreferencesStore';
import { buildFolderSections } from '@/utils/folders/folderBrowse';
import { ensureUniqueTitle } from '@/utils';
import { RecentsEntryCard } from '@/components/features/recents/RecentsEntryCard';
import { RecordingCard } from '@/components/features/recording/RecordingCard';
import { RecordingSwipeableRow } from '@/components/features/recording/RecordingSwipeableRow';
import { RecordingSectionFlashList } from '@/components/features/recording/RecordingSectionFlashList';
import { RecordingGridFlashList } from '@/components/features/recording/RecordingGridFlashList';
import { CircularIconButton } from '@/components/ui/CircularIconButton';
import { FolderViewOptionsSheet } from '@/components/features/library/FolderViewOptionsSheet';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { useScreenLayoutStyles } from '@/components/navigation/screenLayout';
import { Recording } from '@/types';
import { resolveRecordingFolder } from '@/utils/folders/recordingFolder';
import type { RecordingListGroupPosition } from '@/utils/list/flattenRecordingSections';
import { Colors, Spacing, withAppFont, useThemedColors } from '@/theme';

const LIST_BOTTOM_PADDING = 140;

export default function FolderRecordingsScreen() {
  const sl = useScreenLayoutStyles();
  const colors = useThemedColors();
  const { scrollPaddingTop } = useTopChromeLayout();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; folderName?: string; folderType?: string }>();
  const folderId = params.id!;
  const folderName = params.folderName ?? folderId;
  const folderType = (params.folderType ?? 'built-in') as 'built-in' | 'user';
  const recordings = useRecordingStore((s) => s.recordings);
  const deleteRecording = useRecordingStore((s) => s.deleteRecording);
  const restoreRecording = useRecordingStore((s) => s.restoreRecording);
  const permanentDelete = useRecordingStore((s) => s.permanentDelete);
  const permanentDeleteAll = useRecordingStore((s) => s.permanentDeleteAll);
  const updateRecording = useRecordingStore((s) => s.updateRecording);
  const folderKey = useMemo(() => `${folderType}:${folderId}`, [folderType, folderId]);
  const byFolder = useFolderBrowsePreferencesStore((s) => s.byFolder);
  const browse = useMemo(
    () => getFolderBrowsePreferences(byFolder, folderKey),
    [byFolder, folderKey]
  );
  const [viewSheetVisible, setViewSheetVisible] = useState(false);

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

  const afterShowFilter = useMemo(
    () =>
      isRecentlyDeleted || !browse.favoritesOnly
        ? filtered
        : filtered.filter((r) => r.deletedAt == null && !!r.isFavorite),
    [filtered, browse.favoritesOnly, isRecentlyDeleted]
  );
  const sections = useMemo(
    () => buildFolderSections(afterShowFilter, browse),
    [afterShowFilter, browse]
  );
  const effectiveLayout = browse.layout;
  const flatData = useMemo(() => sections.flatMap((s) => s.data), [sections]);
  const listEmpty = afterShowFilter.length === 0;

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

  const renderListCard = useCallback(
    (item: Recording, groupPosition: RecordingListGroupPosition) => (
      <RecordingSwipeableRow
        recording={item}
        onPress={() => router.push(`/recording/${item.id}`)}
        onDelete={
          isRecentlyDeleted ? () => permanentDelete(item.id) : () => deleteRecording(item.id)
        }
        onRename={(newTitle) => handleRename(item, newTitle)}
        onRestore={isRecentlyDeleted ? () => restoreRecording(item.id) : undefined}
        isRecentlyDeleted={isRecentlyDeleted}
      >
        <RecentsEntryCard recording={item} groupPosition={groupPosition} />
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
        onRename={(newTitle) => handleRename(item, newTitle)}
        onRestore={isRecentlyDeleted ? () => restoreRecording(item.id) : undefined}
        isRecentlyDeleted={isRecentlyDeleted}
      >
        <RecordingCard recording={item} compact={compact} />
      </RecordingSwipeableRow>
    ),
    [router, isRecentlyDeleted, permanentDelete, deleteRecording, restoreRecording, handleRename]
  );

  const renderGridItem = useCallback(
    (item: Recording) => renderGridCard(item, true),
    [renderGridCard],
  );

  const closeOpenSwipe = useCallback(() => {
    useActiveSwipeableStore.getState().closeActive();
  }, []);

  const handleDeleteAll = useCallback(() => {
    closeOpenSwipe();
    const count = afterShowFilter.length;
    if (count === 0) return;
    Alert.alert(
      'Delete all',
      count === 1
        ? 'This recording will be removed permanently and cannot be recovered.'
        : `All ${count} recordings will be removed permanently and cannot be recovered.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => permanentDeleteAll(afterShowFilter.map((r) => r.id)),
        },
      ]
    );
  }, [afterShowFilter, closeOpenSwipe, permanentDeleteAll]);

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
        <RecordingGridFlashList
          data={flatData}
          renderItem={renderGridItem}
          contentContainerStyle={[styles.listContent, { paddingTop: scrollPaddingTop }]}
          onScrollBeginDrag={closeOpenSwipe}
          onMomentumScrollBegin={closeOpenSwipe}
        />
      ) : (
        <RecordingSectionFlashList
          sections={sections}
          renderRecording={renderListCard}
          sectionHeaderStyle={sl.listSectionHeader}
          contentContainerStyle={[styles.listContent, { paddingTop: scrollPaddingTop }]}
          onScrollBeginDrag={closeOpenSwipe}
          onMomentumScrollBegin={closeOpenSwipe}
        />
      )}

      {!isRecentlyDeleted ? (
        <FolderViewOptionsSheet
          visible={viewSheetVisible}
          folderKey={folderKey}
          folderId={folderId}
          folderType={folderType}
          onClose={() => setViewSheetVisible(false)}
        />
      ) : null}

      <StackScreenHeader
        title={folderName}
        showBack
        onBack={() => {
          closeOpenSwipe();
          router.back();
        }}
        trailing={
          isRecentlyDeleted ? (
            <Pressable
              onPress={handleDeleteAll}
              disabled={listEmpty}
              accessibilityLabel="Delete all"
              accessibilityRole="button"
              hitSlop={8}
              style={({ pressed }) => [
                styles.deleteAllBtn,
                listEmpty && styles.deleteAllBtnDisabled,
                pressed && !listEmpty && styles.deleteAllBtnPressed,
              ]}
            >
              <Text
                style={[
                  styles.deleteAllText,
                  { color: colors.danger },
                  listEmpty && styles.deleteAllTextDisabled,
                ]}
              >
                Delete All
              </Text>
            </Pressable>
          ) : (
            <CircularIconButton
              icon="funnel-outline"
              accessibilityLabel="Filters"
              onPress={() => setViewSheetVisible(true)}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: LIST_BOTTOM_PADDING,
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
  deleteAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  deleteAllBtnPressed: {
    opacity: 0.7,
  },
  deleteAllBtnDisabled: {
    opacity: 0.35,
  },
  deleteAllText: withAppFont({
    fontSize: 17,
    fontWeight: '600',
  }),
  deleteAllTextDisabled: {
    opacity: 0.5,
  },
});
