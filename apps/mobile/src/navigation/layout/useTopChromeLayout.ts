import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getScrollPaddingTop,
  getTopChromeFadeHeight,
  TOP_HEADER_BODY_HEIGHT,
} from './topHeaderMetrics';
export function useTopChromeLayout() {
  const insets = useSafeAreaInsets();
  const chromeHeight = insets.top + TOP_HEADER_BODY_HEIGHT;
  const blurFadeHeight = getTopChromeFadeHeight(insets.top);
  const scrollPaddingTop = getScrollPaddingTop(insets.top);
  return {
    topInset: insets.top,
    chromeHeight,
    blurFadeHeight,
    scrollPaddingTop,
  };
}
