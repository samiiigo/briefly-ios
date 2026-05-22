import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useCreateStyles, useThemedColors } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
type Size = 'md' | 'lg' | 'compact';
const DIM: Record<Size, number> = {
  md: 48,
  lg: 56,
  compact: 48,
};
const ICON_SIZE: Record<Size, number> = {
  md: 26,
  lg: 28,
  compact: 24,
};
interface Props {
  size?: Size;
}
/** Brief alert flash after a user-initiated retry fails (shown on the processing circle). */
export function RecordingProcessingFlashCircle({ size = 'md' }: Props) {
  const styles = useCreateStyles(createRecordingProcessingFlashCircleStyles);
  const colors = useThemedColors();
  const dim = DIM[size];
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
    <View
      style={[
        styles.circle,
        { width: dim, height: dim, borderRadius: dim / 2 },
      ]}
    >
      <Animated.View style={iconStyle}>
        <Ionicons name="alert" size={ICON_SIZE[size]} color={colors.orange} />
      </Animated.View>
    </View>
  );
}
function createRecordingProcessingFlashCircleStyles(c: ColorPalette) {
  return StyleSheet.create({
    circle: {
      backgroundColor: c.emojiCircleBackground,
      borderWidth: 1,
      borderColor: 'rgba(255, 159, 10, 0.45)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
