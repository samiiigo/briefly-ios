'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MAX_RECENT_SEARCHES, SEARCH_DEBOUNCE_MS, SEARCH_PLACEHOLDER } from '@briefly/config';
import { Input, Stack, Text } from '@briefly/ui';
import { useLibrary } from '@/features/library';
import { RecordingList } from '@/features/library/components/RecordingList';
import { buildSearchCatalog, runIndexedSearch } from '@/features/search/utils/searchIndex';

const RECENT_SEARCHES_KEY = '@briefly/web/search-recent';

function loadRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  const prev = loadRecentSearches();
  const next = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

export function SearchScreen() {
  const { recordings, folders } = useLibrary();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const catalog = useMemo(() => buildSearchCatalog(folders, recordings), [folders, recordings]);

  const results = useMemo(
    () => runIndexedSearch(debouncedQuery, catalog),
    [debouncedQuery, catalog],
  );

  const commitSearch = useCallback((value: string) => {
    saveRecentSearch(value);
    setRecentSearches(loadRecentSearches());
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      commitSearch(debouncedQuery);
    }
  }, [debouncedQuery, commitSearch]);

  return (
    <Stack gap="lg">
      <header className="page-header">
        <Text as="h1" variant="title">
          Search
        </Text>
        <Text as="p" variant="body">
          Search titles, transcripts, summaries, and folders.
        </Text>
      </header>

      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={SEARCH_PLACEHOLDER}
        aria-label="Search"
      />

      {recentSearches.length > 0 && !debouncedQuery ? (
        <section>
          <Text as="h2" variant="label">
            Recent searches
          </Text>
          <ul className="recent-searches">
            {recentSearches.map((term) => (
              <li key={term}>
                <button type="button" className="recent-search-chip" onClick={() => setQuery(term)}>
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {debouncedQuery ? (
        <>
          {results.folders.length > 0 ? (
            <section>
              <Text as="h2" variant="label">
                Folders
              </Text>
              <ul className="search-folder-hits">
                {results.folders.map((folder) => (
                  <li key={folder.id}>
                    <Link
                      href={`/library/${folder.id}`}
                      className="search-folder-hit"
                      style={
                        folder.accent
                          ? ({ '--folder-accent': folder.accent } as React.CSSProperties)
                          : undefined
                      }
                    >
                      <span className="folder-tile__swatch" />
                      <span>{folder.name}</span>
                      <span className="folder-tile__count">{folder.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <Text as="h2" variant="label">
              Recordings
            </Text>
            <RecordingList
              recordings={results.recordings}
              emptyMessage="No recordings match your search."
            />
          </section>
        </>
      ) : null}
    </Stack>
  );
}
