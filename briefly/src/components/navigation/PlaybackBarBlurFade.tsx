import React from 'react';
import { ChromeBlurFade } from './ChromeBlurFade';

/**
 * @deprecated Use {@link ChromeOverlay} / {@link BottomChromeOverlay} instead.
 */
export function PlaybackBarBlurFade() {
  return <ChromeBlurFade edge="bottom" variant="playback" />;
}
