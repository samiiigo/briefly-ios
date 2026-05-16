import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFloatingTabBarLayout } from './useFloatingTabBarLayout';

/**
 * Progressive blur from the screen bottom up to the top of the floating tab bar.
 * Blur is weakest at the top of this band and strongest at the bottom.
 */
export function BottomTabBlurFade() {
  const { blurFadeHeight } = useFloatingTabBarLayout();

  return (
    <View
      style={[styles.container, { height: blurFadeHeight }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Platform.OS === 'ios' ? (
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.7)', '#000000']}
              locations={[0, 0.35, 0.72, 1]}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        </MaskedView>
      ) : (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.82)', 'rgba(0,0,0,0.98)']}
          locations={[0, 0.35, 0.72, 1]}
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.65)']}
        locations={[0.35, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    overflow: 'hidden',
  },
});
