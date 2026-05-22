import { Recording, UserFolder } from '@/types';
import {
  buildSearchableFolders,
  normalizeSearchQuery,
  type SearchFolderResult,
  type SearchResults,
} from './searchEngine';
import { buildRecordingDateSearchTerms } from './searchDateTerms';
export interface IndexedSearchFolder extends SearchFolderResult {
  nameLower: string;
}
export interface IndexedRecording {
  recording: Recording;
  haystack: string;
}
export interface SearchCatalog {
  folders: IndexedSearchFolder[];
  recordings: IndexedRecording[];
}
const EMPTY_RESULTS: SearchResults = { folders: [], recordings: [] };
function buildRecordingHaystack(recording: Recording): string {
  const parts: string[] = [recording.title];
  if (recording.summary) parts.push(recording.summary);
  parts.push(buildRecordingDateSearchTerms(recording.createdAt));
  const transcript = recording.transcript;
  if (transcript) {
    for (let i = 0; i < transcript.length; i++) {
      const text = transcript[i]?.text;
      if (text) parts.push(text);
    }
  }
  return parts.join('\u0001').toLowerCase();
}
/** Precomputes folder names and recording haystacks (rebuilt when data changes). */
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
  const indexed: IndexedRecording[] = [];
  for (let i = 0; i < recordings.length; i++) {
    const recording = recordings[i]!;
    if (recording.deletedAt != null) continue;
    indexed.push({ recording, haystack: buildRecordingHaystack(recording) });
  }
  return { folders, recordings: indexed };
}
export function runIndexedSearch(query: string, catalog: SearchCatalog): SearchResults {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return EMPTY_RESULTS;
  const matchingFolders: SearchFolderResult[] = [];
  for (let i = 0; i < catalog.folders.length; i++) {
    const folder = catalog.folders[i]!;
    if (folder.nameLower.includes(normalized)) {
      matchingFolders.push(folder);
    }
  }
  const matchingRecordings: Recording[] = [];
  for (let i = 0; i < catalog.recordings.length; i++) {
    const item = catalog.recordings[i]!;
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
  recordings: Recording[],
  userFolders: UserFolder[] = []
): SearchResults {
  return runIndexedSearch(query, buildSearchCatalog(userFolders, recordings));
}
