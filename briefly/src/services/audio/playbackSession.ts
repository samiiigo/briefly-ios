/**
 * Configures the global iOS/Android audio session for playback.
 * Retries on OSStatus !pri (561017449) when switching from recording.
 */

import { setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { logger } from '@/utils/logging/logger';

const PLAYBACK_MODE = {
  allowsRecording: false,
  playsInSilentMode: true,
  interruptionMode: 'doNotMix' as const,
};

const RETRY_DELAYS_MS = [0, 120, 300];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSessionPriorityError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('561017449') || message.includes('!pri');
}

export async function configurePlaybackAudioSession(): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    try {
      if (attempt > 0) {
        await delay(RETRY_DELAYS_MS[attempt]);
      }
      try {
        await setIsAudioActiveAsync(false);
      } catch {
        // Session may already be inactive.
      }
      await setAudioModeAsync(PLAYBACK_MODE);
      await setIsAudioActiveAsync(true);
      return;
    } catch (error) {
      lastError = error;
      if (!isSessionPriorityError(error)) {
        throw error;
      }
      logger.warn('AUDIO', 'Playback session busy, retrying', { attempt: attempt + 1 });
    }
  }
  throw lastError;
}

export async function configureRecordingStoppedAudioSession(): Promise<void> {
  try {
    await setAudioModeAsync(PLAYBACK_MODE);
  } catch (error) {
    logger.warn('AUDIO', 'Could not reset audio session after recording', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
