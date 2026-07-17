import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import { useProcessingSettingsSlice } from '@/features/settings/hooks/settingsStoreSlices';
import {
  normalizeTranscriptionMode,
  resolveDecorativePreviewEngine,
  canRunDecorativeLivePreview,
} from '@/features/processing/utils/transcriptionMode';
import { useTimer } from '@/shared/hooks/common/useTimer';
import { useLiveTranscript } from '@/features/recording/hooks/useLiveTranscript';
import { useAppInterruptGuard } from '@/shared/hooks/common/useAppInterruptGuard';
import { useDecorativeLivePreviewController } from '@/features/recording/hooks/useDecorativeLivePreviewController';
import { useRecordingStopSave, type NewRecordingSaveParams } from '@/features/recording/hooks/useRecordingStopSave';
import {
  onRecordingEnteredBackground,
  onRecordingReturnedForeground,
  registerRecordingStoppedHandler,
} from '@/features/recording/services/audio/recordingSession';
import { updateRecordingLiveActivity } from '@/features/recording/services/audio/recordingLiveActivity';
import { LiveTranscriptionService } from '@/features/recording/services/audio';
import {
  defaultRecordingCapturePort,
  type RecordingCapturePort,
} from '@/features/recording/services/audio/recordingCapturePort';
import { openAppSettings } from '@/features/recording/utils/recordingPermissions';
import { isAndroid } from '@/shared/utils/platform';
import { toMessage } from '@/shared/utils/toMessage';

function isPermissionError(message: string): boolean {
  return /microphone|permission|speech recognition/i.test(message);
}

export type { NewRecordingSaveParams };

export interface UseNewRecordingSessionOptions {
  saveParams?: NewRecordingSaveParams;
  recordingCapture?: RecordingCapturePort;
}

/**
 * Orchestrates a new recording session.
 * Stop/save/discard flows live in {@link useRecordingStopSave}.
 * Capture bootstrap, interrupt handling, and live-activity ticking stay here.
 */
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
      Alert.alert('Error', toMessage(err, 'Could not resume recording.'));
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
      Alert.alert('Error', toMessage(err, 'Could not pause recording.'));
    }
  }, [capture, elapsedRef, isStarted, isStopped, pausePreview, startFailed, stopTimer]);

  const pauseIfRecording = useCallback(async (): Promise<boolean> => {
    if (!isStarted || startFailed || isPausedRef.current) return true;
    await pauseRecording();
    return isPausedRef.current;
  }, [isStarted, pauseRecording, startFailed]);

  const {
    isStopping,
    handleStop,
    handleDiscard,
    executeStopAndSaveRef,
  } = useRecordingStopSave({
    capture,
    saveParams,
    elapsed,
    elapsedRef,
    isStopped,
    isPausedRef,
    isStarted,
    startFailed,
    stopTimer,
    startTimer,
    cleanup,
    flush,
    stopPreview,
    teardownCapture,
    pauseIfRecording,
    resumeRecording,
  });

  useEffect(() => {
    if (!isAndroid) return;
    registerRecordingStoppedHandler(() => {
      void executeStopAndSaveRef.current();
    });
    return () => registerRecordingStoppedHandler(null);
  }, [executeStopAndSaveRef]);

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
        const message = toMessage(err, 'Could not start recording.');
        if (isPermissionError(message)) {
          Alert.alert('Microphone access needed', message, [
            { text: 'Cancel', style: 'cancel', onPress: () => router.replace('/(tabs)') },
            { text: 'Open Settings', onPress: () => openAppSettings() },
          ]);
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

  const handlePause = async () => {
    if (isPausedRef.current) await resumeRecording();
    else await pauseRecording();
  };

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
