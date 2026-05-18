import { useCallback, useEffect } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

/** Scroll offset before filter pills begin to reveal (active results only). */
export const FILTER_REVEAL_SCROLL_Y = 20;

const REVEAL_DURATION_MS = 200;
const HIDE_DURATION_MS = 180;

interface Options {
  /** User has entered a non-empty debounced query. */
  isActiveSearch: boolean;
  /** Active query returns at least one folder or recording. */
  hasResults: boolean;
  /** Changes here collapse filters and reset scroll-driven reveal (e.g. query). */
  resetToken: string;
}

/**
 * Scroll-driven filter pill visibility for search results.
 * Pristine / empty-result views never reveal filters; only active results + scroll down.
 */
export function useSearchFilterReveal({
  isActiveSearch,
  hasResults,
  resetToken,
}: Options) {
  const filterReveal = useSharedValue(0);
  const canReveal = isActiveSearch && hasResults;

  const collapseFilters = useCallback(() => {
    filterReveal.value = withTiming(0, { duration: HIDE_DURATION_MS });
  }, [filterReveal]);

  useEffect(() => {
    collapseFilters();
  }, [isActiveSearch, hasResults, resetToken, collapseFilters]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!canReveal) {
        if (filterReveal.value > 0) {
          filterReveal.value = withTiming(0, { duration: HIDE_DURATION_MS });
        }
        return;
      }

      const y = event.nativeEvent.contentOffset.y;
      if (y > FILTER_REVEAL_SCROLL_Y) {
        if (filterReveal.value < 1) {
          filterReveal.value = withTiming(1, { duration: REVEAL_DURATION_MS });
        }
      } else if (y <= 0) {
        if (filterReveal.value > 0) {
          filterReveal.value = withTiming(0, { duration: HIDE_DURATION_MS });
        }
      }
    },
    [canReveal, filterReveal]
  );

  return {
    filterReveal,
    collapseFilters,
    handleScroll,
  };
}
