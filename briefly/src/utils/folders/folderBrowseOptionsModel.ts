import type { FolderSortDirection, FolderSortField } from '@/context/useFolderBrowsePreferencesStore';
export const FOLDER_SHOW_FILTER_OPTIONS: { favoritesOnly: boolean; label: string }[] = [
  { favoritesOnly: false, label: 'All items' },
  { favoritesOnly: true, label: 'Favs only' },
];
export const FOLDER_SORT_FIELD_OPTIONS: { id: FolderSortField; label: string }[] = [
  { id: 'date', label: 'Date' },
  { id: 'name', label: 'Name' },
  { id: 'type', label: 'Type' },
  { id: 'size', label: 'Size' },
];
export const FOLDER_SORT_DIRECTION_OPTIONS: { id: FolderSortDirection; label: string }[] = [
  { id: 'asc', label: 'Ascending' },
  { id: 'desc', label: 'Descending' },
];
/** Hide redundant "Favs only" when already inside the Favorites built-in folder. */
export function shouldShowFolderFavoritesFilter(
  folderType?: 'built-in' | 'user',
  folderId?: string,
): boolean {
  return folderType !== 'built-in' || folderId !== 'favorites';
}
