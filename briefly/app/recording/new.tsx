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
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import { screenLayoutStyles as sl } from '@/components/navigation/screenLayout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RecordingService, LiveTranscriptionService } from '@/services/audio';
import { saveCapturedRecording } from '@/services/recording/saveCapturedRecording';
import { interceptOnDeviceSummarizationIfBlocked } from '@/utils/processing/localLlmSummarizationGate';
import { RecordingFolder } from '@/types';
import { WaveformVisualizer } from '@/components/features/recording/WaveformVisualizer';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import {
  normalizeTranscriptionMode,
  resolveRecordingTranscriptionPlan,
  requiresLiveOnDeviceCapture,
  showsLivePreviewDuringRecording,
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

export default function NewRecordingScreen() {
  const { scrollPaddingTop } = useTopChromeLayout();
  const router = useRouter();
  const params = useLocalSearchParams<{
    targetFolder?: string;
    targetUserFolderId?: string;
    markImported?: string;
  }>();
  const setLiveTranscript = useRecordingStore((s) => s.setLiveTranscript);
  const { transcriptionMode: settingsTranscriptionMode } = useSettingsStore();
  const { elapsed, elapsedRef, start: startTimer, stop: stopTimer } = useTimer();
  const live = useLiveTranscript(setLiveTranscript, elapsedRef);
  const { finalText, partialText, liveSegments, isStopped, onPartial, onFinal, flush, reset, cleanup } =
    live;
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [startFailed, setStartFailed] = useState(false);
  const [liveStreamVisible, setLiveStreamVisible] = useState(true);
  const [interruptHint, setInterruptHint] = useState<string | null>(null);
  const livePreviewScrollRef = useRef<ScrollView | null>(null);
  const isPausedRef = useRef(false);
  const startedWithLiveRef = useRef(false);
  const isMountedRef = useRef(true);

  const settingsMode = normalizeTranscriptionMode(settingsTranscriptionMode);
  const plan = resolveRecordingTranscriptionPlan(settingsMode, {
    canCloudLive: LiveTranscriptionService.isSupported,
    canOnDeviceLive: LiveTranscriptionService.isOnDeviceSupported,
  });
  const useLive = plan.useLiveCapture;
  const isLocalLive = plan.settingsMode === 'local-on-device' && useLive;
  const showLivePreviewPanel = showsLivePreviewDuringRecording(plan);
  const showLiveStream = showLivePreviewPanel && (!isLocalLive || liveStreamVisible);

  const getMetering = useCallback(() => {
    if (startedWithLiveRef.current) return LiveTranscriptionService.getMetering();
    return RecordingService.getMetering();
  }, []);

  const teardownCapture = useCallback(async () => {
    try {
      if (startedWithLiveRef.current) {
        await LiveTranscriptionService.stop();
      } else if (isStarted) {
        await RecordingService.stop();
      }
    } catch {
      // Best-effort cleanup
    }
  }, [isStarted]);

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
        if (requiresLiveOnDeviceCapture(plan) && !plan.useLiveCapture) {
          throw new Error(
            'On-device transcription is not available on this device. Choose another mode in Settings.',
          );
        }
        startedWithLiveRef.current = useLive;
        if (useLive && plan.liveEngine !== 'none') {
          await LiveTranscriptionService.start(plan.liveEngine, {
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
          });
        } else {
          await RecordingService.start();
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
      if (startedWithLiveRef.current) await LiveTranscriptionService.resume();
      else await RecordingService.resume();
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
      if (startedWithLiveRef.current) await LiveTranscriptionService.pause();
      else await RecordingService.pause();
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
      result = startedWithLiveRef.current
        ? await LiveTranscriptionService.stop()
        : await RecordingService.stop();
    } catch {
      try {
        await new Promise((r) => setTimeout(r, 300));
        result = await RecordingService.stop();
      } catch (e: unknown) {
        isStopped.current = false;
        setIsStopping(false);
        if (!isPausedRef.current) startTimer();
        const message = e instanceof Error ? e.message : 'Could not stop recording.';
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

    const preTranscript =
      liveSegments.current.length > 0 ? liveSegments.current : undefined;

    try {
      const { summarizationBlocked } = await saveCapturedRecording({
        duration: stoppedDurationSec,
        filePath,
        fileSize,
        targetFolder: (params.targetFolder as RecordingFolder) ?? 'unlisted',
        targetUserFolderId: params.targetUserFolderId,
        markImported: params.markImported === 'true',
        preTranscript,
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
  const placeholder = useLive ? 'Listening...' : 'Transcription after you stop.';

  return (
    <View style={sl.container}>
      <View style={[s.body, { paddingTop: scrollPaddingTop }]}>
        {interruptHint ? (
          <View style={s.hintBanner}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.orange} />
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
          <View style={[s.lpC, !showLiveStream && s.lpCCollapsed]}>
            <View style={s.lpH}>
              <Ionicons name="document-text" size={14} color={Colors.primary} />
              <Text style={s.lpLbl}>Live transcript</Text>
              {isLocalLive ? (
                <Pressable
                  style={({ pressed }) => [s.streamToggle, pressed && Platform.OS === 'ios' && { opacity: 0.7 }]}
                  onPress={() => setLiveStreamVisible((v) => !v)}
                  accessibilityLabel={
                    liveStreamVisible ? 'Hide live transcript' : 'Show live transcript'
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true, radius: 16 }}
                >
                  <Ionicons
                    name={liveStreamVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </Pressable>
              ) : null}
            </View>
            {showLiveStream ? (
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
            ) : (
              <Text style={s.lpHiddenHint}>
                Transcript hidden — still recording in the background.
              </Text>
            )}
          </View>
        ) : null}

        <View style={s.ctrls}>
          <View style={s.ctrlItem}>
            <Pressable
              style={({ pressed }) => [s.pauseBtn, pressed && Platform.OS === 'ios' && { opacity: 0.75 }]}
              onPress={handlePause}
              disabled={!isStarted || startFailed || isStopping}
              android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false, radius: 32 }}
            >
              <Ionicons name={isPaused ? 'play' : 'pause'} size={26} color={Colors.textPrimary} />
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
            <Text style={[s.ctrlLbl, { color: Colors.recordButton }]}>
              {isStopping ? 'STOPPING…' : 'STOP'}
            </Text>
          </View>
        </View>
      </View>

      <StackScreenHeader title="New Recording" showBack onBack={handleBack} />
    </View>
  );
}

const s = StyleSheet.create({
  body: { flex: 1 },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,159,10,0.12)',
    borderRadius: BorderRadius.md,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: Colors.orange,
    lineHeight: 18,
  },
  recInd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  dotP: { backgroundColor: Colors.orange },
  recTxt: { fontSize: 12, color: Colors.green, fontWeight: '500' },
  pTxt: { color: Colors.orange },
  timerC: { alignItems: 'center', paddingVertical: Spacing.lg },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  tBlk: { alignItems: 'center', minWidth: 60 },
  tDig: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  tLbl: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginTop: 2,
  },
  tSep: {
    fontSize: 40,
    fontWeight: '300',
    color: Colors.textSecondary,
    paddingBottom: 8,
    marginHorizontal: 4,
  },
  wfC: { alignItems: 'center', paddingVertical: Spacing.lg },
  lpC: {
    flex: 1,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.cardXL,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  lpCCollapsed: { flex: 0 },
  lpH: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  lpLbl: { fontSize: 13, fontWeight: '600', color: Colors.primary, flex: 1 },
  streamToggle: { padding: 4, marginLeft: 4 },
  lpScroll: { flex: 1 },
  lpHiddenHint: {
    fontSize: 14,
    color: Colors.textTertiary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  segBlk: { flexDirection: 'row', paddingVertical: 5, gap: 8 },
  segTs: {
    width: 38,
    fontSize: 12,
    color: Colors.textTertiary,
    paddingTop: 3,
    fontVariant: ['tabular-nums'],
  },
  segTxt: { flex: 1, fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  partTxt: { color: Colors.textSecondary, fontStyle: 'italic' },
  lpPh: { fontSize: 15, color: Colors.textTertiary, lineHeight: 22, fontStyle: 'italic' },
  ctrls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xxl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  ctrlItem: { alignItems: 'center', gap: Spacing.xs },
  pauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.recordButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSq: { width: 22, height: 22, borderRadius: 4, backgroundColor: '#fff' },
  ctrlLbl: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 1 },
});
