import React from 'react';
import { usePathname } from 'expo-router';
import { BottomChromeOverlay } from './BottomChromeOverlay';
import {
  pathnameUsesRecordingNavigatorBlur,
  pathnameUsesRootStackBlur,
} from './bottomBlurRoutes';

export type NavigatorBottomBlurScope = 'tabs' | 'recording' | 'folder' | 'root';

interface Props {
  scope: NavigatorBottomBlurScope;
}

/**
 * Bottom blur mounted in a navigator `_layout` (sibling to the stack/tabs).
 * Pair with {@link TopChromeOverlay} on screen headers for the top edge.
 */
export function NavigatorBottomBlur({ scope }: Props) {
  const pathname = usePathname();

  const visible =
    scope === 'tabs' ||
    scope === 'folder' ||
    (scope === 'recording' && pathnameUsesRecordingNavigatorBlur(pathname)) ||
    (scope === 'root' && pathnameUsesRootStackBlur(pathname));

  if (!visible) {
    return null;
  }

  return <BottomChromeOverlay />;
}
