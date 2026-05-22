import { useFloatingTabBarLayout } from '../layout/useFloatingTabBarLayout';
import { usePlaybackBarLayout } from '../layout/usePlaybackBarLayout';
import { useTopChromeLayout } from '../layout/useTopChromeLayout';
export type ChromeBlurVariant = 'header' | 'tabBar' | 'playback';
export function useChromeBlurHeight(variant: ChromeBlurVariant): number {
  const { blurFadeHeight: headerHeight } = useTopChromeLayout();
  const { blurFadeHeight: tabBarHeight } = useFloatingTabBarLayout();
  const { blurFadeHeight: playbackHeight } = usePlaybackBarLayout();
  switch (variant) {
    case 'header':
      return headerHeight;
    case 'tabBar':
      return tabBarHeight;
    case 'playback':
      return playbackHeight;
  }
}
