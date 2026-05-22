import { MAX_RECENT_SEARCHES } from '@/constants/search';
import { validateSearchQuery } from '@/security/inputSchemas';
import { ValidationError } from '@/security/schema';

/** Trim, validate, and reject empty / whitespace-only queries. */
export function normalizeRecentSearchQuery(raw: string): string | null {
  try {
    return validateSearchQuery(raw);
  } catch (error) {
    if (error instanceof ValidationError) {
      return null;
    }
    throw error;
  }
}

/** True when `prefix` is a strict leading substring of `full` (case-insensitive). */
export function isStrictPrefixOf(prefix: string, full: string): boolean {
  if (prefix.length >= full.length) return false;
  return full.toLowerCase().startsWith(prefix.toLowerCase());
}

/**
 * Builds the next recent-search list after an explicit commit (Enter / result tap).
 * - Dedupes exact matches (case-insensitive) and moves the term to the top.
 * - Drops shorter prefix fragments when a longer term is committed (e.g. o, op, opt → optimizing).
 * - Skips committing a short term that is only a prefix of an existing longer entry.
 */
export function commitRecentSearchList(
  existing: readonly string[],
  raw: string,
  max = MAX_RECENT_SEARCHES
): string[] {
  const query = normalizeRecentSearchQuery(raw);
  if (!query) return [...existing];

  const lower = query.toLowerCase();

  if (existing.some((entry) => isStrictPrefixOf(query, entry))) {
    return [...existing];
  }

  const withoutRelated = existing.filter((entry) => {
    const entryLower = entry.toLowerCase();
    if (entryLower === lower) return false;
    if (isStrictPrefixOf(entry, query)) return false;
    return true;
  });

  return [query, ...withoutRelated].slice(0, max);
}

/** Cleans persisted history (removes empties, dupes, and stale prefix fragments). */
export function sanitizeRecentSearchList(
  queries: readonly string[],
  max = MAX_RECENT_SEARCHES
): string[] {
  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const raw of queries) {
    const normalized = normalizeRecentSearchQuery(raw);
    if (!normalized) continue;
    const lower = normalized.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    deduped.push(normalized);
  }

  const pruned = deduped.filter((entry, index) => {
    return !deduped.some(
      (other, otherIndex) =>
        otherIndex !== index && isStrictPrefixOf(entry, other)
    );
  });

  return pruned.slice(0, max);
}
