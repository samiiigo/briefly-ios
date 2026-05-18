import React from 'react';
import { ChromeBlurFade } from './ChromeBlurFade';

/**
 * @deprecated Use {@link ChromeOverlay} / {@link TopChromeOverlay} instead.
 */
export function TopBlurFade() {
  return <ChromeBlurFade edge="top" variant="header" />;
}
