import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../utils/theme';

interface Props {
  isActive: boolean;
  barCount?: number;
}

export function WaveformVisualizer({ isActive, barCount = 20 }: Props) {
  const animations = useRef<Animated.Value[]>(
    Array.from({ length: barCount }, () => new Animated.Value(0.15))
  ).current;

  useEffect(() => {
    if (!isActive) {
      animations.forEach((anim) => {
        Animated.spring(anim, { toValue: 0.15, useNativeDriver: true }).start();
      });
      return;
    }

    const animateBar = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 0.2 + Math.random() * 0.8,
            duration: 300 + Math.random() * 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.1 + Math.random() * 0.3,
            duration: 200 + Math.random() * 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anims = animations.map((anim, i) => animateBar(anim, (i * 60) % 400));
    anims.forEach((a) => a.start());

    return () => {
      anims.forEach((a) => a.stop());
    };
  }, [isActive]);

  return (
    <View style={styles.container}>
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              transform: [{ scaleY: anim }],
              opacity: isActive ? 1 : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
    gap: 3,
  },
  bar: {
    width: 3,
    height: 60,
    borderRadius: 2,
    backgroundColor: Colors.waveform,
  },
});
