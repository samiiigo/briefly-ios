import React from 'react';
import { EdgeBlurFade } from './EdgeBlurFade';
import { ChromeBlurVariant, useChromeBlurHeight } from './chromeBlur';

type Edge = 'top' | 'bottom';

interface Props {
  edge: Edge;
  variant: ChromeBlurVariant;
}

/** Progressive edge blur for a chrome variant. Use via {@link ChromeOverlay}. */
export function ChromeBlurFade({ edge, variant }: Props) {
  const height = useChromeBlurHeight(variant);
  return <EdgeBlurFade edge={edge} height={height} />;
}
