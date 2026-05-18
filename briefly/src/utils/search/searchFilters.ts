import { Recording } from '@/types';
import { SearchFilterId } from '@/constants/search';
import { resolveRecordingFolder } from '@/utils/folders/recordingFolder';

const notDeleted = (r: Recording) => r.deletedAt == null;

export const SEARCH_FILTER_PREDICATES: Record<
  SearchFilterId,
  (recording: Recording) => boolean
> = {
  all: (r) => notDeleted(r),
  unlisted: (r) => notDeleted(r) && resolveRecordingFolder(r) === 'unlisted',
  favorites: (r) => notDeleted(r) && !!r.isFavorite,
  archived: (r) => notDeleted(r) && resolveRecordingFolder(r) === 'archived',
};

export function filterRecordingsBySearchScope(
  recordings: Recording[],
  filterId: SearchFilterId
): Recording[] {
  return recordings.filter(SEARCH_FILTER_PREDICATES[filterId]);
}
