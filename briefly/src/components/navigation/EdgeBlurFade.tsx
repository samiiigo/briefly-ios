import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

type Edge = 'top' | 'bottom';

type GradientStops = {
  colors: readonly [string, string, ...string[]];
  locations: readonly [number, number, ...number[]];
};

/** Canonical fade (strongest at the screen edge). Top uses the same layers, flipped vertically. */
const FADE_MASK: GradientStops = {
  colors: ['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.7)', '#000000'],
  locations: [0, 0.35, 0.72, 1],
};

const FADE_TINT: GradientStops = {
  colors: ['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.65)'],
  locations: [0, 0.55, 1],
};

const FADE_ANDROID: GradientStops = {
  colors: ['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.82)', 'rgba(0,0,0,0.98)'],
  locations: [0, 0.35, 0.72, 1],
};

interface EdgeBlurFadeProps {
  edge: Edge;
  height: number;
  style?: ViewStyle;
}

export function EdgeBlurFade({ edge, height, style }: EdgeBlurFadeProps) {
  const positionStyle = edge === 'bottom' ? styles.bottom : styles.top;
  const flipForTop = edge === 'top';

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
            maskElement={<LinearGradient {...FADE_MASK} style={StyleSheet.absoluteFill} />}
          >
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          </MaskedView>
        ) : (
          <LinearGradient {...FADE_ANDROID} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient {...FADE_TINT} style={StyleSheet.absoluteFill} pointerEvents="none" />
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
