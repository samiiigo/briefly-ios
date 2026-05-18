import { getScrollPaddingTop } from '@/components/navigation/topHeaderMetrics';
import { Spacing } from '@/theme';

/** Horizontal inset for {@link SearchTopChrome} header row. */
export const SEARCH_CHROME_HORIZONTAL_PADDING = Spacing.lg;

/** List content inset — matches the recents feed (`app/(tabs)/index.tsx`). */
export const SEARCH_LIST_HORIZONTAL_PADDING = Spacing.md;

export function getSearchScrollPaddingTop(safeAreaTop: number): number {
  return getScrollPaddingTop(safeAreaTop);
}
