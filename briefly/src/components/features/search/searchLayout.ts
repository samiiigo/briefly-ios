import { getScrollPaddingTop } from '@/components/navigation/topHeaderMetrics';
import { Spacing } from '@/theme';

/** Horizontal inset for search list content. */
export const SEARCH_CHROME_HORIZONTAL_PADDING = Spacing.md;

export function getSearchScrollPaddingTop(safeAreaTop: number): number {
  return getScrollPaddingTop(safeAreaTop);
}
