import { getScrollPaddingTop } from '@/components/navigation/topHeaderMetrics';
import { Spacing } from '@/theme';

/** Horizontal inset for search chrome and list content (matches {@link SearchTopChrome}). */
export const SEARCH_CHROME_HORIZONTAL_PADDING = Spacing.lg;

export function getSearchScrollPaddingTop(safeAreaTop: number): number {
  return getScrollPaddingTop(safeAreaTop);
}
