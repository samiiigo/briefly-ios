import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFloatingTabBarLayout } from '../layout/useFloatingTabBarLayout';
import { usePlaybackBarLayout } from '../layout/usePlaybackBarLayout';
import { useTopChromeLayout } from '../layout/useTopChromeLayout';
import {
  TOP_CHROME_FADE_BELOW_TITLE,
  TOP_HEADER_BODY_HEIGHT,
} from '../layout/topHeaderMetrics';
import { useChromeFadeColor } from './ChromeFadeColor';
export type ChromeBlurVariant = 'header' | 'tabBar' | 'playback';
export function useChromeBlurHeight(variant: ChromeBlurVariant): number {
  const insets = useSafeAreaInsets();
  const sheetFadeColor = useChromeFadeColor();
  const { blurFadeHeight: headerHeight } = useTopChromeLayout();
  const { blurFadeHeight: tabBarHeight } = useFloatingTabBarLayout();
  const { blurFadeHeight: playbackHeight } = usePlaybackBarLayout();
  switch (variant) {
    case 'header':
      // Settings sheet uses a compact nav title — keep blur short so it doesn't swallow content.
      if (sheetFadeColor) {
        return insets.top + TOP_HEADER_BODY_HEIGHT + TOP_CHROME_FADE_BELOW_TITLE;
      }
      return headerHeight;
    case 'tabBar':
      return tabBarHeight;
    case 'playback':
      return playbackHeight;
  }
}
