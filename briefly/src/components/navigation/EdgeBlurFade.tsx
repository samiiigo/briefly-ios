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

function lightFadeMask(background: string): GradientStops {
  return {
    colors: ['transparent', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.82)', background],
    locations: [0, 0.35, 0.72, 1],
  };
}

function lightFadeTint(): GradientStops {
  return {
    colors: ['transparent', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.75)'],
    locations: [0, 0.55, 1],
  };
}

function lightFadeAndroid(background: string): GradientStops {
  return {
    colors: ['transparent', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.9)', background],
    locations: [0, 0.35, 0.72, 1],
  };
}

function lightTopFadeMask(background: string): GradientStops {
  return {
    colors: ['transparent', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.9)', background],
    locations: [0, 0.32, 0.62, 1],
  };
}

function lightTopFadeTint(): GradientStops {
  return {
    colors: ['transparent', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.82)'],
    locations: [0, 0.45, 1],
  };
}

function lightTopFadeAndroid(background: string): GradientStops {
  return {
    colors: ['transparent', 'rgba(255,255,255,0.62)', 'rgba(255,255,255,0.92)', background],
    locations: [0, 0.32, 0.62, 1],
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
          ? lightTopFadeMask(colors.background)
          : lightFadeMask(colors.background)
        : flipForTop
          ? DARK_TOP_FADE_MASK
          : DARK_FADE_MASK,
    [colors.background, flipForTop, isLight],
  );
  const fadeTint = useMemo(
    () =>
      isLight
        ? flipForTop
          ? lightTopFadeTint()
          : lightFadeTint()
        : flipForTop
          ? DARK_TOP_FADE_TINT
          : DARK_FADE_TINT,
    [flipForTop, isLight],
  );
  const fadeAndroid = useMemo(
    () =>
      isLight
        ? flipForTop
          ? lightTopFadeAndroid(colors.background)
          : lightFadeAndroid(colors.background)
        : flipForTop
          ? DARK_TOP_FADE_ANDROID
          : DARK_FADE_ANDROID,
    [colors.background, flipForTop, isLight],
  );
  const blurIntensity = flipForTop ? 100 : 90;
  const blurTint = isLight ? 'light' : 'dark';

  return (
    <View
      style={[styles.container, positionStyle, { height }, style]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.fadeLayers, flipForTop && styles.flipVertical]}>
        {Platform.OS === 'ios' ? (
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={<LinearGradient {...fadeMask} style={StyleSheet.absoluteFill} />}
          >
            <BlurView intensity={blurIntensity} tint={blurTint} style={StyleSheet.absoluteFill} />
          </MaskedView>
        ) : (
          <LinearGradient {...fadeAndroid} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient {...fadeTint} style={StyleSheet.absoluteFill} pointerEvents="none" />
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
