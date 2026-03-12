import { Recording } from '../types';

export type LibraryTabId = 'all' | 'favorites' | 'archived' | 'active' | 'errors';

const notDeleted = (r: Recording) => r.deletedAt == null;

export const LIBRARY_TAB_PREDICATES: Record<LibraryTabId, (recording: Recording) => boolean> = {
  // All non-deleted recordings.
  all: (r) => notDeleted(r),

  // "Unlisted" = non-deleted, non-archived, non-favorited.
  active: (r) => notDeleted(r) && !r.isArchived && !r.isFavorite,

  // Favorites are modeled purely via the isFavorite flag.
  favorites: (r) => notDeleted(r) && !!r.isFavorite && !r.isArchived,

  // Archived recordings – favorites here are treated as archived first.
  archived: (r) => notDeleted(r) && !!r.isArchived,

  // Errors tab excludes archived recordings (archived is its own bucket).
  errors: (r) => notDeleted(r) && r.status === 'error' && !r.isArchived,
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
