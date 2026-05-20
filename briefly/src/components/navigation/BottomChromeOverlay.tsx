import React from 'react';
import { ChromeBlurVariant } from './chromeBlur';
import { ChromeOverlay, type ChromeOverlayProps } from './ChromeOverlay';

type Props = Pick<
  ChromeOverlayProps,
  'children' | 'style' | 'contentStyle' | 'zIndex' | 'blurBottomInset'
> & {
  /** `tabBar` for lists/settings; `playback` for the recording playback pill. */
  variant?: ChromeBlurVariant;
};

/**
 * Bottom chrome with progressive blur.
 * Blur-only at navigator layout: `<BottomChromeOverlay />`.
 * With controls: `<BottomChromeOverlay variant="playback">{bar}</BottomChromeOverlay>`.
 */
export function BottomChromeOverlay({
  children,
  variant = 'tabBar',
  ...rest
}: Props) {
  const blurVariant: ChromeBlurVariant = variant === 'playback' ? 'playback' : 'tabBar';

  return (
    <ChromeOverlay edge="bottom" variant={blurVariant} {...rest}>
      {children}
    </ChromeOverlay>
  );
}
