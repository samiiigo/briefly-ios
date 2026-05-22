/**
 * filterFolderRecordings
 *
 * Maps recordings to a built-in or user folder.
 */
import type { Recording } from '@/types';
import { resolveRecordingFolder } from '@/utils/folders/recordingFolder';
export function filterRecordingsForFolder(
  recordings: Recording[],
  folderId: string,
  folderType: 'built-in' | 'user',
): Recording[] {
  if (folderType === 'user') {
    return recordings.filter((r) => r.userFolderId === folderId);
  }
  if (folderId === 'all') return recordings;
  if (folderId === 'unlisted') {
    return recordings.filter(
      (r) => r.deletedAt == null && resolveRecordingFolder(r) === 'unlisted',
    );
  }
  if (folderId === 'favorites') {
    return recordings.filter((r) => r.deletedAt == null && r.isFavorite);
  }
  if (folderId === 'imports') {
    return recordings.filter((r) => r.deletedAt == null && !!r.isImported);
  }
  return recordings.filter((r) => resolveRecordingFolder(r) === folderId);
}
export function applyFavoritesOnlyFilter(
  recordings: Recording[],
  favoritesOnly: boolean,
  isRecentlyDeleted: boolean,
): Recording[] {
  if (isRecentlyDeleted || !favoritesOnly) return recordings;
  return recordings.filter((r) => r.deletedAt == null && !!r.isFavorite);
}
