import { useCallback } from 'react';
import { router, useRouter, type Href } from 'expo-router';

/**
 * Pops the current screen when history exists; otherwise navigates to a fallback.
 * Nested stacks on Android can show a sub-screen while `router.back()` is a no-op.
 */
export function useStackBack(fallback?: Href) {
  const nav = useRouter();
  return useCallback(() => {
    if (nav.canGoBack()) {
      nav.back();
      return;
    }
    if (fallback) {
      nav.replace(fallback);
    }
  }, [nav, fallback]);
}

/** Open the settings root from tabs, resetting any nested settings sub-route. */
export function openSettingsRoot(): void {
  if (router.canDismiss()) {
    router.dismissTo('/settings');
    return;
  }
  router.push('/settings');
}
