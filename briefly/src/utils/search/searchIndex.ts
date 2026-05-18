import { SearchFilterId, SEARCH_FILTER_PILLS } from '@/constants/search';
import { Recording, UserFolder } from '@/types';
import { SEARCH_FILTER_PREDICATES } from './searchFilters';
import {
  buildSearchableFolders,
  normalizeSearchQuery,
  type SearchFolderResult,
  type SearchResults,
} from './searchEngine';

export interface IndexedSearchFolder extends SearchFolderResult {
  nameLower: string;
}

export interface IndexedRecording {
  recording: Recording;
  haystack: string;
}

export interface SearchCatalog {
  folders: IndexedSearchFolder[];
  scopedByFilter: Record<SearchFilterId, IndexedRecording[]>;
}

const EMPTY_RESULTS: SearchResults = { folders: [], recordings: [] };

function buildRecordingHaystack(recording: Recording): string {
  const parts: string[] = [recording.title];
  if (recording.summary) parts.push(recording.summary);
  const transcript = recording.transcript;
  if (transcript) {
    for (let i = 0; i < transcript.length; i++) {
      const text = transcript[i]?.text;
      if (text) parts.push(text);
    }
  }
  return parts.join('\u0001').toLowerCase();
}

/** Precomputes folder names and per-filter recording haystacks (rebuilt when data changes). */
export function buildSearchCatalog(
  userFolders: UserFolder[],
  recordings: Recording[]
): SearchCatalog {
  const folders: IndexedSearchFolder[] = buildSearchableFolders(userFolders, recordings).map(
    (folder) => ({
      ...folder,
      nameLower: folder.name.toLowerCase(),
    })
  );

  const indexed: IndexedRecording[] = new Array(recordings.length);
  for (let i = 0; i < recordings.length; i++) {
    const recording = recordings[i]!;
    indexed[i] = { recording, haystack: buildRecordingHaystack(recording) };
  }

  const scopedByFilter = {} as Record<SearchFilterId, IndexedRecording[]>;
  for (const pill of SEARCH_FILTER_PILLS) {
    const predicate = SEARCH_FILTER_PREDICATES[pill.id];
    const scoped: IndexedRecording[] = [];
    for (let i = 0; i < indexed.length; i++) {
      const item = indexed[i]!;
      if (predicate(item.recording)) scoped.push(item);
    }
    scopedByFilter[pill.id] = scoped;
  }

  return { folders, scopedByFilter };
}

export function runIndexedSearch(
  query: string,
  filterId: SearchFilterId,
  catalog: SearchCatalog
): SearchResults {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return EMPTY_RESULTS;

  const matchingFolders: SearchFolderResult[] = [];
  for (let i = 0; i < catalog.folders.length; i++) {
    const folder = catalog.folders[i]!;
    if (folder.nameLower.includes(normalized)) {
      matchingFolders.push(folder);
    }
  }

  const scoped = catalog.scopedByFilter[filterId];
  const matchingRecordings: Recording[] = [];
  for (let i = 0; i < scoped.length; i++) {
    const item = scoped[i]!;
    if (item.haystack.includes(normalized)) {
      matchingRecordings.push(item.recording);
    }
  }

  if (matchingRecordings.length > 1) {
    matchingRecordings.sort((a, b) => b.createdAt - a.createdAt);
  }

  return {
    folders: matchingFolders,
    recordings: matchingRecordings,
  };
}

/** Convenience wrapper for tests; production should cache {@link SearchCatalog}. */
export function runSearch(
  query: string,
  filterId: SearchFilterId,
  recordings: Recording[],
  userFolders: UserFolder[] = []
): SearchResults {
  return runIndexedSearch(query, filterId, buildSearchCatalog(userFolders, recordings));
}
