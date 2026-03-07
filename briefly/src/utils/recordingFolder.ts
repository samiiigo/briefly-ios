import { Recording, RecordingFolder } from '../types';

export function resolveRecordingFolder(recording: Recording): RecordingFolder {
  if (recording.folder) return recording.folder;
  if (recording.isArchived) return 'archived';
  if (recording.isFavorite) return 'favorites';
  return 'unlisted';
}

export function folderFlagsFor(folder: RecordingFolder): Pick<Recording, 'folder' | 'isFavorite' | 'isArchived'> {
  return {
    folder,
    isFavorite: folder === 'favorites',
    isArchived: folder === 'archived',
  };
}
