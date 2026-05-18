import { runIndexedSearch, type SearchCatalog } from './searchIndex';

/** Recent terms that still produce at least one search hit. */
export function filterRecentQueriesWithHits(
  queries: readonly string[],
  catalog: SearchCatalog,
  options?: { scopeRecents?: boolean }
): string[] {
  if (queries.length === 0) return [];
  if (options?.scopeRecents === false) return [...queries];

  return queries.filter((term) => {
    const { folders, recordings } = runIndexedSearch(term, catalog);
    return folders.length > 0 || recordings.length > 0;
  });
}
