import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, type GestureResponderEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import { useUserFolderStore } from '@/features/library/state/useUserFolderStore';
import { useFolderListLayoutStore } from '@/features/library/state/useFolderListLayoutStore';
import { useAnchoredMenu } from '@briefly/ui/native';
import { buildUserFolderMenuItems } from '@/features/library/utils/userFolderActions';
import { buildLibraryFolderSections } from '@/features/library/utils/buildLibraryFolderSections';
import type { FolderTile, LibraryFolderSection } from '@/features/library/utils/libraryFolderModel';
import { MAX_YOUR_FOLDERS_PREVIEW, type UserFolderListFilter } from '@briefly/config';
import { useLibraryFolderTiles } from './useLibraryFolderTiles';
export interface UseLibraryFolderBrowserOptions {
  maxPinnedFolders?: number;
  maxYourFolders?: number;
  showBack?: boolean;
  folderListFilter?: UserFolderListFilter;
}
export function useLibraryFolderBrowser({
  maxPinnedFolders,
  maxYourFolders = MAX_YOUR_FOLDERS_PREVIEW,
  showBack = false,
  folderListFilter,
}: UseLibraryFolderBrowserOptions) {
  const router = useRouter();
  const layout = useFolderListLayoutStore((s) => s.layout);
  const updateRecording = useRecordingStore((s) => s.updateRecording);
  const { recordings, builtInTiles, utilityTiles, userTiles, allUserTilesByName } =
    useLibraryFolderTiles();
  const { addFolder, renameFolder, deleteFolder, toggleFolderPinned } = useUserFolderStore();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [renameFolderTarget, setRenameFolderTarget] = useState<FolderTile | null>(null);
  const folderMenu = useAnchoredMenu();
  const [folderMenuTarget, setFolderMenuTarget] = useState<FolderTile | null>(null);
  const sections = useMemo<LibraryFolderSection[]>(
    () =>
      buildLibraryFolderSections({
        builtInTiles,
        utilityTiles,
        userTiles,
        allUserTilesByName,
        maxPinnedFolders,
        maxYourFolders,
        showBack,
        folderListFilter,
      }),
    [
      allUserTilesByName,
      builtInTiles,
      folderListFilter,
      maxPinnedFolders,
      maxYourFolders,
      showBack,
      userTiles,
      utilityTiles,
    ],
  );
  const openSeeAll = useCallback(
    (filter: UserFolderListFilter) => {
      router.push({ pathname: '/folder', params: { list: filter } });
    },
    [router],
  );
  const handleAddFolder = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'New Folder',
        undefined,
        (text) => {
          const trimmed = text?.trim();
          if (trimmed) {
            addFolder(trimmed).catch((err: unknown) =>
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not create folder'),
            );
          }
        },
        'plain-text',
        '',
      );
    } else {
      setAddModalVisible(true);
    }
  }, [addFolder]);
  const openFolder = useCallback(
    (folderId: string, folderName: string, folderType: 'built-in' | 'user') => {
      router.push({ pathname: `/folder/${folderId}` as const, params: { folderName, folderType } });
    },
    [router],
  );
  const handleToggleUserFolderPin = useCallback(
    (id: string) => {
      void toggleFolderPinned(id).catch((err: unknown) =>
        Alert.alert('Error', err instanceof Error ? err.message : 'Could not update folder'),
      );
    },
    [toggleFolderPinned],
  );
  const folderMenuItems = useMemo(() => {
    if (!folderMenuTarget) return [];
    const folder = folderMenuTarget;
    const recordingCount = recordings.filter((r) => r.userFolderId === folder.id).length;
    return buildUserFolderMenuItems(
      folder.name,
      !!folder.pinned,
      {
        onRename: (newName) =>
          renameFolder(folder.id, newName).catch((err: unknown) =>
            Alert.alert('Error', err instanceof Error ? err.message : 'Could not rename folder'),
          ),
        onTogglePin: () => handleToggleUserFolderPin(folder.id),
        onDelete: () => {
          Alert.alert(
            'Delete Folder',
            recordingCount > 0
              ? `Delete "${folder.name}"? ${recordingCount} recording${recordingCount === 1 ? '' : 's'} will move to Unlisted.`
              : `Delete "${folder.name}"?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  void (async () => {
                    try {
                      const inFolder = recordings.filter((r) => r.userFolderId === folder.id);
                      await Promise.all(
                        inFolder.map((r) => updateRecording(r.id, { userFolderId: undefined })),
                      );
                      await deleteFolder(folder.id);
                    } catch (err: unknown) {
                      Alert.alert(
                        'Error',
                        err instanceof Error ? err.message : 'Could not delete folder',
                      );
                    }
                  })();
                },
              },
            ],
          );
        },
      },
      () => setRenameFolderTarget(folder),
    );
  }, [
    deleteFolder,
    folderMenuTarget,
    handleToggleUserFolderPin,
    recordings,
    renameFolder,
    updateRecording,
  ]);
  const handleUserFolderLongPress = useCallback(
    (folder: FolderTile, event: GestureResponderEvent) => {
      setFolderMenuTarget(folder);
      const { pageX, pageY } = event.nativeEvent;
      requestAnimationFrame(() => folderMenu.openAtPoint(pageX, pageY));
    },
    [folderMenu],
  );
  const closeFolderMenu = useCallback(() => {
    folderMenu.close();
    setFolderMenuTarget(null);
  }, [folderMenu]);
  const submitNewFolderName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      addFolder(trimmed)
        .then(() => setAddModalVisible(false))
        .catch((err: unknown) =>
          Alert.alert('Error', err instanceof Error ? err.message : 'Could not create folder'),
        );
    },
    [addFolder],
  );
  const submitRenameFolder = useCallback(
    (name: string) => {
      if (!renameFolderTarget) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      renameFolder(renameFolderTarget.id, trimmed)
        .then(() => setRenameFolderTarget(null))
        .catch((err: unknown) =>
          Alert.alert('Error', err instanceof Error ? err.message : 'Could not rename folder'),
        );
    },
    [renameFolder, renameFolderTarget],
  );
  return {
    layout,
    sections,
    openSeeAll,
    handleAddFolder,
    openFolder,
    handleToggleUserFolderPin,
    folderMenuItems,
    folderMenu,
    handleUserFolderLongPress,
    closeFolderMenu,
    addModalVisible,
    setAddModalVisible,
    renameFolderTarget,
    setRenameFolderTarget,
    submitNewFolderName,
    submitRenameFolder,
  };
}
