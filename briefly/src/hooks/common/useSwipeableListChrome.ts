import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useActiveSwipeableStore } from '@/context/useActiveSwipeableStore';
export function useSwipeableListChrome() {
  const closeOpenSwipe = useCallback(() => {
    useActiveSwipeableStore.getState().closeActive();
  }, []);
  useFocusEffect(
    useCallback(() => {
      return () => closeOpenSwipe();
    }, [closeOpenSwipe]),
  );
  return { closeOpenSwipe };
}
