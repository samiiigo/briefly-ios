import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ChromeBlurFade } from './ChromeBlurFade';
import { ChromeBlurVariant } from './chromeBlur';
import { useScreenLayoutStyles } from './screenLayout';
import { useTopChromeLayout } from './useTopChromeLayout';

type Edge = 'top' | 'bottom';

export interface ChromeOverlayProps {
  edge: Edge;
  variant: ChromeBlurVariant;
  children?: React.ReactNode;
  /** Top edge: safe-area padding above chrome content. */
  paddingInset?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  zIndex?: number;
  /** Bottom edge only: lift the fade so it sits below chrome content (e.g. recording controls). */
  blurBottomInset?: number;
}

function defaultZIndex(edge: Edge, hasChildren: boolean): number {
  if (edge === 'top') return 10;
  return hasChildren ? 11 : 1;
}

/**
 * Shared top/bottom chrome shell: progressive blur with optional content above the fade.
 *
 * - Layout blur only: `<ChromeOverlay edge="bottom" variant="tabBar" />`
 * - Header row: `<TopChromeOverlay>{header}</TopChromeOverlay>`
 * - Bottom chrome: `<BottomChromeOverlay variant="playback">{bar}</BottomChromeOverlay>`
 */
export function ChromeOverlay({
  edge,
  variant,
  children,
  paddingInset,
  style,
  contentStyle,
  zIndex,
  blurBottomInset,
}: ChromeOverlayProps) {
  const sl = useScreenLayoutStyles();
  const { topInset } = useTopChromeLayout();
  const isTop = edge === 'top';
  const hasChildren = children != null;
  const resolvedZIndex = zIndex ?? defaultZIndex(edge, hasChildren);
  const insetTop = paddingInset ?? (isTop ? topInset : undefined);
  const showBlur = Platform.OS === 'ios';

  const hostStyle: ViewStyle = isTop
    ? styles.hostTop
    : hasChildren
      ? styles.hostBottomChrome
      : styles.hostBottomBlur;

  if (!showBlur && !hasChildren) {
    return null;
  }

  return (
    <View
      style={[hostStyle, { zIndex: resolvedZIndex }, style]}
      pointerEvents={hasChildren ? 'box-none' : 'none'}
    >
      {showBlur ? (
        <ChromeBlurFade
          edge={edge}
          variant={variant}
          style={
            !isTop && blurBottomInset != null && blurBottomInset > 0
              ? { bottom: blurBottomInset }
              : undefined
          }
        />
      ) : null}
      {hasChildren ? (
        <View
          style={[
            isTop && [sl.headerOverlay, { paddingTop: insetTop }],
            !isTop && styles.bottomChromeContent,
            contentStyle,
          ]}
          pointerEvents="box-none"
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hostTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  hostBottomBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  hostBottomChrome: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 11,
  },
  /** Above {@link EdgeBlurFade} (zIndex 5) so controls stay visible on top of the fade. */
  bottomChromeContent: {
    zIndex: 10,
    elevation: 12,
  },
});
