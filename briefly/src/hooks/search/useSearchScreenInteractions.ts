import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ScrollView } from 'react-native';
import type { FlashListRef } from '@shopify/flash-list';
import type { Recording } from '@/types';
import {
  createSearchKeyboardDismissHandlers,
  dismissSearchKeyboard,
} from '@/utils/search/searchScreenHelpers';
export function useSearchScreenInteractions(
  deferredQuery: string,
  isActiveSearch: boolean,
  handleSearchSubmit: () => void,
) {
  const listRef = useRef<FlashListRef<Recording>>(null);
  const pristineScrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (isActiveSearch) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    } else {
      pristineScrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [deferredQuery, isActiveSearch]);
  const dismissKeyboard = useCallback(() => {
    dismissSearchKeyboard(handleSearchSubmit);
  }, [handleSearchSubmit]);
  const dismissKeyboardOnMoveCapture = useMemo(
    () => createSearchKeyboardDismissHandlers(dismissKeyboard),
    [dismissKeyboard],
  );
  const handleSubmit = useCallback(() => {
    dismissKeyboard();
  }, [dismissKeyboard]);
  return {
    listRef,
    pristineScrollRef,
    dismissKeyboard,
    dismissKeyboardOnMoveCapture,
    handleSubmit,
  };
}
