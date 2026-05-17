/**
 * Default system folders — single order everywhere (Library, pickers, filters).
 * IDs are stable for navigation and storage; `name` is the user-facing label.
 */
export const BUILT_IN_LIBRARY_FOLDERS = [
  { id: 'all', name: 'All', icon: 'albums' as const, accent: '#5EB0E5' },
  { id: 'favorites', name: 'Favs', icon: 'star' as const, accent: '#FFD60A' },
  { id: 'archived', name: 'Archives', icon: 'archive' as const, accent: '#BF5AF2' },
  { id: 'unlisted', name: 'Unlisted', icon: 'folder-open' as const, accent: '#5AC8FA' },
] as const;

/** Secondary folders shown at the bottom of Library under Utilities. */
export const BUILT_IN_UTILITY_FOLDERS = [
  { id: 'imports', name: 'Imports', icon: 'download-outline' as const, accent: '#34C759' },
  { id: 'recently-deleted', name: 'Deleted', icon: 'trash-outline' as const, accent: '#FF9F9F' },
] as const;

export const BUILT_IN_FOLDERS = [
  ...BUILT_IN_LIBRARY_FOLDERS,
  ...BUILT_IN_UTILITY_FOLDERS,
] as const;

export type BuiltInFolderDef = (typeof BUILT_IN_FOLDERS)[number];
export type BuiltInFolderId = BuiltInFolderDef['id'];

/** Built-in move targets (archive vs active bucket). Full library order is in {@link BUILT_IN_FOLDERS}. */
export const BUILTIN_MOVE_ORDER: readonly ('archived' | 'unlisted')[] = ['archived', 'unlisted'];

export function builtInFolderName(id: BuiltInFolderId): string {
  const row = BUILT_IN_FOLDERS.find((f) => f.id === id);
  return row?.name ?? id;
}
