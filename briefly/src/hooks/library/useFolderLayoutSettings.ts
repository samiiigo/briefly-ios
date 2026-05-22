import { useCallback, useMemo } from 'react';
import {
  FolderListLayoutMode,
  folderListLayoutDescription,
  folderListLayoutTitle,
  useFolderListLayoutStore,
} from '@/context/useFolderListLayoutStore';
export const FOLDER_LAYOUT_OPTIONS: FolderListLayoutMode[] = ['list', 'grid'];
export function useFolderLayoutSettings() {
  const layout = useFolderListLayoutStore((s) => s.layout);
  const setLayout = useFolderListLayoutStore((s) => s.setLayout);
  const selectLayout = useCallback((mode: FolderListLayoutMode) => setLayout(mode), [setLayout]);
  const options = useMemo(
    () =>
      FOLDER_LAYOUT_OPTIONS.map((mode) => ({
        mode,
        selected: layout === mode,
        title: folderListLayoutTitle(mode),
        subtitle: folderListLayoutDescription(mode),
      })),
    [layout],
  );
  return { layout, options, selectLayout };
}
