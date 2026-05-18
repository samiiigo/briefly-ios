import { useFloatingTabBarLayout } from './useFloatingTabBarLayout';
import { usePlaybackBarLayout } from './usePlaybackBarLayout';
import { useTopChromeLayout } from './useTopChromeLayout';

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
