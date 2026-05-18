import { SearchFilterId } from '@/constants/search';
import { runIndexedSearch, type SearchCatalog } from './searchIndex';

/** Recent terms that still produce at least one hit under the active filter. */
export function filterRecentQueriesForFilter(
  queries: readonly string[],
  filterId: SearchFilterId,
  catalog: SearchCatalog,
  options?: { scopeRecents?: boolean }
): string[] {
  if (queries.length === 0) return [];
  if (options?.scopeRecents === false) return [...queries];

  return queries.filter((term) => {
    const { folders, recordings } = runIndexedSearch(term, filterId, catalog);
    return folders.length > 0 || recordings.length > 0;
  });
}
