import type { Recording, UserFolder } from '@briefly/types';

export interface DashboardStats {
  totalRecordings: number;
  activeRecordings: number;
  deletedRecordings: number;
  totalDurationSeconds: number;
  totalFolders: number;
  favoritesCount: number;
}

/** Aggregate library metrics for dashboard views. */
export function computeDashboardStats(
  recordings: Recording[],
  folders: UserFolder[],
): DashboardStats {
  const active = filterActiveRecordings(recordings);

  return {
    totalRecordings: recordings.length,
    activeRecordings: active.length,
    deletedRecordings: recordings.length - active.length,
    totalDurationSeconds: active.reduce((sum, recording) => sum + recording.duration, 0),
    totalFolders: folders.length,
    favoritesCount: active.filter((recording) => recording.isFavorite).length,
  };
}

/** Recordings that are not soft-deleted or archived. */
export function filterActiveRecordings(recordings: Recording[]): Recording[] {
  return recordings.filter((recording) => recording.deletedAt == null && !recording.isArchived);
}

/** Move a recording to Recently Deleted via deletedAt timestamp. */
export function softDeleteRecording(recording: Recording): Recording {
  return {
    ...recording,
    deletedAt: Date.now(),
    folder: 'recently-deleted',
    updatedAt: Date.now(),
  };
}

/** Clear deletedAt and restore default folder when applicable. */
export function restoreRecording(recording: Recording): Recording {
  return {
    ...recording,
    deletedAt: undefined,
    folder: recording.folder === 'recently-deleted' ? 'unlisted' : recording.folder,
    updatedAt: Date.now(),
  };
}
