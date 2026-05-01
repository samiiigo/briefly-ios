/**
 * usePlayback hook (SRP)
 *
 * Single responsibility: manage audio playback state and controls.
 * Extracted from TranscriptScreen so the screen component only handles rendering.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import { PlaybackService } from '../services/audio';
import type { PlaybackControls } from '../services/audio';
import { TranscriptSegment } from '../types';
import { SliderAnimation } from '../utils/theme';

interface UsePlaybackOptions {
  filePath: string;
  transcript?: TranscriptSegment[];
  playbackService?: PlaybackControls;
}

export function usePlayback({
  filePath,
  transcript,
  playbackService = PlaybackService,
}: UsePlaybackOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPos, setPlaybackPos] = useState(0);
  const [playbackDur, setPlaybackDur] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const trackWidth = useRef(0);
  const animatedProgress = useRef(new Animated.Value(0)).current;

  const progress = playbackDur > 0 ? playbackPos / playbackDur : 0;
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: SliderAnimation.duration,
      easing: SliderAnimation.easing,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  const cycleRate = useCallback(async () => {
    const rates = [1.0, 1.5, 2.0];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    await playbackService.setSpeed(next);
  }, [playbackRate, playbackService]);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await playbackService.pause();
      setIsPlaying(false);
    } else {
      if (playbackPos === 0 || playbackPos >= playbackDur - 0.5) {
        await playbackService.play(filePath, (pos, dur, playing) => {
          setPlaybackPos(pos);
          setPlaybackDur(dur);
          setIsPlaying(playing);
          if (transcript) {
            const active = transcript.find((s) => pos >= s.startTime && pos < s.endTime);
            setActiveSegmentId(active?.id ?? null);
          }
        });
      } else {
        await playbackService.resume();
      }
      setIsPlaying(true);
    }
  }, [isPlaying, playbackPos, playbackDur, filePath, transcript, playbackService]);

  const seek = useCallback(
    async (direction: 'back' | 'forward') => {
      const delta = direction === 'back' ? -15 : 15;
      const newPos = Math.max(0, Math.min(playbackDur, playbackPos + delta));
      await playbackService.seekTo(newPos);
      setPlaybackPos(newPos);
    },
    [playbackPos, playbackDur, playbackService]
  );

  const seekToRatio = useCallback(
    async (ratio: number) => {
      if (!playbackDur) return;
      const clamped = Math.max(0, Math.min(1, ratio));
      const newPos = clamped * playbackDur;
      await playbackService.seekTo(newPos);
      setPlaybackPos(newPos);
    },
    [playbackDur, playbackService]
  );

  return {
    isPlaying,
    playbackPos,
    playbackDur,
    playbackRate,
    activeSegmentId,
    trackWidth,
    animatedProgress,
    cycleRate,
    togglePlayPause,
    seek,
    seekToRatio,
  };
}
