/**
 * Configures the global iOS/Android audio session for playback and recording.
 * Retries on OSStatus !pri (561017449) when switching between modes.
 */

import { setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import type { AudioRecorder, RecordingOptions } from 'expo-audio';
import { logger } from '@/utils/logging/logger';

const PLAYBACK_MODE = {
  allowsRecording: false,
  playsInSilentMode: true,
  interruptionMode: 'doNotMix' as const,
};

const RECORDING_MODE = {
  allowsRecording: true,
  playsInSilentMode: true,
  interruptionMode: 'duckOthers' as const,
};

const PLAYBACK_RETRY_DELAYS_MS = [0, 120, 300];
/** expo-audio defers player session deactivation by 100ms after pause/stop. */
const PLAYBACK_RELEASE_SETTLE_MS = 150;
const RECORDING_PREP_RETRY_DELAYS_MS = [0, 150, 350, 600];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecoverableSessionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('561017449') ||
    message.includes('!pri') ||
    /session activation failed/i.test(message) ||
    /failed to configure audio session/i.test(message) ||
    /failed to change audio state/i.test(message)
  );
}

/** Release playback so recording can take over the shared AVAudioSession. */
export async function releasePlaybackAudioSession(): Promise<void> {
  try {
    await setIsAudioActiveAsync(false);
  } catch {
    // Session may already be inactive.
  }
  await delay(PLAYBACK_RELEASE_SETTLE_MS);
}

export async function configurePlaybackAudioSession(): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < PLAYBACK_RETRY_DELAYS_MS.length; attempt++) {
    try {
      if (attempt > 0) {
        await delay(PLAYBACK_RETRY_DELAYS_MS[attempt]);
      }
      await releasePlaybackAudioSession();
      await setAudioModeAsync(PLAYBACK_MODE);
      await setIsAudioActiveAsync(true);
      return;
    } catch (error) {
      lastError = error;
      if (!isRecoverableSessionError(error)) {
        throw error;
      }
      logger.warn('AUDIO', 'Playback session busy, retrying', { attempt: attempt + 1 });
    }
  }
  throw lastError;
}

/**
 * Switch to playAndRecord without calling `setIsAudioActiveAsync(true)`.
 * `prepareToRecordAsync` activates the session internally on iOS.
 */
export async function configureRecordingAudioSession(): Promise<void> {
  await releasePlaybackAudioSession();
  await setAudioModeAsync(RECORDING_MODE);
}

/** Re-apply recording category after pause without tearing down the session. */
export async function reapplyRecordingAudioMode(): Promise<void> {
  await setAudioModeAsync(RECORDING_MODE);
}

export async function prepareRecorderAsync(
  recorder: AudioRecorder,
  options?: RecordingOptions,
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < RECORDING_PREP_RETRY_DELAYS_MS.length; attempt++) {
    try {
      if (attempt > 0) {
        await delay(RECORDING_PREP_RETRY_DELAYS_MS[attempt]);
        await configureRecordingAudioSession();
      }
      await recorder.prepareToRecordAsync(options);
      return;
    } catch (error) {
      lastError = error;
      if (!isRecoverableSessionError(error)) {
        throw error;
      }
      logger.warn('AUDIO', 'Recorder prepare busy, retrying', { attempt: attempt + 1 });
    }
  }
  throw lastError;
}

export async function configureRecordingStoppedAudioSession(): Promise<void> {
  try {
    await releasePlaybackAudioSession();
    await setAudioModeAsync(PLAYBACK_MODE);
  } catch (error) {
    logger.warn('AUDIO', 'Could not reset audio session after recording', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
