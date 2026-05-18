/**
 * Android-only background recording lifecycle.
 *
 * Uses expo-audio `allowsBackgroundRecording` (requires `enableBackgroundRecording`
 * in the expo-audio config plugin), which starts a foreground service with a
 * persistent notification and Stop action. iOS continues to pause on background
 * via the recording screen interrupt guard.
 */

import { PermissionsAndroid, Platform } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';
import type { AudioRecorder, RecordingStatus } from 'expo-audio';
import type { EventSubscription } from 'expo-modules-core';
import { isAndroid } from '@/utils/platform';
import { logger } from '@/utils/logging/logger';

const ANDROID_BACKGROUND_RECORDING_MODE = {
  allowsRecording: true,
  playsInSilentMode: true,
  /** Prevents expo-audio from pausing recorders in OnActivityEntersBackground. */
  shouldPlayInBackground: true,
  interruptionMode: 'duckOthers' as const,
  allowsBackgroundRecording: true,
};

export type AndroidRecordingStoppedExternally = () => void;

let statusSubscription: EventSubscription | null = null;
let externalStopHandler: AndroidRecordingStoppedExternally | null = null;
let stopInitiatedFromApp = false;

/** True when this device should use the Android background recording path. */
export function supportsAndroidBackgroundRecording(): boolean {
  return isAndroid;
}

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
export async function configureAndroidBackgroundRecordingSession(): Promise<void> {
  if (!isAndroid) return;

  await ensureAndroidRecordingNotificationPermission();
  await setAudioModeAsync(ANDROID_BACKGROUND_RECORDING_MODE);
  logger.info('AUDIO', 'Android background recording session configured');
}

/**
 * Subscribes to the recorder status stream so notification Stop triggers app logic.
 * The native foreground service is provided by expo-audio when background recording is enabled.
 */
export function attachAndroidRecordingNotificationControls(recorder: AudioRecorder): void {
  if (!isAndroid) return;

  detachAndroidRecordingNotificationControls();

  statusSubscription = recorder.addListener(
    'recordingStatusUpdate',
    (status: RecordingStatus) => {
      if (!status.isFinished || status.hasError || stopInitiatedFromApp) return;
      logger.info('AUDIO', 'Recording stopped from Android notification');
      externalStopHandler?.();
    },
  );
}

export function detachAndroidRecordingNotificationControls(): void {
  statusSubscription?.remove();
  statusSubscription = null;
}

/** Screen-level handler when the user taps Stop on the recording notification. */
export function registerAndroidRecordingStoppedHandler(
  handler: AndroidRecordingStoppedExternally | null,
): void {
  externalStopHandler = handler;
}

/** Marks in-app stop so we do not treat it as a notification stop. */
export function markAndroidRecordingStopFromApp(active: boolean): void {
  stopInitiatedFromApp = active;
}

/**
 * Called when the app moves to background during an active recording.
 * Re-applies the recording session and keeps capture running (no pause).
 */
export async function onAndroidRecordingEnteredBackground(): Promise<string> {
  if (!isAndroid) {
    return '';
  }

  try {
    await configureAndroidBackgroundRecordingSession();
    logger.info('AUDIO', 'Android recording continuing in background');
    return 'Recording continues in the background. Use the notification to stop.';
  } catch (error) {
    logger.warn('AUDIO', 'Failed to refresh Android background recording session', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 'Recording may stop if the app stays in the background.';
  }
}

/** Called when the app returns to the foreground during an active recording. */
export async function onAndroidRecordingReturnedForeground(): Promise<void> {
  if (!isAndroid) return;

  try {
    await configureAndroidBackgroundRecordingSession();
  } catch (error) {
    logger.warn('AUDIO', 'Failed to refresh Android recording session on foreground', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** iOS pauses on background; Android keeps recording with a foreground service. */
export function shouldPauseRecordingWhenAppBackgrounds(): boolean {
  return !isAndroid;
}
