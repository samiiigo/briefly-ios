import { Recording } from '../../types';
import {
  FolderBrowsePreferences,
  FolderGroupBy,
  FolderSortDirection,
  FolderSortField,
} from '../../store/useFolderBrowsePreferencesStore';
import { formatGroupLabel } from '../formatting';

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

export function getRecordingTypeLabel(r: Recording): string {
  if (r.status === 'error') return 'Errors';
  if (r.processingMode === 'on-device') return 'On-device';
  if (r.processingMode === 'cloud' || r.processingMode.startsWith('cloud')) {
    if (r.processingMode === 'cloud-shared-openrouter') return 'Cloud (shared)';
    if (r.processingMode === 'cloud-user-key') return 'Cloud (your key)';
    return 'Cloud';
  }
  return 'Other';
}

export function sizeBucketLabel(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return 'Under 1 MB';
  if (mb < 10) return '1–10 MB';
  if (mb < 100) return '10–100 MB';
  return 'Over 100 MB';
}

const SIZE_BUCKET_ORDER = ['Under 1 MB', '1–10 MB', '10–100 MB', 'Over 100 MB'];

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
  sorted: Recording[]
): { title: string; data: Recording[] }[] {
  if (!sorted.length) return [];

  const map = new Map<string, Recording[]>();
  for (const r of sorted) {
    const label = formatGroupLabel(r.createdAt);
    let bucket = map.get(label);
    if (!bucket) {
      bucket = [];
      map.set(label, bucket);
    }
    bucket.push(r);
  }

  const labels = Array.from(map.keys());
  labels.sort((a, b) => {
    const amax = Math.max(...map.get(a)!.map((x) => x.createdAt));
    const bmax = Math.max(...map.get(b)!.map((x) => x.createdAt));
    return bmax - amax;
  });

  return labels.map((title) => ({ title, data: map.get(title)! }));
}

export function groupRecordingsForBrowse(
  sorted: Recording[],
  groupBy: FolderGroupBy,
  sortDirection: FolderSortDirection
): { title: string; data: Recording[] }[] {
  if (groupBy === 'date') {
    const map = new Map<string, Recording[]>();
    for (const r of sorted) {
      const label = formatGroupLabel(r.createdAt);
      const bucket = map.get(label);
      if (bucket) bucket.push(r);
      else map.set(label, [r]);
    }
    const labels = Array.from(map.keys());
    labels.sort((a, b) => {
      const aFirst = map.get(a)![0].createdAt;
      const bFirst = map.get(b)![0].createdAt;
      const cmp = aFirst - bFirst;
      return sortDirection === 'desc' ? -cmp : cmp;
    });
    return labels.map((title) => ({ title, data: map.get(title)! }));
  }

  if (groupBy === 'type') {
    const map = new Map<string, Recording[]>();
    for (const r of sorted) {
      const label = getRecordingTypeLabel(r);
      const bucket = map.get(label);
      if (bucket) bucket.push(r);
      else map.set(label, [r]);
    }
    const labels = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    return labels.map((title) => ({ title, data: map.get(title)! }));
  }

  if (groupBy === 'size') {
    const map = new Map<string, Recording[]>();
    for (const r of sorted) {
      const label = sizeBucketLabel(r.fileSize);
      const bucket = map.get(label);
      if (bucket) bucket.push(r);
      else map.set(label, [r]);
    }
    const labels = Array.from(map.keys()).sort(
      (a, b) => SIZE_BUCKET_ORDER.indexOf(a) - SIZE_BUCKET_ORDER.indexOf(b)
    );
    if (sortDirection === 'desc') labels.reverse();
    return labels.map((title) => ({ title, data: map.get(title)! }));
  }

  return [{ title: '', data: sorted }];
}

/** Sorts then groups: default (groupBy none) uses Library-style time sections. */
export function buildFolderSections(
  recordings: Recording[],
  browse: FolderBrowsePreferences
): { title: string; data: Recording[] }[] {
  const sorted = sortRecordingsForBrowse(
    recordings,
    browse.sortField,
    browse.sortDirection
  );
  if (browse.groupBy === 'none') {
    return groupRecordingsIntoTimeSections(sorted);
  }
  return groupRecordingsForBrowse(sorted, browse.groupBy, browse.sortDirection);
}
