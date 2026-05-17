import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

interface Options {
  enabled: boolean;
  onBackground?: () => void | Promise<void>;
  onForeground?: () => void;
}

/**
 * Observes app lifecycle transitions (background, phone call, lock screen).
 */
export function useAppInterruptGuard({ enabled, onBackground, onForeground }: Options) {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const onBackgroundRef = useRef(onBackground);
  const onForegroundRef = useRef(onForeground);

  onBackgroundRef.current = onBackground;
  onForegroundRef.current = onForeground;

  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      const wasActive = prev === 'active';
      const isNowBackground = nextState === 'background' || nextState === 'inactive';

      if (wasActive && isNowBackground) {
        void onBackgroundRef.current?.();
      }

      if (prev.match(/inactive|background/) && nextState === 'active') {
        onForegroundRef.current?.();
      }

      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [enabled]);
}
