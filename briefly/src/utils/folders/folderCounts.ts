import { Recording } from '@/types';
import { resolveRecordingFolder } from './recordingFolder';
/** Single-pass counts for library folder tiles (avoids O(folders × recordings) filters). */
export interface LibraryFolderCounts {
  all: number;
  unlisted: number;
  imports: number;
  favorites: number;
  archived: number;
  recentlyDeleted: number;
  byUserFolderId: Map<string, number>;
}
export function computeLibraryFolderCounts(recordings: Recording[]): LibraryFolderCounts {
  const counts: LibraryFolderCounts = {
    all: recordings.length,
    unlisted: 0,
    imports: 0,
    favorites: 0,
    archived: 0,
    recentlyDeleted: 0,
    byUserFolderId: new Map(),
  };
  for (const r of recordings) {
    if (r.userFolderId) {
      const id = r.userFolderId;
      counts.byUserFolderId.set(id, (counts.byUserFolderId.get(id) ?? 0) + 1);
    }
    if (r.deletedAt != null) {
      if (resolveRecordingFolder(r) === 'recently-deleted') {
        counts.recentlyDeleted++;
      }
      continue;
    }
    if (r.isImported) counts.imports++;
    if (r.isFavorite) counts.favorites++;
    const folder = resolveRecordingFolder(r);
    if (folder === 'unlisted') counts.unlisted++;
    if (folder === 'archived') counts.archived++;
  }
  return counts;
}
