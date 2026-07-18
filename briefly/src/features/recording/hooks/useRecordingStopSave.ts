import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getProcessingSettingsReader } from '@/features/settings/services/processingSettingsReaderRegistry';
import { saveCapturedRecording } from '@/features/recording/services/saveCapturedRecording';
import { interceptOnDeviceSummarizationIfBlocked } from '@/features/processing/utils/localLlmSummarizationGate';
import {
  isRecordingTooShort,
  minRecordingDurationHint,
  STOP_EARLY_CONFIRM_THRESHOLD_SEC,
} from '@/features/recording/utils/recordingValidation';
import { openAppSettings } from '@/features/recording/utils/recordingPermissions';
import type { RecordingCapturePort } from '@/features/recording/services/audio/recordingCapturePort';
import type { RecordingFolder } from '@/shared/types';
import { toMessage } from '@/shared/utils/toMessage';

export interface NewRecordingSaveParams {
  targetFolder?: RecordingFolder;
  targetUserFolderId?: string;
  markImported?: boolean;
}

export interface UseRecordingStopSaveParams {
  capture: RecordingCapturePort;
  saveParams: NewRecordingSaveParams;
  elapsed: number;
  elapsedRef: React.MutableRefObject<number>;
  isStopped: React.MutableRefObject<boolean>;
  isPausedRef: React.MutableRefObject<boolean>;
  isStarted: boolean;
  startFailed: boolean;
  stopTimer: () => void;
  startTimer: () => void;
  cleanup: () => void;
  flush: () => void;
  stopPreview: () => void;
  teardownCapture: () => Promise<void>;
  pauseIfRecording: () => Promise<boolean>;
  resumeRecording: () => Promise<void>;
}

export function useRecordingStopSave({
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
}: UseRecordingStopSaveParams) {
  const router = useRouter();
  const [isStopping, setIsStopping] = useState(false);
  const executeStopAndSaveRef = useRef<() => Promise<void>>(async () => {});

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
        Alert.alert('Error', toMessage(retryErr, 'Could not stop recording.'));
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
    isPausedRef,
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

  const handleStop = useCallback(async () => {
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
  }, [
    discardActiveRecording,
    elapsed,
    elapsedRef,
    executeStopAndSave,
    isStopped,
    isStopping,
    pauseIfRecording,
    resumeRecording,
    startFailed,
  ]);

  return {
    isStopping,
    handleStop,
    handleDiscard,
    executeStopAndSave,
    executeStopAndSaveRef,
    discardActiveRecording,
  };
}
