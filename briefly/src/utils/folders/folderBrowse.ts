import { Recording } from '@/types';
import {
  FolderBrowsePreferences,
  FolderSortDirection,
  FolderSortField,
} from '@/context/useFolderBrowsePreferencesStore';
import { formatGroupLabel } from '../formatting/formatting';

function compareByField(
  a: Recording,
  b: Recording,
  field: FolderSortField,
  direction: FolderSortDirection
): number {
  const m = direction === 'asc' ? 1 : -1;
  switch (field) {
    case 'date':
      return m * (a.createdAt - b.createdAt);
    case 'name':
      return m * a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    case 'size':
      return m * (a.fileSize - b.fileSize);
    case 'type':
      return m * (typeSortKey(a) - typeSortKey(b));
    default:
      return 0;
  }
}

function typeSortKey(r: Recording): number {
  if (r.status === 'error') return 0;
  const mode = r.processingMode;
  if (mode === 'on-device') return 1;
  if (mode === 'cloud' || mode.startsWith('cloud')) return 2;
  return 3;
}

export function sortRecordingsForBrowse(
  recordings: Recording[],
  field: FolderSortField,
  direction: FolderSortDirection
): Recording[] {
  return [...recordings].sort((a, b) => compareByField(a, b, field, direction));
}

/**
 * Groups recordings under calendar-aware labels (Today, Yesterday, This week, Last week,
 * This month, Last month, then month + year). Preserves the order of `sorted` within each section.
 */
export function groupRecordingsIntoTimeSections(
  sorted: Recording[],
  browse: Pick<FolderBrowsePreferences, 'sortField' | 'sortDirection'>
): { title: string; data: Recording[] }[] {
  if (!sorted.length) return [];

  const map = new Map<string, Recording[]>();
  const sectionOrder: string[] = [];

  for (const r of sorted) {
    const label = formatGroupLabel(r.createdAt);
    let bucket = map.get(label);
    if (!bucket) {
      bucket = [];
      map.set(label, bucket);
      sectionOrder.push(label);
    }
    bucket.push(r);
  }

  // Date sort: section order follows the sorted walk (asc → Yesterday…Today, desc → Today…Yesterday).
  // Other sort fields: Order still flips section headers by newest/oldest bucket.
  const labels =
    browse.sortField === 'date'
      ? sectionOrder
      : orderSectionLabelsByNewest(sectionOrder, map, browse.sortDirection === 'desc');

  return labels.map((title) => ({ title, data: map.get(title)! }));
}

function orderSectionLabelsByNewest(
  labels: string[],
  map: Map<string, Recording[]>,
  newestFirst: boolean
): string[] {
  return [...labels].sort((a, b) => {
    const amax = Math.max(...map.get(a)!.map((x) => x.createdAt));
    const bmax = Math.max(...map.get(b)!.map((x) => x.createdAt));
    return newestFirst ? bmax - amax : amax - bmax;
  });
}

/** Sorts then groups recordings into calendar-aware time sections. */
export function buildFolderSections(
  recordings: Recording[],
  browse: FolderBrowsePreferences
): { title: string; data: Recording[] }[] {
  const sorted = sortRecordingsForBrowse(
    recordings,
    browse.sortField,
    browse.sortDirection
  );
  return groupRecordingsIntoTimeSections(sorted, browse);
}
