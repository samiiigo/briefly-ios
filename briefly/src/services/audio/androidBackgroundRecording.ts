/**
 * Android-only background recording lifecycle.
 *
 * Uses expo-audio `allowsBackgroundRecording` (requires `enableBackgroundRecording`
 * in the expo-audio config plugin). iOS continues to pause on background via the
 * recording screen interrupt guard.
 */

import { setAudioModeAsync } from 'expo-audio';
import { isAndroid } from '@/utils/platform';
import { logger } from '@/utils/logging/logger';

const ANDROID_BACKGROUND_RECORDING_MODE = {
  allowsRecording: true,
  playsInSilentMode: true,
  interruptionMode: 'duckOthers' as const,
  allowsBackgroundRecording: true,
};

/** True when this device should use the Android background recording path. */
export function supportsAndroidBackgroundRecording(): boolean {
  return isAndroid;
}

/** Configures the shared audio session for recording that may continue in the background. */
export async function configureAndroidBackgroundRecordingSession(): Promise<void> {
  if (!isAndroid) return;

  await setAudioModeAsync(ANDROID_BACKGROUND_RECORDING_MODE);
  logger.info('AUDIO', 'Android background recording session configured');
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
    return 'Recording continues in the background.';
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
