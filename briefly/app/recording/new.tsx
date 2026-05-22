import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { useFloatingTabBarLayout } from '@/components/navigation/useFloatingTabBarLayout';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { useScreenLayoutStyles } from '@/components/navigation/screenLayout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  RecordingService,
  DecorativeLivePreview,
  DecorativeOnDeviceLivePreview,
  LiveTranscriptionService,
} from '@/services/audio';
import { saveCapturedRecording } from '@/services/recording/saveCapturedRecording';
import { interceptOnDeviceSummarizationIfBlocked } from '@/utils/processing/localLlmSummarizationGate';
import { RecordingFolder } from '@/types';
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
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import {
  normalizeTranscriptionMode,
  resolveDecorativePreviewEngine,
  canRunDecorativeLivePreview,
} from '@/utils/processing/transcriptionMode';
import { formatTimestamp } from '@/utils';
import {
  isRecordingTooShort,
  minRecordingDurationHint,
  STOP_EARLY_CONFIRM_THRESHOLD_SEC,
} from '@/utils/recording/recordingValidation';
import { openAppSettings } from '@/utils/recording/recordingPermissions';
import { useTimer } from '@/hooks/useTimer';
import { useLiveTranscript } from '@/hooks/useLiveTranscript';
import { useAppInterruptGuard } from '@/hooks/useAppInterruptGuard';
import {
  onRecordingEnteredBackground,
  onRecordingReturnedForeground,
  registerRecordingStoppedHandler,
} from '@/services/audio/recordingSession';
import { updateRecordingLiveActivity } from '@/services/audio/recordingLiveActivity';
import { isAndroid } from '@/utils/platform';
function isPermissionError(message: string): boolean {
  return /microphone|permission|speech recognition/i.test(message);
}

/** Pause/stop row + labels (above bottom chrome fade). */
const RECORDING_CONTROLS_HEIGHT = 96;

export default function NewRecordingScreen() {
  const sl = useScreenLayoutStyles();
  const s = useCreateStyles(createNewRecordingStyles);
  const colors = useThemedColors();
  const isLight = useResolvedColorScheme() === 'light';
  const { scrollPaddingTop } = useTopChromeLayout();
  const { bottomOffset } = useFloatingTabBarLayout();
  const router = useRouter();
  const params = useLocalSearchParams<{
    targetFolder?: string;
    targetUserFolderId?: string;
    markImported?: string;
  }>();
  const setLiveTranscript = useRecordingStore((s) => s.setLiveTranscript);
  const { transcriptionMode: settingsTranscriptionMode, showLivePreview } = useSettingsStore();
  const { elapsed, elapsedRef, start: startTimer, stop: stopTimer } = useTimer();
  const live = useLiveTranscript(setLiveTranscript, elapsedRef);
  const { finalText, partialText, liveSegments, isStopped, onPartial, onFinal, flush, reset, cleanup } =
    live;
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [startFailed, setStartFailed] = useState(false);
  const [interruptHint, setInterruptHint] = useState<string | null>(null);
  const livePreviewScrollRef = useRef<ScrollView | null>(null);
  const isPausedRef = useRef(false);
  const previewEngineRef = useRef<'cloud' | 'on-device' | 'none'>('none');
  const isMountedRef = useRef(true);

  const settingsMode = normalizeTranscriptionMode(settingsTranscriptionMode);
  const previewEngine = resolveDecorativePreviewEngine(settingsMode, {
    canCloudLive: LiveTranscriptionService.isSupported,
    canOnDeviceLive: LiveTranscriptionService.isOnDeviceSupported,
  });
  const showLivePreviewPanel = canRunDecorativeLivePreview(showLivePreview, previewEngine);

  const getMetering = useCallback(() => RecordingService.getMetering(), []);

  const stopDecorativePreview = useCallback(() => {
    if (previewEngineRef.current === 'cloud') {
      DecorativeLivePreview.stop();
    } else if (previewEngineRef.current === 'on-device') {
      DecorativeOnDeviceLivePreview.stop();
    }
    previewEngineRef.current = 'none';
  }, []);

  const startDecorativePreview = useCallback(async () => {
    if (!showLivePreviewPanel) return;
    previewEngineRef.current = previewEngine;
    if (previewEngine === 'cloud') {
      await DecorativeLivePreview.start(
        () => RecordingService.getActiveRecordingUri(),
        {
          onPartial,
          onFinal,
          onConnectionState: () => {},
          onError: (msg) => {
            if (liveSegments.current.length === 0) {
              setLiveTranscript('Reconnecting…');
            }
            if (/permission|denied|not authorized/i.test(msg)) {
              setInterruptHint('Speech recognition may be unavailable. Check Settings.');
            }
          },
        },
      );
      return;
    }
    if (previewEngine === 'on-device') {
      await DecorativeOnDeviceLivePreview.start({
        onPartial,
        onFinal,
        onConnectionState: () => {},
        onError: (msg) => {
          if (/permission|denied|not authorized/i.test(msg)) {
            setInterruptHint('Speech recognition may be unavailable. Check Settings.');
          }
        },
      });
    }
  }, [onFinal, onPartial, previewEngine, setLiveTranscript, showLivePreviewPanel]);

  const teardownCapture = useCallback(async () => {
    try {
      stopDecorativePreview();
      if (isStarted) {
        await RecordingService.stop();
      }
    } catch {
      // Best-effort cleanup
    }
  }, [isStarted, stopDecorativePreview]);

  const showPermissionAlert = useCallback(
    (message: string) => {
      Alert.alert('Microphone access needed', message, [
        { text: 'Cancel', style: 'cancel', onPress: () => router.replace('/(tabs)') },
        { text: 'Open Settings', onPress: () => openAppSettings() },
      ]);
    },
    [router],
  );

  const executeStopAndSaveRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!isAndroid) return;

    registerRecordingStoppedHandler(() => {
      void executeStopAndSaveRef.current();
    });
    return () => registerRecordingStoppedHandler(null);
  }, []);

  useEffect(() => {
    if (!isStarted || startFailed || isStopped.current) return;

    updateRecordingLiveActivity(elapsedRef.current, isPausedRef.current);
    const interval = setInterval(() => {
      updateRecordingLiveActivity(elapsedRef.current, isPausedRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted, startFailed, isPaused, elapsed]);

  useAppInterruptGuard({
    enabled: isStarted && !startFailed && !isStopped.current,
    onBackground: () => {
      void (async () => {
        const hint = await onRecordingEnteredBackground();
        if (hint) setInterruptHint(hint);
      })();
    },
    onForeground: () => {
      void onRecordingReturnedForeground();
      setInterruptHint(null);
    },
  });

  useEffect(() => {
    isMountedRef.current = true;
    reset();
    setLiveTranscript('');

    (async () => {
      try {
        await RecordingService.start();
        if (showLivePreviewPanel) {
          await new Promise((r) => setTimeout(r, 300));
          try {
            await startDecorativePreview();
          } catch {
            // Decorative preview is optional; recording still works without it.
          }
        }
        if (!isMountedRef.current) {
          await teardownCapture();
          return;
        }
        setIsStarted(true);
        startTimer();
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        setStartFailed(true);
        const message = err instanceof Error ? err.message : 'Could not start recording.';
        if (isPermissionError(message)) {
          showPermissionAlert(message);
        } else {
          Alert.alert('Could not start recording', message, [
            { text: 'OK', onPress: () => router.replace('/(tabs)') },
          ]);
        }
      }
    })();

    return () => {
      isMountedRef.current = false;
      stopTimer();
      cleanup();
      void teardownCapture();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumeRecording = useCallback(async () => {
    if (!isStarted || startFailed || isStopped.current || !isPausedRef.current) return;
    try {
      if (previewEngineRef.current === 'cloud') DecorativeLivePreview.resume();
      else if (previewEngineRef.current === 'on-device') await DecorativeOnDeviceLivePreview.resume();
      await RecordingService.resume();
      startTimer();
      setIsPaused(false);
      isPausedRef.current = false;
      updateRecordingLiveActivity(elapsedRef.current, false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not resume recording.';
      Alert.alert('Error', message);
    }
  }, [isStarted, startFailed, startTimer]);

  const pauseRecording = useCallback(async () => {
    if (!isStarted || startFailed || isStopped.current || isPausedRef.current) return;
    try {
      if (previewEngineRef.current === 'cloud') DecorativeLivePreview.pause();
      else if (previewEngineRef.current === 'on-device') await DecorativeOnDeviceLivePreview.pause();
      await RecordingService.pause();
      stopTimer();
      setIsPaused(true);
      isPausedRef.current = true;
      updateRecordingLiveActivity(elapsedRef.current, true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not pause recording.';
      Alert.alert('Error', message);
    }
  }, [isStarted, startFailed, stopTimer]);

  const handlePause = async () => {
    if (isPausedRef.current) await resumeRecording();
    else await pauseRecording();
  };

  const handleDiscard = useCallback(() => {
    Alert.alert('Discard recording', 'This recording will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (!isStopped.current && isStarted && !startFailed) {
              isStopped.current = true;
              stopTimer();
              cleanup();
              await teardownCapture();
            }
            router.replace('/(tabs)');
          })();
        },
      },
    ]);
  }, [cleanup, isStarted, router, startFailed, stopTimer, teardownCapture]);

  const handleBack = useCallback(() => {
    if (isStarted && !isStopped.current && !startFailed) {
      handleDiscard();
      return;
    }
    router.replace('/(tabs)');
  }, [handleDiscard, isStarted, router, startFailed]);

  useEffect(() => {
    const onBackPress = () => {
      if (isStarted && !isStopped.current && !startFailed) {
        handleDiscard();
        return true; // Prevent default behavior
      }
      return false; // Let default behavior happen (e.g., if failed to start)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandler.remove();
  }, [isStarted, startFailed, handleDiscard]);

  const pauseIfRecording = useCallback(async (): Promise<boolean> => {
    if (!isStarted || startFailed || isPausedRef.current) return true;
    await pauseRecording();
    return isPausedRef.current;
  }, [isStarted, pauseRecording, startFailed]);

  const discardActiveRecording = useCallback(async () => {
    if (isStopped.current) {
      router.replace('/(tabs)');
      return;
    }
    setIsStopping(true);
    isStopped.current = true;
    stopTimer();
    cleanup();
    await teardownCapture();
    router.replace('/(tabs)');
  }, [cleanup, router, stopTimer, teardownCapture]);

  const executeStopAndSave = useCallback(async () => {
    if (isStopped.current || isStopping || startFailed) return;

    setIsStopping(true);
    isStopped.current = true;
    stopTimer();
    cleanup();

    let result;
    try {
      stopDecorativePreview();
      result = await RecordingService.stop();
    } catch (e: unknown) {
      try {
        await new Promise((r) => setTimeout(r, 300));
        result = await RecordingService.stop();
      } catch (retryErr: unknown) {
        isStopped.current = false;
        setIsStopping(false);
        if (!isPausedRef.current) startTimer();
        const message =
          retryErr instanceof Error ? retryErr.message : 'Could not stop recording.';
        Alert.alert('Error', message);
        return;
      }
    }

    flush();
    const stoppedDurationSec = result?.duration || elapsed;
    const filePath = result?.uri ?? '';
    const fileSize = result?.fileSize ?? 0;

    if (
      isRecordingTooShort({
        durationSec: stoppedDurationSec,
        filePath,
        fileSizeBytes: fileSize,
      })
    ) {
      setIsStopping(false);
      isStopped.current = false;
      Alert.alert('Recording too short', minRecordingDurationHint('stop'), [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
      return;
    }

    if (!filePath) {
      setIsStopping(false);
      Alert.alert(
        'Recording unavailable',
        'No audio was saved. Check microphone permissions and try again.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => router.replace('/(tabs)') },
          { text: 'Open Settings', onPress: () => openAppSettings() },
        ],
      );
      return;
    }

    try {
      const { summarizationBlocked } = await saveCapturedRecording({
        duration: stoppedDurationSec,
        filePath,
        fileSize,
        targetFolder: (params.targetFolder as RecordingFolder) ?? 'unlisted',
        targetUserFolderId: params.targetUserFolderId,
        markImported: params.markImported === 'true',
      });
      if (summarizationBlocked) {
        interceptOnDeviceSummarizationIfBlocked(useSettingsStore.getState().summarizationMode);
      }
      router.replace('/(tabs)');
    } catch {
      isStopped.current = false;
      setIsStopping(false);
      Alert.alert('Could not save', 'Something went wrong while saving. Please try again.');
    }
  }, [
    cleanup,
    elapsed,
    flush,
    isStopping,
    params.markImported,
    params.targetFolder,
    params.targetUserFolderId,
    router,
    startFailed,
    startTimer,
    stopDecorativePreview,
    stopTimer,
  ]);

  executeStopAndSaveRef.current = executeStopAndSave;

  const handleStop = async () => {
    if (isStopped.current || isStopping || startFailed) return;

    const durationSec = elapsedRef.current || elapsed;
    if (durationSec < STOP_EARLY_CONFIRM_THRESHOLD_SEC) {
      const paused = await pauseIfRecording();
      if (!paused) return;

      Alert.alert(
        'Stop recording?',
        `Recordings under ${STOP_EARLY_CONFIRM_THRESHOLD_SEC} seconds won't be saved. Are you sure you want to stop?`,
        [
          {
            text: 'Resume',
            style: 'cancel',
            onPress: () => {
              void resumeRecording();
            },
          },
          {
            text: 'Stop',
            style: 'destructive',
            onPress: () => {
              void discardActiveRecording();
            },
          },
        ],
      );
      return;
    }

    const paused = await pauseIfRecording();
    if (!paused) return;

    Alert.alert(
      'Save recording?',
      'Your recording will be saved and processing will start.',
      [
        {
          text: 'Keep Recording',
          style: 'cancel',
          onPress: () => {
            void resumeRecording();
          },
        },
        {
          text: 'Save',
          onPress: () => {
            void executeStopAndSave();
          },
        },
      ],
    );
  };

  const hrs = Math.floor(elapsed / 3600);
  const min = Math.floor((elapsed % 3600) / 60);
  const sec = elapsed % 60;
  const hasAnyText = finalText.length > 0 || partialText.length > 0;
  const placeholder = showLivePreviewPanel ? 'Listening…' : 'Transcription after you stop.';

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
