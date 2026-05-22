import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useResolvedColorScheme, useThemedColors } from '@/theme';
type Edge = 'top' | 'bottom';
type GradientStops = {
  colors: readonly [string, string, ...string[]];
  locations: readonly [number, number, ...number[]];
};
/** Bottom edge fade (strongest at the screen edge). */
const DARK_FADE_MASK: GradientStops = {
  colors: ['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.7)', '#000000'],
  locations: [0, 0.35, 0.72, 1],
};
const DARK_FADE_TINT: GradientStops = {
  colors: ['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.65)'],
  locations: [0, 0.55, 1],
};
const DARK_FADE_ANDROID: GradientStops = {
  colors: ['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.82)', 'rgba(0,0,0,0.98)'],
  locations: [0, 0.35, 0.72, 1],
};
/** Top edge: stronger blur through the header title, then a short fade-out. */
const DARK_TOP_FADE_MASK: GradientStops = {
  colors: ['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.88)', '#000000'],
  locations: [0, 0.32, 0.62, 1],
};
const DARK_TOP_FADE_TINT: GradientStops = {
  colors: ['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.8)'],
  locations: [0, 0.45, 1],
};
const DARK_TOP_FADE_ANDROID: GradientStops = {
  colors: ['transparent', 'rgba(0,0,0,0.62)', 'rgba(0,0,0,0.9)', 'rgba(0,0,0,0.99)'],
  locations: [0, 0.32, 0.62, 1],
};
/** White alpha mask — RGB must not be gray or the iOS mask reads as a dark band. */
const LIGHT_FADE_MASK: GradientStops = {
  colors: ['transparent', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.85)', '#FFFFFF'],
  locations: DARK_FADE_MASK.locations,
};
const LIGHT_TOP_FADE_MASK: GradientStops = {
  colors: ['transparent', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.9)', '#FFFFFF'],
  locations: DARK_TOP_FADE_MASK.locations,
};
function parseHexRgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '');
  const expanded =
    raw.length === 3
      ? raw
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : raw;
  return [
    parseInt(expanded.slice(0, 2), 16),
    parseInt(expanded.slice(2, 4), 16),
    parseInt(expanded.slice(4, 6), 16),
  ];
}
function withBackgroundAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parseHexRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
/** Solid grouped background at the screen edge → transparent over the list. */
function lightEdgeFade(background: string): GradientStops {
  return {
    colors: [withBackgroundAlpha(background, 0), background],
    locations: [0, 1],
  };
}
interface EdgeBlurFadeProps {
  edge: Edge;
  height: number;
  style?: ViewStyle;
}
export function EdgeBlurFade({ edge, height, style }: EdgeBlurFadeProps) {
  const colors = useThemedColors();
  const resolvedScheme = useResolvedColorScheme();
  const isLight = resolvedScheme === 'light';
  const positionStyle = edge === 'bottom' ? styles.bottom : styles.top;
  const flipForTop = edge === 'top';
  const fadeMask = useMemo(
    () =>
      isLight
        ? flipForTop
          ? LIGHT_TOP_FADE_MASK
          : LIGHT_FADE_MASK
        : flipForTop
          ? DARK_TOP_FADE_MASK
          : DARK_FADE_MASK,
    [flipForTop, isLight],
  );
  const fadeTint = useMemo(
    () => (flipForTop ? DARK_TOP_FADE_TINT : DARK_FADE_TINT),
    [flipForTop],
  );
  const fadeAndroid = useMemo(
    () =>
      flipForTop ? DARK_TOP_FADE_ANDROID : DARK_FADE_ANDROID,
    [flipForTop],
  );
  const lightFade = useMemo(() => lightEdgeFade(colors.background), [colors.background]);
  const blurIntensity = flipForTop ? 100 : 90;
  const useIosBlur = Platform.OS === 'ios';
  return (
    <View
      style={[styles.container, positionStyle, { height }, style]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.fadeLayers, flipForTop && styles.flipVertical]}>
        {useIosBlur ? (
          isLight ? (
            <>
              <MaskedView
                style={StyleSheet.absoluteFill}
                maskElement={<LinearGradient {...fadeMask} style={StyleSheet.absoluteFill} />}
              >
                <BlurView
                  intensity={blurIntensity}
                  tint="light"
                  style={StyleSheet.absoluteFill}
                />
              </MaskedView>
              <LinearGradient {...lightFade} style={StyleSheet.absoluteFill} pointerEvents="none" />
            </>
          ) : (
            <>
              <MaskedView
                style={StyleSheet.absoluteFill}
                maskElement={<LinearGradient {...fadeMask} style={StyleSheet.absoluteFill} />}
              >
                <BlurView intensity={blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />
              </MaskedView>
              <LinearGradient {...fadeTint} style={StyleSheet.absoluteFill} pointerEvents="none" />
            </>
          )
        ) : (
          <LinearGradient
            {...(isLight ? lightFade : fadeAndroid)}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 5,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  fadeLayers: {
    ...StyleSheet.absoluteFillObject,
  },
  flipVertical: {
    transform: [{ scaleY: -1 }],
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
});
