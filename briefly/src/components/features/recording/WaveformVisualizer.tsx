import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { RecordingService } from '@/services/audio';
import { Colors } from '@/theme';

const SAMPLE_MS = 80;
const MIN_SCALE = 0.05;

interface Props {
  isActive: boolean;
  barCount?: number;
  /** Optional metering source. Falls back to RecordingService.getMetering(). */
  getMetering?: () => number;
}

export function WaveformVisualizer({ isActive, barCount = 20, getMetering }: Props) {
  const animations = useRef<Animated.Value[]>(
    Array.from({ length: barCount }, () => new Animated.Value(MIN_SCALE)),
  ).current;

  const buffer = useRef<number[]>(Array.from({ length: barCount }, () => MIN_SCALE));
  const headRef = useRef(0);
  const getMeteringRef = useRef(getMetering);
  getMeteringRef.current = getMetering;

  useEffect(() => {
    if (!isActive) {
      headRef.current = 0;
      buffer.current.fill(MIN_SCALE);
      animations.forEach((anim) => {
        anim.setValue(MIN_SCALE);
      });
      return;
    }

    let cancelled = false;
    let lastSampleAt = 0;
    let rafId = 0;

    const sample = () => {
      const readMetering = getMeteringRef.current ?? RecordingService.getMetering.bind(RecordingService);
      const raw = readMetering();
      const level = Math.max(MIN_SCALE, raw);

      const head = headRef.current;
      buffer.current[head] = level;
      headRef.current = (head + 1) % barCount;

      for (let i = 0; i < barCount; i++) {
        const idx = (headRef.current + i) % barCount;
        animations[i].setValue(buffer.current[idx]);
      }
    };

    const frame = (timestamp: number) => {
      if (cancelled) return;
      if (timestamp - lastSampleAt >= SAMPLE_MS) {
        lastSampleAt = timestamp;
        sample();
      }
      rafId = requestAnimationFrame(frame);
    };

    lastSampleAt = 0;
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [animations, barCount, isActive]);

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
