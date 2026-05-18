import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { DEFAULT_SEARCH_FILTER, SearchFilterId } from '@/constants/search';

/** Minimum content offset before an upward scroll can reveal filters. */
export const FILTER_REVEAL_SCROLL_Y = 20;

/** Minimum vertical delta (px) per scroll event to count as a direction change. */
const SCROLL_DIRECTION_DELTA = 4;

const REVEAL_DURATION_MS = 200;
const HIDE_DURATION_MS = 180;

interface Options {
  isActiveSearch: boolean;
  /** Query matches at least one item when scoped to {@link DEFAULT_SEARCH_FILTER}. */
  hasGlobalResults: boolean;
  /** Query matches at least one item under the currently selected filter. */
  hasScopedResults: boolean;
  /** Debounced query — resets scroll/filter interaction state when changed. */
  resetToken: string;
  onFilterChange: (id: SearchFilterId) => void;
}

/**
 * Filter pill visibility state machine:
 * 1. No global results → hidden
 * 2. Global results → reveal on scroll up, hide on scroll down or at scroll top
 * 3. User picked a filter that yields zero → keep visible (pinned)
 */
export function useSearchFilterReveal({
  isActiveSearch,
  hasGlobalResults,
  hasScopedResults,
  resetToken,
  onFilterChange,
}: Options) {
  const filterReveal = useSharedValue(0);
  const [hasScrollRevealedFilters, setHasScrollRevealedFilters] = useState(false);
  const [isFilteringActive, setIsFilteringActive] = useState(false);
  const lastScrollY = useRef(0);

  const pinFiltersVisible = isFilteringActive && isActiveSearch && !hasScopedResults && hasGlobalResults;

  const shouldShowFilters = useMemo(() => {
    if (!isActiveSearch || !hasGlobalResults) return false;
    if (pinFiltersVisible) return true;
    return hasScrollRevealedFilters;
  }, [isActiveSearch, hasGlobalResults, pinFiltersVisible, hasScrollRevealedFilters]);

  useEffect(() => {
    setHasScrollRevealedFilters(false);
    setIsFilteringActive(false);
    lastScrollY.current = 0;
  }, [resetToken]);

  useEffect(() => {
    if (!isActiveSearch) {
      setHasScrollRevealedFilters(false);
      setIsFilteringActive(false);
    }
  }, [isActiveSearch]);

  useEffect(() => {
    filterReveal.value = withTiming(shouldShowFilters ? 1 : 0, {
      duration: shouldShowFilters ? REVEAL_DURATION_MS : HIDE_DURATION_MS,
    });
  }, [shouldShowFilters, filterReveal]);

  const collapseFilters = useCallback(() => {
    setHasScrollRevealedFilters(false);
    lastScrollY.current = 0;
    filterReveal.value = withTiming(0, { duration: HIDE_DURATION_MS });
  }, [filterReveal]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isActiveSearch || !hasGlobalResults) return;
      if (pinFiltersVisible) return;

      const y = event.nativeEvent.contentOffset.y;
      const deltaY = y - lastScrollY.current;
      lastScrollY.current = y;

      if (deltaY < -SCROLL_DIRECTION_DELTA && y > FILTER_REVEAL_SCROLL_Y) {
        setHasScrollRevealedFilters(true);
      } else if (y <= 0 || deltaY > SCROLL_DIRECTION_DELTA) {
        setHasScrollRevealedFilters(false);
      }
    },
    [isActiveSearch, hasGlobalResults, pinFiltersVisible]
  );

  const handleFilterSelect = useCallback(
    (id: SearchFilterId) => {
      setIsFilteringActive(true);
      onFilterChange(id);
    },
    [onFilterChange]
  );

  return {
    filterReveal,
    hasScrollRevealedFilters,
    isFilteringActive,
    shouldShowFilters,
    pinFiltersVisible,
    collapseFilters,
    handleScroll,
    handleFilterSelect,
  };
}
