import { getScrollPaddingTop } from '@/components/navigation/topHeaderMetrics';
import { Spacing } from '@/theme';

/** Search field row below the large title (matches embedded SearchField). */
export const SEARCH_FIELD_ROW_HEIGHT =
  Spacing.sm + 44 + Spacing.sm;

export const SEARCH_LIST_BOTTOM_PADDING = 140;

export function getSearchScrollPaddingTop(safeAreaTop: number): number {
  return getScrollPaddingTop(safeAreaTop) + SEARCH_FIELD_ROW_HEIGHT;
}
