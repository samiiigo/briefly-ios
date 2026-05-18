/**
 * Cross-platform recording session orchestration.
 *
 * iOS: standard playAndRecord session via playbackSession.
 * Android: background-capable session + notification Stop (expo-audio foreground service).
 */

import type { AudioRecorder } from 'expo-audio';
import { isAndroid } from '@/utils/platform';
import {
  configureRecordingAudioSession,
  reapplyRecordingAudioMode,
} from './playbackSession';
import {
  attachAndroidRecordingNotificationControls,
  configureAndroidBackgroundRecordingSession,
  detachAndroidRecordingNotificationControls,
  ensureAndroidRecordingNotificationPermission,
  markAndroidRecordingStopFromApp,
} from './androidBackgroundRecording';

export {
  onAndroidRecordingEnteredBackground,
  onAndroidRecordingReturnedForeground,
  registerAndroidRecordingStoppedHandler,
  shouldPauseRecordingWhenAppBackgrounds,
} from './androidBackgroundRecording';

/** Microphone + (Android 13+) notification permission before starting capture. */
export async function ensureRecordingPrerequisites(): Promise<void> {
  if (isAndroid) {
    await ensureAndroidRecordingNotificationPermission();
  }
}

/** Prepares the shared audio session for an active recording. */
export async function configureActiveRecordingSession(): Promise<void> {
  await ensureRecordingPrerequisites();
  if (isAndroid) {
    await configureAndroidBackgroundRecordingSession();
  } else {
    await configureRecordingAudioSession();
  }
}

/** Re-applies session settings after pause/resume or returning from background. */
export async function reapplyActiveRecordingSession(): Promise<void> {
  if (isAndroid) {
    await configureAndroidBackgroundRecordingSession();
  } else {
    await reapplyRecordingAudioMode();
  }
}

/** Wires notification Stop → recorder status (Android only). */
export function attachActiveRecordingControls(recorder: AudioRecorder): void {
  attachAndroidRecordingNotificationControls(recorder);
}

export function detachActiveRecordingControls(): void {
  detachAndroidRecordingNotificationControls();
}

/**
 * Stops a recorder and tears down Android notification listeners.
 * Pass `alreadyStopped` when native status shows recording has ended.
 */
export async function finalizeActiveRecorderStop(
  recorder: AudioRecorder,
  alreadyStopped: boolean,
): Promise<void> {
  markAndroidRecordingStopFromApp(true);
  try {
    if (!alreadyStopped) {
      await recorder.stop();
    }
  } finally {
    markAndroidRecordingStopFromApp(false);
    detachAndroidRecordingNotificationControls();
  }
}
