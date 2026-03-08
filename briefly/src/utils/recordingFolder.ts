import { Recording, RecordingFolder } from '../types';

/**
 * Resolves the primary system folder bucket for a recording.
 *
 * Favorites are modeled as a separate boolean flag and do not
 * change the underlying folder bucket; a favorite recording is
 * typically still "unlisted" or "archived".
 */
export function resolveRecordingFolder(recording: Recording): RecordingFolder {
  if (recording.deletedAt != null) {
    return 'recently-deleted';
  }

  // Archived recordings always live in the archived bucket.
  if (recording.isArchived) {
    return 'archived';
  }

  // Respect any persisted folder value that still matches the current union.
  if (recording.folder === 'archived' || recording.folder === 'unlisted') {
    return recording.folder;
  }

  // Ignore legacy "favorites" folder values – favorites are a state,
  // exposed via `isFavorite` and library filters, not as a folder.
  return 'unlisted';
}

export function folderFlagsFor(
  folder: RecordingFolder
): Pick<Recording, 'folder' | 'isFavorite' | 'isArchived' | 'deletedAt'> {
  if (folder === 'recently-deleted') {
    return {
      folder: 'unlisted',
      isFavorite: false,
      isArchived: false,
      deletedAt: Date.now(),
    };
  }

  if (folder === 'archived') {
    return {
      folder: 'archived',
      isFavorite: false,
      isArchived: true,
      deletedAt: undefined,
    };
  }

  // 'unlisted' default bucket – favorites are modeled via `isFavorite`.
  return {
    folder: 'unlisted',
    isFavorite: false,
    isArchived: false,
    deletedAt: undefined,
  };
}
