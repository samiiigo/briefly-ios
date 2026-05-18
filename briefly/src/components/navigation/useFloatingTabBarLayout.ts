import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '@/theme';
import { BOTTOM_CHROME_HORIZONTAL_INSET } from './screenGutter';

/** Vertical size of the floating tab pill (icon + label + padding). */
export const TAB_PILL_HEIGHT = 64;

/** Record FAB size — kept in sync with `RecordButton`. */
export const RECORD_BUTTON_SIZE = 56;

/** Extra fade above the tab bar where blur ramps up. */
export const BLUR_FADE_EXTENSION = 56;

/** Gap between the tab pill / record FAB and the safe-area edge. */
export const BOTTOM_CHROME_EXTRA = 4;

export function useFloatingTabBarLayout() {
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';

  const bottomOffset = Math.max(insets.bottom, 8) + BOTTOM_CHROME_EXTRA;
  const horizontalInset = BOTTOM_CHROME_HORIZONTAL_INSET;

  // On Android, the tab bar sits flush at the bottom
  const androidTabBarHeight = 60 + insets.bottom;

  const blurFadeHeight = isAndroid
    ? androidTabBarHeight + BLUR_FADE_EXTENSION
    : bottomOffset + TAB_PILL_HEIGHT + BLUR_FADE_EXTENSION;

  const recordButtonBottom = isAndroid
    ? androidTabBarHeight + Spacing.md
    : bottomOffset + (TAB_PILL_HEIGHT - RECORD_BUTTON_SIZE) / 2;

  return {
    bottomOffset,
    horizontalInset,
    pillHeight: TAB_PILL_HEIGHT,
    blurFadeHeight,
    recordButtonBottom,
    androidTabBarHeight,
    insetsBottom: insets.bottom,
  };
}