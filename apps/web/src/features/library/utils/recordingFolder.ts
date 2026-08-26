import { builtInFolderName } from '@briefly/config';
import { Recording, RecordingFolder, UserFolder } from '@briefly/types';

/**
 * Resolves the primary system folder bucket for a recording.
 *
 * Favorites and Imports are item-level flags (`isFavorite`, `isImported`); the
 * library folders are aggregated views. They do not live in separate buckets.
 */
export function resolveRecordingFolder(recording: Recording): RecordingFolder {
  if (recording.deletedAt != null) {
    return 'recently-deleted';
  }
  if (recording.isArchived) {
    return 'archived';
  }
  if (recording.folder === 'archived' || recording.folder === 'unlisted') {
    return recording.folder;
  }
  return 'unlisted';
}

/** User-facing folder name for a recording (user folder or built-in bucket). */
export function getRecordingFolderDisplayName(
  recording: Recording,
  userFolders: UserFolder[] = [],
): string {
  const bucket = resolveRecordingFolder(recording);
  if (bucket === 'recently-deleted') {
    return builtInFolderName('recently-deleted');
  }
  if (recording.userFolderId) {
    const userFolder = userFolders.find((f) => f.id === recording.userFolderId);
    if (userFolder) return userFolder.name;
  }
  if (bucket === 'archived') {
    return builtInFolderName('archived');
  }
  return builtInFolderName('unlisted');
}

/**
 * Maps a target folder to persisted flags. Pass `current` when updating an
 * existing recording so `isFavorite` and `isImported` are preserved (not locations).
 */
export function folderFlagsFor(
  folder: RecordingFolder,
  current?: Pick<Recording, 'isFavorite' | 'isImported'>,
): Pick<Recording, 'folder' | 'isFavorite' | 'isImported' | 'isArchived' | 'deletedAt'> {
  const keepFavorite = !!current?.isFavorite;
  const keepImported = !!current?.isImported;
  if (folder === 'recently-deleted') {
    return {
      folder: 'unlisted',
      isFavorite: keepFavorite,
      isImported: keepImported,
      isArchived: false,
      deletedAt: Date.now(),
    };
  }
  if (folder === 'archived') {
    return {
      folder: 'archived',
      isFavorite: keepFavorite,
      isImported: keepImported,
      isArchived: true,
      deletedAt: undefined,
    };
  }
  return {
    folder: 'unlisted',
    isFavorite: keepFavorite,
    isImported: keepImported,
    isArchived: false,
    deletedAt: undefined,
  };
}
