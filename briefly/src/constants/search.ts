export const SEARCH_FILTER_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'unlisted', label: 'Unlisted' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'archived', label: 'Archived' },
] as const;

export type SearchFilterId = (typeof SEARCH_FILTER_PILLS)[number]['id'];

export const DEFAULT_SEARCH_FILTER: SearchFilterId = 'all';

export const SEARCH_DEBOUNCE_MS = 150;

/** Debounce before persisting a query to recent searches (avoids storage churn while typing). */
export const SEARCH_RECENT_SAVE_MS = 600;

export const MAX_RECENT_SEARCHES = 10;

export const SEARCH_PLACEHOLDER = 'Search titles, folders, or content...';
