import { SCREEN_HORIZONTAL_GUTTER } from '@/components/navigation/screenGutter';
import { getScrollPaddingTop } from '@/components/navigation/topHeaderMetrics';

/** Horizontal inset for search chrome and list content (matches {@link SearchTopChrome}). */
export const SEARCH_CHROME_HORIZONTAL_PADDING = SCREEN_HORIZONTAL_GUTTER;

export function getSearchScrollPaddingTop(safeAreaTop: number): number {
  return getScrollPaddingTop(safeAreaTop);
}
