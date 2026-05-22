import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
interface SwipeableMotionCardProps {
  translation: SharedValue<number>;
  children: React.ReactNode;
}
/** Subtle scale while swiping so the row feels connected to the gesture. */
export function SwipeableMotionCard({ translation, children }: SwipeableMotionCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const drag = Math.abs(translation.value);
    return {
      transform: [
        {
          scale: interpolate(drag, [0, 72, 140], [1, 0.994, 0.988], Extrapolation.CLAMP),
        },
      ],
    };
  });
  return <Animated.View style={[styles.card, animatedStyle]}>{children}</Animated.View>;
}
const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
});
