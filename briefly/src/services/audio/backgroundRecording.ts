/**
 * Background recording lifecycle (Android + iOS).
 *
 * Uses expo-audio `allowsBackgroundRecording` (requires `enableBackgroundRecording`
 * in the expo-audio config plugin). Android also starts a foreground service with
 * a persistent notification and Stop action.
 */
import { PermissionsAndroid, Platform } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';
import type { AudioRecorder, RecordingStatus } from 'expo-audio';
import type { EventSubscription } from 'expo-modules-core';
import { isAndroid } from '@/utils/platform';
import { logger } from '@/utils/logging/logger';
const BACKGROUND_RECORDING_MODE = {
  allowsRecording: true,
  playsInSilentMode: true,
  /** Prevents expo-audio from pausing recorders when the app backgrounds. */
  shouldPlayInBackground: true,
  interruptionMode: 'duckOthers' as const,
  allowsBackgroundRecording: true,
};
export type RecordingStoppedExternally = () => void;
let statusSubscription: EventSubscription | null = null;
let externalStopHandler: RecordingStoppedExternally | null = null;
let stopInitiatedFromApp = false;
/** Requests POST_NOTIFICATIONS on Android 13+ so the recording control can appear. */
export async function ensureAndroidRecordingNotificationPermission(): Promise<boolean> {
  if (!isAndroid) return true;
  if (Number(Platform.Version) < 33) return true;
  const current = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  if (current) return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    {
      title: 'Recording notification',
      message:
        'Briefly shows a persistent notification with a Stop button while you record in the background.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}
/** Configures the shared audio session for recording that may continue in the background. */
export async function configureBackgroundRecordingSession(): Promise<void> {
  await setAudioModeAsync(BACKGROUND_RECORDING_MODE);
  logger.info('AUDIO', 'Background recording session configured', { platform: Platform.OS });
}
/**
 * Subscribes to the recorder status stream so notification Stop triggers app logic (Android).
 * The native foreground service is provided by expo-audio when background recording is enabled.
 */
export function attachRecordingNotificationControls(recorder: AudioRecorder): void {
  if (!isAndroid) return;
  detachRecordingNotificationControls();
  statusSubscription = recorder.addListener(
    'recordingStatusUpdate',
    (status: RecordingStatus) => {
      if (!status.isFinished || status.hasError || stopInitiatedFromApp) return;
      logger.info('AUDIO', 'Recording stopped from Android notification');
      externalStopHandler?.();
    },
  );
}
export function detachRecordingNotificationControls(): void {
  statusSubscription?.remove();
  statusSubscription = null;
}
/** Screen-level handler when the user taps Stop on the recording notification (Android). */
export function registerRecordingStoppedHandler(handler: RecordingStoppedExternally | null): void {
  externalStopHandler = handler;
}
/** Marks in-app stop so we do not treat it as a notification stop. */
export function markRecordingStopFromApp(active: boolean): void {
  stopInitiatedFromApp = active;
}
/**
 * Called when the app moves to background during an active recording.
 * Re-applies the recording session and keeps capture running (no pause).
 */
export async function onRecordingEnteredBackground(): Promise<string> {
  try {
    await configureBackgroundRecordingSession();
    logger.info('AUDIO', 'Recording continuing in background');
    if (isAndroid) {
      return 'Recording continues in the background. Use the notification to stop.';
    }
    return 'Recording continues in the background. Check the Lock Screen or Dynamic Island.';
  } catch (error) {
    logger.warn('AUDIO', 'Failed to refresh background recording session', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 'Recording may stop if the app stays in the background.';
  }
}
/** Called when the app returns to the foreground during an active recording. */
export async function onRecordingReturnedForeground(): Promise<void> {
  try {
    await configureBackgroundRecordingSession();
  } catch (error) {
    logger.warn('AUDIO', 'Failed to refresh recording session on foreground', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
/** Recording continues in the background on both platforms. */
export function shouldPauseRecordingWhenAppBackgrounds(): boolean {
  return false;
}
