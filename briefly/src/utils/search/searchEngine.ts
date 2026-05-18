import {
  BUILT_IN_LIBRARY_FOLDERS,
  type BuiltInFolderDef,
} from '@/constants/builtInFolders';
import { Recording, UserFolder } from '@/types';
import { computeLibraryFolderCounts } from '@/utils/folders/folderCounts';

export interface SearchFolderResult {
  id: string;
  name: string;
  folderType: 'built-in' | 'user';
  icon: string;
  accent: string;
  count: number;
}

export interface SearchResults {
  folders: SearchFolderResult[];
  recordings: Recording[];
}

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

function builtInFolderCount(id: string, counts: ReturnType<typeof computeLibraryFolderCounts>): number {
  switch (id) {
    case 'all':
      return counts.all;
    case 'unlisted':
      return counts.unlisted;
    case 'favorites':
      return counts.favorites;
    case 'archived':
      return counts.archived;
    default:
      return 0;
  }
}

function mapBuiltInFolder(
  folder: BuiltInFolderDef,
  counts: ReturnType<typeof computeLibraryFolderCounts>
): SearchFolderResult {
  return {
    id: folder.id,
    name: folder.name,
    folderType: 'built-in',
    icon: folder.icon,
    accent: folder.accent,
    count: builtInFolderCount(folder.id, counts),
  };
}

export function buildSearchableFolders(
  userFolders: UserFolder[],
  recordings: Recording[]
): SearchFolderResult[] {
  const counts = computeLibraryFolderCounts(recordings);
  const builtIn = BUILT_IN_LIBRARY_FOLDERS.map((f) => mapBuiltInFolder(f, counts));
  const user: SearchFolderResult[] = userFolders.map((f) => ({
    id: f.id,
    name: f.name,
    folderType: 'user',
    icon: 'folder',
    accent: 'rgba(255,255,255,0.55)',
    count: counts.byUserFolderId.get(f.id) ?? 0,
  }));
  return [...builtIn, ...user];
}
