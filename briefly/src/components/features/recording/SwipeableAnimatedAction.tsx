import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing, withAppFont } from '@/theme';

export const SWIPE_ACTION_SIZE = 76;
export const SWIPE_ACTION_GAP = Spacing.sm;
export const SWIPE_ACTION_INSET = 2;
export const SWIPE_ACTION_RADIUS = BorderRadius.cardXL - SWIPE_ACTION_INSET;

interface SwipeableAnimatedActionProps {
  progress: SharedValue<number>;
  index: number;
  count: number;
  /** Trailing actions reveal right-to-left; leading reveals left-to-right. */
  side: 'leading' | 'trailing';
  backgroundColor: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  marginRight?: number;
  numberOfLines?: number;
}

export function SwipeableAnimatedAction({
  progress,
  index,
  count,
  side,
  backgroundColor,
  icon,
  label,
  onPress,
  marginRight,
  numberOfLines = 1,
}: SwipeableAnimatedActionProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const stride = 1 / count;
    // Stagger in reveal order: trailing uncovers rightmost first; leading uncovers leftmost first.
    const revealIndex = side === 'trailing' ? count - 1 - index : index;
    const start = revealIndex * stride * 0.35;
    const end = Math.min(start + stride * 1.25, 1);
    const translateStart = side === 'trailing' && revealIndex === 0 ? 14 : -12;

    return {
      opacity: interpolate(progress.value, [start, end], [0, 1], Extrapolation.CLAMP),
      transform: [
        {
          scale: interpolate(progress.value, [start, end], [0.82, 1], Extrapolation.CLAMP),
        },
        {
          translateX: interpolate(
            progress.value,
            [start, end],
            [translateStart, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.actionButton,
        { backgroundColor, marginRight },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons name={icon} size={22} color={Colors.textPrimary} />
        <Text style={styles.label} numberOfLines={numberOfLines}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    width: SWIPE_ACTION_SIZE,
    alignSelf: 'stretch',
    marginVertical: SWIPE_ACTION_INSET,
    borderRadius: SWIPE_ACTION_RADIUS,
    overflow: 'hidden',
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  label: withAppFont({
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  }),
});
