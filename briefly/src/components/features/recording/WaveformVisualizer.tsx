import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { RecordingService } from '@/services/audio';
import { Colors } from '@/theme';

const POLL_MS = 80;
const MIN_SCALE = 0.05;

interface Props {
  isActive: boolean;
  barCount?: number;
  /** Optional metering source. Falls back to RecordingService.getMetering(). */
  getMetering?: () => number | Promise<number>;
}

export function WaveformVisualizer({ isActive, barCount = 20, getMetering }: Props) {
  const animations = useRef<Animated.Value[]>(
    Array.from({ length: barCount }, () => new Animated.Value(MIN_SCALE))
  ).current;

  // Rolling buffer — newest sample at the end, rendered right-to-left
  const buffer = useRef<number[]>(Array(barCount).fill(MIN_SCALE));

  useEffect(() => {
    if (!isActive) {
      animations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: MIN_SCALE,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;

      const raw = getMetering ? await getMetering() : RecordingService.getMetering();
      if (cancelled) return;

      const displayLevel = Math.max(MIN_SCALE, raw);

      // Shift buffer left, push new sample on the right
      buffer.current.shift();
      buffer.current.push(Math.max(MIN_SCALE, displayLevel));

      // Drive each bar to its buffered value
      buffer.current.forEach((val, i) => {
        Animated.timing(animations[i], {
          toValue: val,
          duration: 60,
          useNativeDriver: true,
        }).start();
      });

      setTimeout(poll, POLL_MS);
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [animations, isActive, getMetering]);

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
