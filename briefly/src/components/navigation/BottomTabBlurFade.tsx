import React from 'react';
import { EdgeBlurFade } from './EdgeBlurFade';
import { useFloatingTabBarLayout } from './useFloatingTabBarLayout';

/** Progressive blur from the screen bottom up to the top of the floating tab bar. */
export function BottomTabBlurFade() {
  const { blurFadeHeight } = useFloatingTabBarLayout();
  return <EdgeBlurFade edge="bottom" height={blurFadeHeight} />;
}
