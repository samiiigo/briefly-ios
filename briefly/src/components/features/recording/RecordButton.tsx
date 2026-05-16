import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/theme';

const SIZE = 56;
const RING_SIZE = 24;

interface RecordButtonProps {
  onPress: () => void;
  style?: object;
}

export function RecordButton({ onPress, style }: RecordButtonProps) {
  const insets = useSafeAreaInsets();
  const pingScale = useSharedValue(1);
  const pingOpacity = useSharedValue(0.5);

  useEffect(() => {
    pingScale.value = withRepeat(
      withTiming(1.35, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      true
    );
    pingOpacity.value = withRepeat(
      withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      true
    );
  }, [pingOpacity, pingScale]);

  const pingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pingScale.value }],
    opacity: pingOpacity.value,
  }));

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: 32 + insets.bottom }, style]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityLabel="Create new recording"
      accessibilityRole="button"
      accessibilityHint="Opens the recording screen"
    >
      <View style={styles.ringOuter}>
        <Animated.View style={[styles.pingRing, pingStyle]} />
        <View style={styles.recordRing} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 32,
    right: Spacing.lg,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 50,
  },
  ringOuter: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.danger,
  },
  recordRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.danger,
    backgroundColor: 'transparent',
  },
});
