import { Recording } from '../types';
import { resolveRecordingFolder } from './recordingFolder';

export type LibraryTabId = 'all' | 'favorites' | 'archived' | 'active' | 'errors';

export const LIBRARY_TAB_PREDICATES: Record<LibraryTabId, (recording: Recording) => boolean> = {
  all: () => true,
  active: (r) => resolveRecordingFolder(r) === 'unlisted',
  favorites: (r) => resolveRecordingFolder(r) === 'favorites',
  archived: (r) => resolveRecordingFolder(r) === 'archived',
  errors: (r) => r.status === 'error',
};

export function countByLibraryTab(recordings: Recording[]): Record<LibraryTabId, number> {
  return (Object.keys(LIBRARY_TAB_PREDICATES) as LibraryTabId[]).reduce(
    (acc, tabId) => {
      acc[tabId] = recordings.filter(LIBRARY_TAB_PREDICATES[tabId]).length;
      return acc;
    },
    { all: 0, favorites: 0, archived: 0, active: 0, errors: 0 } as Record<LibraryTabId, number>
  );
}

export function filterByLibraryTab(recordings: Recording[], tabId: LibraryTabId): Recording[] {
  return recordings.filter(LIBRARY_TAB_PREDICATES[tabId]);
}
