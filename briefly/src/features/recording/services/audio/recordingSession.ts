/**
 * Cross-platform recording session helpers.
 *
 * Android: background-capable session + notification Stop (expo-audio foreground service).
 * iOS: background-capable session, Live Activity on lock screen / Dynamic Island.
 */
import type { AudioRecorder } from 'expo-audio';
import {
  attachRecordingNotificationControls,
  configureBackgroundRecordingSession,
  detachRecordingNotificationControls,
  ensureAndroidRecordingNotificationPermission,
  markRecordingStopFromApp,
} from './backgroundRecording';
export {
  onRecordingEnteredBackground,
  onRecordingReturnedForeground,
  registerRecordingStoppedHandler,
  shouldPauseRecordingWhenAppBackgrounds,
} from './backgroundRecording';
/** Microphone + (Android 13+) notification permission before starting capture. */
export async function ensureRecordingPrerequisites(): Promise<void> {
  await ensureAndroidRecordingNotificationPermission();
}
/** Prepares the shared audio session for an active recording. */
export async function configureActiveRecordingSession(): Promise<void> {
  await ensureRecordingPrerequisites();
  await configureBackgroundRecordingSession();
}
/** Re-applies session settings after pause/resume or returning from background. */
export async function reapplyActiveRecordingSession(): Promise<void> {
  await configureBackgroundRecordingSession();
}
/** Wires notification Stop → recorder status (Android only). */
export function attachActiveRecordingControls(recorder: AudioRecorder): void {
  attachRecordingNotificationControls(recorder);
}
export function detachActiveRecordingControls(): void {
  detachRecordingNotificationControls();
}
/**
 * Stops a recorder and tears down Android notification listeners.
 * Pass `alreadyStopped` when native status shows recording has ended.
 */
export async function finalizeActiveRecorderStop(
  recorder: AudioRecorder,
  alreadyStopped: boolean,
): Promise<void> {
  markRecordingStopFromApp(true);
  try {
    if (!alreadyStopped) {
      await recorder.stop();
    }
  } finally {
    markRecordingStopFromApp(false);
    detachRecordingNotificationControls();
  }
}
