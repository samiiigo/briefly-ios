/**
 * iOS Live Activity for active recording (lock screen + Dynamic Island).
 * Android uses expo-audio foreground notification instead.
 *
 * Requires a dev client built with `expo-live-activity` (not Expo Go).
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as LiveActivity from 'expo-live-activity';
import type { LiveActivityConfig, LiveActivityState } from 'expo-live-activity';
import { formatDuration } from '@/utils/formatting/formatting';
import { Colors } from '@/theme/constants';
import { logger } from '@/utils/logging/logger';

const LIVE_ACTIVITY_IMAGE = 'briefly_recording';

const RECORDING_ACTIVITY_CONFIG: LiveActivityConfig = {
  backgroundColor: Colors.card,
  titleColor: Colors.textPrimary,
  subtitleColor: Colors.textSecondary,
  progressViewTint: Colors.recordButton,
  progressViewLabelColor: Colors.textPrimary,
  deepLinkUrl: '/recording/new',
  timerType: 'digital',
  imagePosition: 'right',
  imageAlign: 'center',
  imageSize: { width: 28, height: 28 },
  contentFit: 'contain',
  padding: { horizontal: 16, vertical: 12 },
};

let activityId: string | undefined;
let recordingStartedAtMs = 0;
let loggedUnavailable = false;

function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function isSupported(): boolean {
  return Platform.OS === 'ios' && requireOptionalNativeModule('ExpoLiveActivity') != null;
}

function logUnavailableOnce(): void {
  if (loggedUnavailable) return;
  loggedUnavailable = true;

  if (Platform.OS !== 'ios') return;

  const reason = isExpoGo()
    ? 'Expo Go does not include the Live Activity native module.'
    : 'The Live Activity native module is missing from this build.';

  logger.warn('AUDIO', `${reason} Rebuild with: npx expo prebuild --clean && npx expo run:ios`);
}

function buildState(elapsedSeconds: number, paused: boolean): LiveActivityState {
  const title = paused ? 'Paused' : 'Recording';
  const subtitle = formatDuration(Math.max(0, elapsedSeconds));

  const state: LiveActivityState = {
    title,
    subtitle,
    imageName: LIVE_ACTIVITY_IMAGE,
    dynamicIslandImageName: LIVE_ACTIVITY_IMAGE,
  };

  if (!paused && recordingStartedAtMs > 0) {
    state.progressBar = { date: recordingStartedAtMs };
  }

  return state;
}

/** Shows the recording Live Activity on iOS (no-op elsewhere). */
export function startRecordingLiveActivity(): void {
  if (!isSupported()) {
    logUnavailableOnce();
    return;
  }

  stopRecordingLiveActivity();

  recordingStartedAtMs = Date.now();
  const state = buildState(0, false);

  try {
    const id = LiveActivity.startActivity(state, RECORDING_ACTIVITY_CONFIG);
    activityId = id ?? undefined;
    if (!activityId) {
      logger.warn('AUDIO', 'Live Activity could not be started (iOS 16.2+ required)');
    } else {
      logger.info('AUDIO', 'Recording Live Activity started', { activityId });
    }
  } catch (error) {
    logger.warn('AUDIO', 'Failed to start recording Live Activity', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Refreshes elapsed time and pause state on the Live Activity. */
export function updateRecordingLiveActivity(elapsedSeconds: number, paused: boolean): void {
  if (!isSupported() || !activityId) return;

  try {
    LiveActivity.updateActivity(activityId, buildState(elapsedSeconds, paused));
  } catch (error) {
    logger.warn('AUDIO', 'Failed to update recording Live Activity', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Ends the recording Live Activity. */
export function stopRecordingLiveActivity(elapsedSeconds = 0): void {
  if (!isSupported() || !activityId) {
    activityId = undefined;
    recordingStartedAtMs = 0;
    return;
  }

  const id = activityId;
  activityId = undefined;
  recordingStartedAtMs = 0;

  try {
    LiveActivity.stopActivity(id, {
      title: 'Recording stopped',
      subtitle: formatDuration(Math.max(0, elapsedSeconds)),
      imageName: LIVE_ACTIVITY_IMAGE,
    });
    logger.info('AUDIO', 'Recording Live Activity stopped');
  } catch (error) {
    logger.warn('AUDIO', 'Failed to stop recording Live Activity', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
