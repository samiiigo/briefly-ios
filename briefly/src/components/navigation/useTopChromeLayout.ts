import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BLUR_FADE_EXTENSION } from './useFloatingTabBarLayout';
import {
  getScrollPaddingTop,
  TOP_HEADER_BODY_HEIGHT,
} from './topHeaderMetrics';

/** @deprecated Use `BLUR_FADE_EXTENSION` — kept for existing imports. */
export const TOP_BLUR_FADE_EXTENSION = BLUR_FADE_EXTENSION;

export function useTopChromeLayout() {
  const insets = useSafeAreaInsets();
  const chromeHeight = insets.top + TOP_HEADER_BODY_HEIGHT;
  const blurFadeHeight = chromeHeight + BLUR_FADE_EXTENSION;
  const scrollPaddingTop = getScrollPaddingTop(insets.top);

  return {
    topInset: insets.top,
    chromeHeight,
    blurFadeHeight,
    scrollPaddingTop,
  };
}

export {
  TOP_HEADER_BODY_HEIGHT,
  TOP_HEADER_BUTTON_ROW_HEIGHT,
  TOP_HEADER_PADDING_BOTTOM,
  TOP_HEADER_PADDING_TOP,
  getScrollPaddingTop,
} from './topHeaderMetrics';
