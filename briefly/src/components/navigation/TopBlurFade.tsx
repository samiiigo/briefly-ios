import React from 'react';
import { EdgeBlurFade } from './EdgeBlurFade';
import { useTopChromeLayout } from './useTopChromeLayout';

/** Progressive blur + dark tint under the top header (strongest at the status bar). */
export function TopBlurFade() {
  const { blurFadeHeight } = useTopChromeLayout();
  return <EdgeBlurFade edge="top" height={blurFadeHeight} />;
}
