import React from 'react';
import { type ViewStyle } from 'react-native';
import { EdgeBlurFade } from './EdgeBlurFade';
import { ChromeBlurVariant, useChromeBlurHeight } from './chromeBlur';
type Edge = 'top' | 'bottom';
interface Props {
  edge: Edge;
  variant: ChromeBlurVariant;
  style?: ViewStyle;
}
/** Progressive edge blur for a chrome variant. Use via {@link ChromeOverlay}. */
export function ChromeBlurFade({ edge, variant, style }: Props) {
  const height = useChromeBlurHeight(variant);
  return <EdgeBlurFade edge={edge} height={height} style={style} />;
}
