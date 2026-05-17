import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

type Edge = 'top' | 'bottom';

const MASK = {
  bottom: {
    colors: ['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.7)', '#000000'] as const,
    locations: [0, 0.35, 0.72, 1] as const,
  },
  top: {
    colors: ['#000000', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.25)', 'transparent'] as const,
    locations: [0, 0.28, 0.65, 1] as const,
  },
};

const TINT = {
  bottom: {
    colors: ['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.65)'] as const,
    locations: [0.35, 0.75, 1] as const,
  },
  top: {
    colors: ['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.35)', 'transparent'] as const,
    locations: [0, 0.45, 1] as const,
  },
};

const ANDROID_GRADIENT = {
  bottom: {
    colors: ['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.82)', 'rgba(0,0,0,0.98)'] as const,
    locations: [0, 0.35, 0.72, 1] as const,
  },
  top: {
    colors: ['rgba(0,0,0,0.98)', 'rgba(0,0,0,0.82)', 'rgba(0,0,0,0.5)', 'transparent'] as const,
    locations: [0, 0.28, 0.65, 1] as const,
  },
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
