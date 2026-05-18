import { Spacing } from '@/theme';

/** Horizontal inset for search chrome and list content. */
export const SEARCH_CHROME_HORIZONTAL_PADDING = Spacing.md;

/** Search bar row (field + cancel). */
export const SEARCH_BAR_ROW_HEIGHT = 44 + Spacing.sm;

/** Filter pill strip height (matches {@link SearchFilterPills} compact row). */
export const SEARCH_FILTER_ROW_HEIGHT = 44;

export const SEARCH_LIST_BOTTOM_PADDING = 32;

export function getSearchChromeHeight(safeAreaTop: number): number {
  return (
    safeAreaTop +
    Spacing.sm +
    SEARCH_BAR_ROW_HEIGHT +
    SEARCH_FILTER_ROW_HEIGHT +
    Spacing.sm
  );
}
