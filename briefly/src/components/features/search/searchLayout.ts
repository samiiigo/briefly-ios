import { Spacing } from '@/theme';

/** Horizontal inset for search chrome and list content. */
export const SEARCH_CHROME_HORIZONTAL_PADDING = Spacing.md;

/** Search bar row (field + cancel). */
export const SEARCH_BAR_ROW_HEIGHT = 44 + Spacing.sm;

export function getSearchScrollPaddingTop(safeAreaTop: number): number {
  return safeAreaTop + Spacing.sm + SEARCH_BAR_ROW_HEIGHT + Spacing.sm;
}
