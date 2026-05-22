import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useThemedColors } from '@/theme';

interface Props {
  size?: number;
}

/** Pulsing exclamation used inline on processing buttons during the 3s retry flash. */
export function RecordingProcessingFlashIcon({ size = 18 }: Props) {
  const colors = useThemedColors();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.25, { duration: 280, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={iconStyle}>
      <Ionicons name="alert" size={size} color={colors.orange} />
    </Animated.View>
  );
}
