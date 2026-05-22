import { useCallback, useMemo } from 'react';
import {
  FolderSortDirection,
  FolderSortField,
  getFolderBrowsePreferences,
  useFolderBrowsePreferencesStore,
} from '@/context/useFolderBrowsePreferencesStore';
import { shouldShowFolderFavoritesFilter } from '@/utils/folders/folderBrowseOptionsModel';
export interface UseFolderBrowseOptionsSheetParams {
  folderKey: string;
  folderId?: string;
  folderType?: 'built-in' | 'user';
}
export function useFolderBrowseOptionsSheet({
  folderKey,
  folderId,
  folderType,
}: UseFolderBrowseOptionsSheetParams) {
  const byFolder = useFolderBrowsePreferencesStore((s) => s.byFolder);
  const setForFolder = useFolderBrowsePreferencesStore((s) => s.setForFolder);
  const resetForFolder = useFolderBrowsePreferencesStore((s) => s.resetForFolder);
  const browse = useMemo(
    () => getFolderBrowsePreferences(byFolder, folderKey),
    [byFolder, folderKey],
  );
  const showFavoritesFilter = shouldShowFolderFavoritesFilter(folderType, folderId);
  const setSortField = useCallback(
    (sortField: FolderSortField) => setForFolder(folderKey, { sortField }),
    [folderKey, setForFolder],
  );
  const setFavoritesOnly = useCallback(
    (favoritesOnly: boolean) => setForFolder(folderKey, { favoritesOnly }),
    [folderKey, setForFolder],
  );
  const setSortDirection = useCallback(
    (sortDirection: FolderSortDirection) => setForFolder(folderKey, { sortDirection }),
    [folderKey, setForFolder],
  );
  const reset = useCallback(() => resetForFolder(folderKey), [folderKey, resetForFolder]);
  return {
    browse,
    showFavoritesFilter,
    setSortField,
    setFavoritesOnly,
    setSortDirection,
    reset,
  };
}
