import type { BuiltInFolderDef } from '@/constants/builtInFolders';
import type { UserFolderListFilter } from '@/constants/userFolders';
export interface FolderTile {
  id: string;
  name: string;
  folderType: 'built-in' | 'user';
  icon: string;
  accent: string;
  count: number;
  pinned?: boolean;
}
export const UTILITIES_SECTION_TITLE = 'Utilities';
export type LibraryFolderSection = {
  title: string;
  data: FolderTile[];
  showSeeAll?: boolean;
  seeAllFilter?: UserFolderListFilter;
  variant?: 'default' | 'utility' | 'pinned-row' | 'empty-user-folders';
  emptyMessage?: string;
  pinnedRowData?: FolderTile[];
  hideHeader?: boolean;
  plainUserFolders?: boolean;
};
export function folderItemCountLabel(count: number, variant: 'grid' | 'list'): string {
  if (variant === 'grid') {
    return `${count} ${count === 1 ? 'item' : 'items'}`;
  }
  return `${count} ${count === 1 ? 'recording' : 'recordings'}`;
}
export function userFolderCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'folder' : 'folders'}`;
}
export function mapBuiltInFolderTile(
  folder: BuiltInFolderDef,
  count: number,
): FolderTile {
  return {
    id: folder.id,
    name: folder.name,
    folderType: 'built-in',
    icon: folder.icon,
    accent: folder.accent,
    count,
  };
}
