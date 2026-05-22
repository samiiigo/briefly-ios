import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecordingStore } from '@/context/useRecordingStore';
import { getProcessingSettingsReader } from '@/services/settings/processingSettingsReaderRegistry';
import { useProcessingSettingsSlice } from '@/hooks/settings/settingsStoreSlices';
import { saveCapturedRecording } from '@/services/recording/saveCapturedRecording';
import { interceptOnDeviceSummarizationIfBlocked } from '@/utils/processing/localLlmSummarizationGate';
import {
  normalizeTranscriptionMode,
  resolveDecorativePreviewEngine,
  canRunDecorativeLivePreview,
} from '@/utils/processing/transcriptionMode';
import {
  isRecordingTooShort,
  minRecordingDurationHint,
  STOP_EARLY_CONFIRM_THRESHOLD_SEC,
} from '@/utils/recording/recordingValidation';
import { openAppSettings } from '@/utils/recording/recordingPermissions';
import { useTimer } from '@/hooks/common/useTimer';
import { useLiveTranscript } from '@/hooks/recording/useLiveTranscript';
import { useAppInterruptGuard } from '@/hooks/common/useAppInterruptGuard';
import { useDecorativeLivePreviewController } from '@/hooks/recording/useDecorativeLivePreviewController';
import {
  onRecordingEnteredBackground,
  onRecordingReturnedForeground,
  registerRecordingStoppedHandler,
} from '@/services/audio/recordingSession';
import { updateRecordingLiveActivity } from '@/services/audio/recordingLiveActivity';
import { LiveTranscriptionService } from '@/services/audio';
import {
  defaultRecordingCapturePort,
  type RecordingCapturePort,
} from '@/services/audio/recordingCapturePort';
import { isAndroid } from '@/utils/platform';
import type { RecordingFolder } from '@/types';
function isPermissionError(message: string): boolean {
  return /microphone|permission|speech recognition/i.test(message);
}
export interface NewRecordingSaveParams {
  targetFolder?: RecordingFolder;
  targetUserFolderId?: string;
  markImported?: boolean;
}
export interface UseNewRecordingSessionOptions {
  saveParams?: NewRecordingSaveParams;
  recordingCapture?: RecordingCapturePort;
}
export function useNewRecordingSession(options: UseNewRecordingSessionOptions = {}) {
  const router = useRouter();
  const capture = options.recordingCapture ?? defaultRecordingCapturePort;
  const saveParams = options.saveParams ?? {};
  const setLiveTranscript = useRecordingStore((s) => s.setLiveTranscript);
  const { transcriptionMode: settingsTranscriptionMode, showLivePreview } =
    useProcessingSettingsSlice();
  const { elapsed, elapsedRef, start: startTimer, stop: stopTimer } = useTimer();
  const live = useLiveTranscript(setLiveTranscript, elapsedRef);
  const { finalText, partialText, liveSegments, isStopped, onPartial, onFinal, flush, reset, cleanup } =
    live;
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [startFailed, setStartFailed] = useState(false);
  const [interruptHint, setInterruptHint] = useState<string | null>(null);
  const isPausedRef = useRef(false);
  const isMountedRef = useRef(true);
  const settingsMode = normalizeTranscriptionMode(settingsTranscriptionMode);
  const previewEngine = resolveDecorativePreviewEngine(settingsMode, {
    canCloudLive: LiveTranscriptionService.isSupported,
    canOnDeviceLive: LiveTranscriptionService.isOnDeviceSupported,
  });
  const showLivePreviewPanel = canRunDecorativeLivePreview(showLivePreview, previewEngine);
  const handlePreviewError = useCallback(
    (msg: string) => {
      if (liveSegments.current.length === 0) {
        setLiveTranscript('Reconnecting…');
      }
      if (/permission|denied|not authorized/i.test(msg)) {
        setInterruptHint('Speech recognition may be unavailable. Check Settings.');
      }
    },
    [liveSegments, setLiveTranscript],
  );
  const { stopPreview, startPreview, pausePreview, resumePreview } =
    useDecorativeLivePreviewController({
      enabled: showLivePreviewPanel,
      engine: previewEngine,
      callbacks: { onPartial, onFinal, onConnectionState: () => {} },
      onPreviewError: handlePreviewError,
      getActiveRecordingUri: () => capture.getActiveRecordingUri(),
    });
  const getMetering = useCallback(() => capture.getMetering(), [capture]);
  const teardownCapture = useCallback(async () => {
    try {
      stopPreview();
      if (isStarted) {
        await capture.stop();
      }
    } catch {
      // Best-effort cleanup
    }
  }, [capture, isStarted, stopPreview]);
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
  }, [isStarted, startFailed, isPaused, elapsed, elapsedRef, isStopped]);
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
    void (async () => {
      try {
        await capture.start();
        if (showLivePreviewPanel) {
          await new Promise((r) => setTimeout(r, 300));
          try {
            await startPreview();
          } catch {
            // Decorative preview is optional
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
    // Mount-only bootstrap
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const resumeRecording = useCallback(async () => {
    if (!isStarted || startFailed || isStopped.current || !isPausedRef.current) return;
    try {
      await resumePreview();
      await capture.resume();
      startTimer();
      setIsPaused(false);
      isPausedRef.current = false;
      updateRecordingLiveActivity(elapsedRef.current, false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not resume recording.';
      Alert.alert('Error', message);
    }
  }, [capture, elapsedRef, isStarted, isStopped, resumePreview, startFailed, startTimer]);
  const pauseRecording = useCallback(async () => {
    if (!isStarted || startFailed || isStopped.current || isPausedRef.current) return;
    try {
      pausePreview();
      await capture.pause();
      stopTimer();
      setIsPaused(true);
      isPausedRef.current = true;
      updateRecordingLiveActivity(elapsedRef.current, true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not pause recording.';
      Alert.alert('Error', message);
    }
  }, [capture, elapsedRef, isStarted, isStopped, pausePreview, startFailed, stopTimer]);
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
  }, [cleanup, isStarted, router, startFailed, stopTimer, teardownCapture, isStopped]);
  const handleBack = useCallback(() => {
    if (isStarted && !isStopped.current && !startFailed) {
      handleDiscard();
      return;
    }
    router.replace('/(tabs)');
  }, [handleDiscard, isStarted, router, startFailed, isStopped]);
  useEffect(() => {
    const onBackPress = () => {
      if (isStarted && !isStopped.current && !startFailed) {
        handleDiscard();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [handleDiscard, isStarted, startFailed, isStopped]);
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
  }, [cleanup, isStopped, router, stopTimer, teardownCapture]);
  const executeStopAndSave = useCallback(async () => {
    if (isStopped.current || isStopping || startFailed) return;
    setIsStopping(true);
    isStopped.current = true;
    stopTimer();
    cleanup();
    let result;
    try {
      stopPreview();
      result = await capture.stop();
    } catch {
      try {
        await new Promise((r) => setTimeout(r, 300));
        result = await capture.stop();
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
        targetFolder: saveParams.targetFolder ?? 'unlisted',
        targetUserFolderId: saveParams.targetUserFolderId,
        markImported: saveParams.markImported,
      });
      if (summarizationBlocked) {
        interceptOnDeviceSummarizationIfBlocked(
          getProcessingSettingsReader().getSummarizationMode(),
        );
      }
      router.replace('/(tabs)');
    } catch {
      isStopped.current = false;
      setIsStopping(false);
      Alert.alert('Could not save', 'Something went wrong while saving. Please try again.');
    }
  }, [
    capture,
    cleanup,
    elapsed,
    flush,
    isStopped,
    isStopping,
    router,
    saveParams.markImported,
    saveParams.targetFolder,
    saveParams.targetUserFolderId,
    startFailed,
    startTimer,
    stopPreview,
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
          { text: 'Resume', style: 'cancel', onPress: () => void resumeRecording() },
          { text: 'Stop', style: 'destructive', onPress: () => void discardActiveRecording() },
        ],
      );
      return;
    }
    const paused = await pauseIfRecording();
    if (!paused) return;
    Alert.alert('Save recording?', 'Your recording will be saved and processing will start.', [
      { text: 'Keep Recording', style: 'cancel', onPress: () => void resumeRecording() },
      { text: 'Save', onPress: () => void executeStopAndSave() },
    ]);
  };
  const hrs = Math.floor(elapsed / 3600);
  const min = Math.floor((elapsed % 3600) / 60);
  const sec = elapsed % 60;
  const hasAnyText = finalText.length > 0 || partialText.length > 0;
  const placeholder = showLivePreviewPanel ? 'Listening…' : 'Transcription after you stop.';
  return {
    elapsed,
    hrs,
    min,
    sec,
    isPaused,
    isStarted,
    isStopping,
    startFailed,
    interruptHint,
    showLivePreviewPanel,
    finalText,
    partialText,
    liveSegments,
    hasAnyText,
    placeholder,
    getMetering,
    handlePause,
    handleStop,
    handleBack,
    handleDiscard,
  };
}
