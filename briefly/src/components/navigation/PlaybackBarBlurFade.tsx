import React from 'react';
import { EdgeBlurFade } from './EdgeBlurFade';
import { usePlaybackBarLayout } from './usePlaybackBarLayout';

/** Progressive blur from the screen bottom up to the playback pill. */
export function PlaybackBarBlurFade() {
  const { blurFadeHeight } = usePlaybackBarLayout();
  return <EdgeBlurFade edge="bottom" height={blurFadeHeight} />;
}
