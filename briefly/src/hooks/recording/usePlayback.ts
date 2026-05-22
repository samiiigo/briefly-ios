import { useState, useRef, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';
import { PlaybackService } from '@/services/audio';
import type { PlaybackControls } from '@/services/audio';
import { TranscriptSegment } from '@/types';
import { SliderAnimation } from '@/theme';
import { logger } from '@/utils/logging/logger';
interface UsePlaybackOptions {
  filePath: string;
  transcript?: TranscriptSegment[];
  playbackService?: PlaybackControls;
}
/** Assumes segments are sorted by `startTime` (typical transcript order). */
function findActiveTranscriptSegment(
  segments: TranscriptSegment[],
  position: number,
): TranscriptSegment | undefined {
  if (segments.length === 0) return undefined;
  let lo = 0;
  let hi = segments.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const seg = segments[mid];
    if (position < seg.startTime) {
      hi = mid - 1;
    } else if (position >= seg.endTime) {
      lo = mid + 1;
    } else {
      return seg;
    }
  }
  return undefined;
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
  const filePathRef = useRef(filePath);
  useEffect(() => {
    filePathRef.current = filePath;
  }, [filePath]);
  const progress = playbackDur > 0 ? playbackPos / playbackDur : 0;
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: SliderAnimation.duration,
      easing: SliderAnimation.easing,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);
  useEffect(() => {
    return () => {
      void playbackService.stop();
    };
  }, [playbackService]);
  const handleStatusUpdate = useCallback(
    (status: {
      position: number;
      duration: number;
      playing: boolean;
      didJustFinish: boolean;
    }) => {
      setPlaybackPos(status.position);
      if (status.duration > 0) {
        setPlaybackDur(status.duration);
      }
      if (status.playing) {
        setIsPlaying(true);
      } else if (status.didJustFinish) {
        setIsPlaying(false);
      }
      if (transcript) {
        const active = findActiveTranscriptSegment(transcript, status.position);
        setActiveSegmentId(active?.id ?? null);
      }
    },
    [transcript],
  );
  const cycleRate = useCallback(async () => {
    const rates = [1.0, 1.5, 2.0];
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(next);
    await playbackService.setSpeed(next);
  }, [playbackRate, playbackService]);
  const togglePlayPause = useCallback(async () => {
    const uri = filePathRef.current?.trim();
    if (!uri) {
      logger.warn('AUDIO', 'Playback skipped: missing file path');
      return;
    }
    try {
      if (isPlaying) {
        await playbackService.pause();
        setIsPlaying(false);
        return;
      }
      if (playbackPos === 0 || playbackPos >= playbackDur - 0.5) {
        setIsPlaying(true);
        await playbackService.play(uri, handleStatusUpdate);
      } else {
        await playbackService.resume();
        setIsPlaying(true);
      }
    } catch (error) {
      setIsPlaying(false);
      logger.error('AUDIO', 'Playback failed', {
        uri,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [isPlaying, playbackPos, playbackDur, handleStatusUpdate, playbackService]);
  const seek = useCallback(
    async (direction: 'back' | 'forward') => {
      const delta = direction === 'back' ? -15 : 15;
      const newPos = Math.max(0, Math.min(playbackDur, playbackPos + delta));
      await playbackService.seekTo(newPos);
      setPlaybackPos(newPos);
    },
    [playbackPos, playbackDur, playbackService],
  );
  const seekToRatio = useCallback(
    async (ratio: number) => {
      if (!playbackDur) return;
      const clamped = Math.max(0, Math.min(1, ratio));
      const newPos = clamped * playbackDur;
      await playbackService.seekTo(newPos);
      setPlaybackPos(newPos);
    },
    [playbackDur, playbackService],
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
