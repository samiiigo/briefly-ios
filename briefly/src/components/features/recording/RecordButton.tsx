import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing } from '@/theme';

const SIZE = 56; // 44pt minimum for accessibility; 56pt provides comfortable tap area
const RED_DOT_SIZE = 14;

interface RecordButtonProps {
  onPress: () => void;
  /** Optional style overrides for position (e.g. bottom, right) */
  style?: object;
}

export function RecordButton({ onPress, style }: RecordButtonProps) {
  const content = (
    <View style={styles.glassWrap}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={60}
          tint="dark"
          style={[StyleSheet.absoluteFill, styles.blur]}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidGlass]} />
      )}
      {/* Top highlight for glass effect */}
      <LinearGradient
        colors={['rgba(255,255,255,0.2)', 'transparent']}
        style={styles.highlight}
      />
      <View style={styles.dot} />
    </View>
  );

  return (
    <TouchableOpacity
      style={[styles.fab, style]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel="Start recording"
      accessibilityRole="button"
      accessibilityHint="Opens the recording screen"
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.md,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    // Soft shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  glassWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: SIZE / 2,
    // Frosted glass: subtle border + top highlight
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  blur: {
    borderRadius: SIZE / 2,
  },
  androidGlass: {
    backgroundColor: 'rgba(40,40,45,0.75)',
    borderRadius: SIZE / 2,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SIZE / 3,
    borderTopLeftRadius: SIZE / 2,
    borderTopRightRadius: SIZE / 2,
  },
  dot: {
    width: RED_DOT_SIZE,
    height: RED_DOT_SIZE,
    borderRadius: RED_DOT_SIZE / 2,
    backgroundColor: Colors.recordButton,
    // Subtle inner shadow for depth (via elevation on Android)
    ...Platform.select({
      ios: {
        shadowColor: Colors.recordButton,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
