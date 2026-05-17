import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

type Edge = 'top' | 'bottom';

type GradientStops = {
  colors: readonly string[];
  locations: readonly number[];
};

/** Mirror a vertical gradient so the bottom edge matches the top (inverted). */
function mirrorGradient({ colors, locations }: GradientStops): GradientStops {
  return {
    colors: [...colors].reverse(),
    locations: [...locations].map((location) => 1 - location).reverse(),
  };
}

const TOP_MASK: GradientStops = {
  colors: ['#000000', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.25)', 'transparent'],
  locations: [0, 0.28, 0.65, 1],
};

const TOP_TINT: GradientStops = {
  colors: ['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.35)', 'transparent'],
  locations: [0, 0.45, 1],
};

const TOP_ANDROID_GRADIENT: GradientStops = {
  colors: ['rgba(0,0,0,0.98)', 'rgba(0,0,0,0.82)', 'rgba(0,0,0,0.5)', 'transparent'],
  locations: [0, 0.28, 0.65, 1],
};

const MASK: Record<Edge, GradientStops> = {
  top: TOP_MASK,
  bottom: mirrorGradient(TOP_MASK),
};

const TINT: Record<Edge, GradientStops> = {
  top: TOP_TINT,
  bottom: mirrorGradient(TOP_TINT),
};

const ANDROID_GRADIENT: Record<Edge, GradientStops> = {
  top: TOP_ANDROID_GRADIENT,
  bottom: mirrorGradient(TOP_ANDROID_GRADIENT),
};

interface EdgeBlurFadeProps {
  edge: Edge;
  height: number;
  style?: ViewStyle;
}

export function EdgeBlurFade({ edge, height, style }: EdgeBlurFadeProps) {
  const mask = MASK[edge];
  const tint = TINT[edge];
  const android = ANDROID_GRADIENT[edge];
  const positionStyle = edge === 'bottom' ? styles.bottom : styles.top;

  return (
    <View
      style={[styles.container, positionStyle, { height }, style]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Platform.OS === 'ios' ? (
        <MaskedView style={StyleSheet.absoluteFill} maskElement={<LinearGradient {...mask} style={StyleSheet.absoluteFill} />}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        </MaskedView>
      ) : (
        <LinearGradient {...android} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient {...tint} style={StyleSheet.absoluteFill} pointerEvents="none" />
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
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
});
