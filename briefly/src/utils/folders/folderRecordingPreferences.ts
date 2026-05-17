import { Recording } from '@/types';
import { LibraryDatePreset, LibraryScopeRefinement } from '@/context/useLibraryFolderPreferencesStore';
import { resolveRecordingFolder } from './recordingFolder';

export function filterRecordingsByDatePreset(
  recordings: Recording[],
  preset: LibraryDatePreset,
  now: number
): Recording[] {
  if (preset === 'all') return recordings;

  const d = new Date(now);
  const startOfToday = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const ms7 = 7 * 24 * 60 * 60 * 1000;
  const ms30 = 30 * 24 * 60 * 60 * 1000;

  return recordings.filter((r) => {
    if (preset === 'today') return r.createdAt >= startOfToday;
    if (preset === 'last7') return r.createdAt >= now - ms7;
    if (preset === 'last30') return r.createdAt >= now - ms30;
    return true;
  });
}

export function filterRecordingsByScope(
  recordings: Recording[],
  scope: LibraryScopeRefinement
): Recording[] {
  if (scope === 'none') return recordings;

  return recordings.filter((r) => {
    if (scope === 'favorites') return !!r.isFavorite;
    if (scope === 'archived') return resolveRecordingFolder(r) === 'archived';
    if (scope === 'unlisted') {
      return r.deletedAt == null && resolveRecordingFolder(r) === 'unlisted';
    }
    return true;
  });
}

/** Library hub filters only (date + scope). Sorting is controlled per folder in the folder screen. */
export function applyFolderRecordingPreferences(
  recordings: Recording[],
  prefs: {
    datePreset: LibraryDatePreset;
    scopeRefinement: LibraryScopeRefinement;
  },
  now: number
): Recording[] {
  let out = filterRecordingsByDatePreset(recordings, prefs.datePreset, now);
  out = filterRecordingsByScope(out, prefs.scopeRefinement);
  return out;
}
