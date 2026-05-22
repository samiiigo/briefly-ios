import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import {
  getFolderBrowsePreferences,
  useFolderBrowsePreferencesStore,
} from '@/context/useFolderBrowsePreferencesStore';
import { buildFolderSections } from '@/utils/folders/folderBrowse';
import {
  applyFavoritesOnlyFilter,
  filterRecordingsForFolder,
} from '@/utils/folders/filterFolderRecordings';
import { useRecordingRename } from '@/hooks/recording/useRecordingRename';
import { useSwipeableListChrome } from '@/hooks/common/useSwipeableListChrome';
import type { Recording } from '@/types';
import type { RecordingListGroupPosition } from '@/utils/list/flattenRecordingSections';
export interface FolderRecordingsRouteParams {
  folderId: string;
  folderName?: string;
  folderType?: string;
}
export function useFolderRecordingsScreen(params: FolderRecordingsRouteParams) {
  const router = useRouter();
  const folderId = params.folderId;
  const folderName = params.folderName ?? folderId;
  const folderType = (params.folderType ?? 'built-in') as 'built-in' | 'user';
  const recordings = useRecordingStore((s) => s.recordings);
  const deleteRecording = useRecordingStore((s) => s.deleteRecording);
  const restoreRecording = useRecordingStore((s) => s.restoreRecording);
  const permanentDelete = useRecordingStore((s) => s.permanentDelete);
  const permanentDeleteAll = useRecordingStore((s) => s.permanentDeleteAll);
  const folderKey = useMemo(() => `${folderType}:${folderId}`, [folderType, folderId]);
  const byFolder = useFolderBrowsePreferencesStore((s) => s.byFolder);
  const browse = useMemo(
    () => getFolderBrowsePreferences(byFolder, folderKey),
    [byFolder, folderKey],
  );
  const [viewSheetVisible, setViewSheetVisible] = useState(false);
  const isRecentlyDeleted = folderId === 'recently-deleted';
  const handleRename = useRecordingRename();
  const { closeOpenSwipe } = useSwipeableListChrome();
  const filtered = useMemo(
    () => filterRecordingsForFolder(recordings, folderId, folderType),
    [recordings, folderId, folderType],
  );
  const afterShowFilter = useMemo(
    () => applyFavoritesOnlyFilter(filtered, browse.favoritesOnly, isRecentlyDeleted),
    [browse.favoritesOnly, filtered, isRecentlyDeleted],
  );
  const sections = useMemo(
    () => buildFolderSections(afterShowFilter, browse),
    [afterShowFilter, browse],
  );
  const flatData = useMemo(() => sections.flatMap((s) => s.data), [sections]);
  const listEmpty = afterShowFilter.length === 0;
  const effectiveLayout = browse.layout;
  const openRecording = useCallback(
    (id: string) => router.push(`/recording/${id}`),
    [router],
  );
  const deleteForItem = useCallback(
    (item: Recording) => {
      if (isRecentlyDeleted) permanentDelete(item.id);
      else deleteRecording(item.id);
    },
    [deleteRecording, isRecentlyDeleted, permanentDelete],
  );
  const renderListCard = useCallback(
    (item: Recording, groupPosition: RecordingListGroupPosition) => ({
      recording: item,
      groupPosition,
      onPress: () => openRecording(item.id),
      onDelete: () => deleteForItem(item),
      onRename: (newTitle: string) => handleRename(item, newTitle),
      onRestore: isRecentlyDeleted ? () => restoreRecording(item.id) : undefined,
      isRecentlyDeleted,
    }),
    [deleteForItem, handleRename, isRecentlyDeleted, openRecording, restoreRecording],
  );
  const renderGridCard = useCallback(
    (item: Recording, compact: boolean) => ({
      recording: item,
      compact,
      onPress: () => openRecording(item.id),
      onDelete: () => deleteForItem(item),
      onRename: (newTitle: string) => handleRename(item, newTitle),
      onRestore: isRecentlyDeleted ? () => restoreRecording(item.id) : undefined,
      isRecentlyDeleted,
    }),
    [deleteForItem, handleRename, isRecentlyDeleted, openRecording, restoreRecording],
  );
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
      ],
    );
  }, [afterShowFilter, closeOpenSwipe, permanentDeleteAll]);
  const goBack = useCallback(() => {
    closeOpenSwipe();
    router.back();
  }, [closeOpenSwipe, router]);
  return {
    folderName,
    folderId,
    folderType,
    folderKey,
    isRecentlyDeleted,
    sections,
    flatData,
    listEmpty,
    effectiveLayout,
    browse,
    viewSheetVisible,
    setViewSheetVisible,
    renderListCard,
    renderGridCard,
    handleDeleteAll,
    closeOpenSwipe,
    goBack,
  };
}
