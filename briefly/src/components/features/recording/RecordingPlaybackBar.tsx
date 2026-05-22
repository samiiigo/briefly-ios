import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  GestureResponderEvent,
  LayoutChangeEvent,
  Animated,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePlayback } from '@/hooks/recording/usePlayback';
import { Recording } from '@/types';
import { formatDuration } from '@/utils';
import { BottomChromeOverlay } from '@/components/navigation/chrome/BottomChromeOverlay';
import {
  useCreateStyles,
  useResolvedColorScheme,
  useThemedColors,
  Spacing,
  BorderRadius,
  withAppFont,
} from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
interface Props {
  recording: Recording;
  playback: ReturnType<typeof usePlayback>;
  paddingBottom: number;
}
export function RecordingPlaybackBar({ recording, playback, paddingBottom }: Props) {
  const styles = useCreateStyles(createRecordingPlaybackBarStyles);
  const colors = useThemedColors();
  const isLight = useResolvedColorScheme() === 'light';
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(false);
  const {
    isPlaying,
    playbackDur,
    trackWidth,
    animatedProgress,
    togglePlayPause,
    seekToRatio,
  } = playback;
  const progressFillWidth = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const progressThumbLeft = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const handleProgressTap = useCallback(
    async (e: GestureResponderEvent) => {
      if (!playbackDur || trackWidth.current === 0) return;
      await seekToRatio(e.nativeEvent.locationX / trackWidth.current);
    },
    [playbackDur, seekToRatio, trackWidth],
  );
  const minimize = useCallback(() => {
    if (!expandedRef.current) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    expandedRef.current = false;
    setExpanded(false);
  }, []);
  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);
  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      await togglePlayPause();
      minimize();
      return;
    }
    if (!expanded) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      expandedRef.current = true;
      setExpanded(true);
    }
    await togglePlayPause();
  }, [expanded, isPlaying, togglePlayPause, minimize]);
  const durationLabel = formatDuration(playbackDur || recording.duration);
  const playButton = (
    <TouchableOpacity
      style={styles.playButton}
      onPress={handlePlayPause}
      accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
    >
      <Ionicons
        name={isPlaying ? 'pause' : 'play'}
        size={26}
        color={colors.textPrimary}
        style={!isPlaying ? styles.playIconOffset : undefined}
      />
    </TouchableOpacity>
  );
  const durationLabelView = (
    <Text style={styles.durationText}>{durationLabel}</Text>
  );
  return (
    <BottomChromeOverlay variant="playback">
      {expanded ? (
        <Pressable
          style={styles.dismissBackdrop}
          onPress={minimize}
          accessibilityRole="button"
          accessibilityLabel="Collapse audio player"
        />
      ) : null}
      <View style={[styles.wrapper, { paddingBottom }]} pointerEvents="box-none">
        <View
          style={[
            styles.pill,
            isLight ? styles.pillLight : styles.pillDark,
            expanded && styles.pillExpanded,
          ]}
        >
          {Platform.OS === 'ios' && (
            <BlurView
              intensity={60}
              tint={isLight ? 'light' : 'dark'}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}
          <View
            style={[
              StyleSheet.absoluteFill,
              isLight ? styles.pillOverlayLight : styles.pillOverlayDark,
            ]}
            pointerEvents="none"
          />
          {expanded ? (
            <View style={styles.expandedRow} pointerEvents="box-none">
              {playButton}
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleProgressTap}
                onLayout={(e: LayoutChangeEvent) => {
                  trackWidth.current = e.nativeEvent.layout.width;
                }}
                style={styles.progressTrack}
              >
                <Animated.View style={[styles.progressFill, { width: progressFillWidth }]} />
                <Animated.View style={[styles.progressThumb, { left: progressThumbLeft }]} />
              </TouchableOpacity>
              {durationLabelView}
            </View>
          ) : (
            <View style={styles.collapsedRow} pointerEvents="box-none">
              {playButton}
              {durationLabelView}
            </View>
          )}
        </View>
      </View>
    </BottomChromeOverlay>
  );
}
function pillOverlayRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  const n =
    raw.length === 3
      ? raw
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : raw;
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${alpha})`;
}
function createRecordingPlaybackBarStyles(c: ColorPalette) {
  return StyleSheet.create({
    dismissBackdrop: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1,
      elevation: 1,
    },
    wrapper: {
      alignItems: 'flex-end',
      zIndex: 2,
      elevation: 2,
      paddingHorizontal: Spacing.screenHorizontal,
    },
    pill: {
      borderRadius: BorderRadius.full,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 24,
      elevation: 12,
    },
    pillDark: {
      borderColor: 'rgba(255,255,255,0.1)',
      backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(28,28,30,0.92)',
    },
    pillLight: {
      borderColor: c.border,
      backgroundColor: Platform.OS === 'ios' ? 'transparent' : c.surfaceElevated,
    },
    pillExpanded: {
      alignSelf: 'flex-end',
      width: 300,
      maxWidth: '100%',
      borderRadius: BorderRadius.full,
    },
    pillOverlayDark: {
      backgroundColor: 'rgba(28,28,30,0.9)',
    },
    pillOverlayLight: {
      backgroundColor: pillOverlayRgba(c.background, 0.88),
    },
    collapsedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingLeft: 6,
      paddingRight: Spacing.md,
      gap: Spacing.xs,
      zIndex: 1,
    },
    expandedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingLeft: 6,
      paddingRight: Spacing.md,
      gap: Spacing.md,
      zIndex: 1,
    },
    durationText: withAppFont({
      fontSize: 13,
      fontWeight: '500',
      color: c.textSecondary,
      fontVariant: ['tabular-nums'],
      minWidth: 36,
      textAlign: 'right',
    }),
    playButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playIconOffset: {
      marginLeft: 3,
    },
    progressTrack: {
      flex: 1,
      alignSelf: 'center',
      height: 4,
      marginHorizontal: Spacing.xs,
      backgroundColor: c.border,
      borderRadius: 2,
      position: 'relative',
    },
    progressFill: {
      height: 4,
      backgroundColor: c.primary,
      borderRadius: 2,
    },
    progressThumb: {
      position: 'absolute',
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: c.primary,
      top: -5,
      marginLeft: -7,
    },
  });
}
