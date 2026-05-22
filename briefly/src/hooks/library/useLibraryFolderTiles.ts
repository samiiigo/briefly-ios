import { useCallback, useEffect, useMemo } from 'react';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useUserFolderStore } from '@/context/useUserFolderStore';
import { useThemedColors } from '@/theme';
import {
  BUILT_IN_LIBRARY_FOLDERS,
  BUILT_IN_UTILITY_FOLDERS,
  type BuiltInFolderDef,
} from '@/constants/builtInFolders';
import { computeLibraryFolderCounts } from '@/utils/folders/folderCounts';
import { mapBuiltInFolderTile, type FolderTile } from '@/utils/folders/libraryFolderModel';
export function useLibraryFolderTiles() {
  const colors = useThemedColors();
  const recordings = useRecordingStore((s) => s.recordings);
  const { folders, loadFolders } = useUserFolderStore();
  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);
  const folderCounts = useMemo(
    () => computeLibraryFolderCounts(recordings),
    [recordings],
  );
  const countForBuiltIn = useCallback(
    (id: string) => {
      switch (id) {
        case 'all':
          return folderCounts.all;
        case 'unlisted':
          return folderCounts.unlisted;
        case 'imports':
          return folderCounts.imports;
        case 'favorites':
          return folderCounts.favorites;
        case 'archived':
          return folderCounts.archived;
        case 'recently-deleted':
          return folderCounts.recentlyDeleted;
        default:
          return 0;
      }
    },
    [folderCounts],
  );
  const countForUserFolder = useCallback(
    (id: string) => folderCounts.byUserFolderId.get(id) ?? 0,
    [folderCounts],
  );
  const mapBuiltIn = useCallback(
    (f: BuiltInFolderDef): FolderTile => mapBuiltInFolderTile(f, countForBuiltIn(f.id)),
    [countForBuiltIn],
  );
  const { builtInTiles, utilityTiles, userTiles } = useMemo(() => {
    const builtIn = BUILT_IN_LIBRARY_FOLDERS.map(mapBuiltIn);
    const utility = BUILT_IN_UTILITY_FOLDERS.map(mapBuiltIn);
    const user: FolderTile[] = folders.map((f) => ({
      id: f.id,
      name: f.name,
      folderType: 'user' as const,
      icon: 'folder',
      accent: colors.folderUserIcon,
      count: countForUserFolder(f.id),
      pinned: !!f.pinned,
    }));
    return { builtInTiles: builtIn, utilityTiles: utility, userTiles: user };
  }, [colors.folderUserIcon, countForUserFolder, folders, mapBuiltIn]);
  const allUserTilesByName = useMemo(
    () =>
      [...userTiles].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [userTiles],
  );
  return {
    recordings,
    folders,
    builtInTiles,
    utilityTiles,
    userTiles,
    allUserTilesByName,
    countForUserFolder,
  };
}
