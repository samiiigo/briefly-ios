import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenHeader } from '@/components/navigation/header/StackScreenHeader';
import { useFloatingTabBarLayout } from '@/components/navigation/layout/useFloatingTabBarLayout';
import { useTopChromeLayout } from '@/components/navigation/layout/useTopChromeLayout';
import { useScreenLayoutStyles } from '@/components/navigation/layout/screenLayout';
import { useLocalSearchParams } from 'expo-router';
import { WaveformVisualizer } from '@/components/features/recording/WaveformVisualizer';
import {
  Spacing,
  BorderRadius,
  useCreateStyles,
  useResolvedColorScheme,
  useThemedColors,
  withAppFont,
} from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
import { RecordingFolder } from '@/types';
import { formatTimestamp } from '@/utils';
import { useNewRecordingSession } from '@/hooks/recording/useNewRecordingSession';

/** Pause/stop row + labels (above bottom chrome fade). */
const RECORDING_CONTROLS_HEIGHT = 96;

export default function NewRecordingScreen() {
  const sl = useScreenLayoutStyles();
  const s = useCreateStyles(createNewRecordingStyles);
  const colors = useThemedColors();
  const isLight = useResolvedColorScheme() === 'light';
  const { scrollPaddingTop } = useTopChromeLayout();
  const { bottomOffset } = useFloatingTabBarLayout();
  const livePreviewScrollRef = useRef<ScrollView | null>(null);
  const params = useLocalSearchParams<{
    targetFolder?: string;
    targetUserFolderId?: string;
    markImported?: string;
  }>();
  const saveParams = useMemo(
    () => ({
      targetFolder: params.targetFolder as RecordingFolder | undefined,
      targetUserFolderId: params.targetUserFolderId,
      markImported: params.markImported === 'true',
    }),
    [params.markImported, params.targetFolder, params.targetUserFolderId],
  );
  const session = useNewRecordingSession({ saveParams });
  const {
    hrs,
    min,
    sec,
    isPaused,
    isStarted,
    isStopping,
    startFailed,
    interruptHint,
    showLivePreviewPanel,
    partialText,
    liveSegments,
    hasAnyText,
    placeholder,
    getMetering,
    handlePause,
    handleStop,
    handleBack,
  } = session;

  return (
    <View style={sl.container}>
      <View
        style={[
          s.body,
          {
            paddingTop: scrollPaddingTop,
            paddingBottom: bottomOffset + RECORDING_CONTROLS_HEIGHT,
          },
        ]}
      >
        {interruptHint ? (
          <View style={s.hintBanner}>
            <Ionicons name="information-circle-outline" size={16} color={colors.orange} />
            <Text style={s.hintText}>{interruptHint}</Text>
          </View>
        ) : null}
        <View style={s.recInd}>
          <View style={[s.dot, isPaused && s.dotP]} />
          <Text style={[s.recTxt, isPaused && s.pTxt]}>
            {startFailed ? 'Unavailable' : isPaused ? 'Paused' : 'Recording'}
          </Text>
        </View>
        <View style={s.timerC}>
          <View style={s.timerCard}>
            <View style={s.tBlk}>
              <Text style={s.tDig}>{String(hrs).padStart(2, '0')}</Text>
              <Text style={s.tLbl}>HRS</Text>
            </View>
            <Text style={s.tSep}>:</Text>
            <View style={s.tBlk}>
              <Text style={s.tDig}>{String(min).padStart(2, '0')}</Text>
              <Text style={s.tLbl}>MIN</Text>
            </View>
            <Text style={s.tSep}>:</Text>
            <View style={s.tBlk}>
              <Text style={s.tDig}>{String(sec).padStart(2, '0')}</Text>
              <Text style={s.tLbl}>SEC</Text>
            </View>
          </View>
        </View>
        <View style={s.wfC}>
          <WaveformVisualizer
            isActive={isStarted && !isPaused && !startFailed}
            barCount={24}
            getMetering={getMetering}
          />
        </View>
        {showLivePreviewPanel ? (
          <View style={s.lpC}>
            <View style={s.lpH}>
              <Ionicons name="document-text" size={14} color={colors.primary} />
              <Text style={s.lpLbl}>Live preview</Text>
            </View>
            <ScrollView
              ref={livePreviewScrollRef}
              style={s.lpScroll}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                livePreviewScrollRef.current?.scrollToEnd({ animated: true })
              }
            >
              {hasAnyText ? (
                <>
                  {liveSegments.current.map((seg) => (
                    <View key={seg.id} style={s.segBlk}>
                      <Text style={s.segTs}>{formatTimestamp(seg.startTime)}</Text>
                      <Text style={s.segTxt}>{seg.text}</Text>
                    </View>
                  ))}
                  {partialText ? (
                    <View style={s.segBlk}>
                      <View style={{ width: 38 }} />
                      <Text style={[s.segTxt, s.partTxt]}>{partialText}</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={s.lpPh}>{placeholder}</Text>
              )}
            </ScrollView>
          </View>
        ) : null}
      </View>
      <View style={s.ctrlsChrome} pointerEvents="box-none">
        <View style={[s.ctrls, { paddingBottom: bottomOffset }]} pointerEvents="box-none">
          <View style={s.ctrlItem}>
            <Pressable
              style={({ pressed }) => [s.pauseBtn, pressed && Platform.OS === 'ios' && { opacity: 0.75 }]}
              onPress={handlePause}
              disabled={!isStarted || startFailed || isStopping}
              android_ripple={{
                color: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)',
                borderless: false,
                radius: 32,
              }}
            >
              <Ionicons name={isPaused ? 'play' : 'pause'} size={26} color={colors.textPrimary} />
            </Pressable>
            <Text style={s.ctrlLbl}>{isPaused ? 'RESUME' : 'PAUSE'}</Text>
          </View>
          <View style={s.ctrlItem}>
            <Pressable
              style={({ pressed }) => [s.stopBtn, pressed && Platform.OS === 'ios' && { opacity: 0.75 }]}
              onPress={handleStop}
              disabled={!isStarted || startFailed || isStopping}
              android_ripple={{ color: 'rgba(0,0,0,0.2)', borderless: false, radius: 32 }}
            >
              <View style={s.stopSq} />
            </Pressable>
            <Text style={[s.ctrlLbl, { color: colors.recordButton }]}>
              {isStopping ? 'STOPPING…' : 'STOP'}
            </Text>
          </View>
        </View>
      </View>
      <StackScreenHeader title="New Recording" showBack onBack={handleBack} />
    </View>
  );
}

function hexAlpha(hex: string, alpha: number): string {
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

function createNewRecordingStyles(c: ColorPalette) {
  return StyleSheet.create({
    body: { flex: 1 },
    hintBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 8,
      backgroundColor: hexAlpha(c.orange, 0.12),
      borderRadius: BorderRadius.md,
    },
    hintText: withAppFont({
      flex: 1,
      fontSize: 13,
      color: c.orange,
      lineHeight: 18,
    }),
    recInd: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginBottom: Spacing.sm,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.green },
    dotP: { backgroundColor: c.orange },
    recTxt: withAppFont({ fontSize: 12, color: c.green, fontWeight: '500' }),
    pTxt: { color: c.orange },
    timerC: { alignItems: 'center', paddingVertical: Spacing.lg },
    timerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: BorderRadius.cardXL,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
    },
    tBlk: { alignItems: 'center', minWidth: 60 },
    tDig: withAppFont({
      fontSize: 48,
      fontWeight: '700',
      color: c.textPrimary,
      fontVariant: ['tabular-nums'],
    }),
    tLbl: withAppFont({
      fontSize: 11,
      fontWeight: '500',
      color: c.textSecondary,
      letterSpacing: 1,
      marginTop: 2,
    }),
    tSep: withAppFont({
      fontSize: 40,
      fontWeight: '300',
      color: c.textSecondary,
      paddingBottom: 8,
      marginHorizontal: 4,
    }),
    wfC: { alignItems: 'center', paddingVertical: Spacing.lg },
    lpC: {
      flex: 1,
      marginHorizontal: Spacing.md,
      backgroundColor: c.card,
      borderRadius: BorderRadius.cardXL,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    lpH: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
    lpLbl: withAppFont({ fontSize: 13, fontWeight: '600', color: c.primary, flex: 1 }),
    lpScroll: { flex: 1 },
    segBlk: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 5,
      gap: 8,
    },
    segTs: withAppFont({
      width: 38,
      flexShrink: 0,
      fontSize: 12,
      color: c.textTertiary,
      paddingTop: 3,
      fontVariant: ['tabular-nums'],
    }),
    segTxt: withAppFont({ flex: 1, fontSize: 15, color: c.textPrimary, lineHeight: 22 }),
    partTxt: { color: c.textSecondary, fontStyle: 'italic' },
    lpPh: withAppFont({
      fontSize: 15,
      color: c.textTertiary,
      lineHeight: 22,
      fontStyle: 'italic',
    }),
    ctrlsChrome: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 11,
      elevation: 11,
    },
    ctrls: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.xxl,
      paddingTop: Spacing.md,
    },
    ctrlItem: { alignItems: 'center', gap: Spacing.xs },
    pauseBtn: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopBtn: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.recordButton,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopSq: { width: 22, height: 22, borderRadius: 4, backgroundColor: '#FFFFFF' },
    ctrlLbl: withAppFont({
      fontSize: 11,
      fontWeight: '600',
      color: c.textSecondary,
      letterSpacing: 1,
    }),
  });
}
