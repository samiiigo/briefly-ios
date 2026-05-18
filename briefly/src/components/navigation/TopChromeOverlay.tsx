import React from 'react';
import { ChromeOverlay, type ChromeOverlayProps } from './ChromeOverlay';

type Props = Pick<ChromeOverlayProps, 'children' | 'paddingInset' | 'style' | 'contentStyle' | 'zIndex'> & {
  /** @deprecated Use `paddingInset` */
  paddingTop?: number;
};

/** Top header chrome with progressive blur (Briefly title, stack headers, etc.). */
export function TopChromeOverlay({
  children,
  paddingTop,
  paddingInset,
  ...rest
}: Props) {
  return (
    <ChromeOverlay
      edge="top"
      variant="header"
      paddingInset={paddingInset ?? paddingTop}
      {...rest}
    >
      {children}
    </ChromeOverlay>
  );
}

/** @deprecated Use {@link TopChromeOverlay} */
export const TopHeaderOverlay = TopChromeOverlay;
