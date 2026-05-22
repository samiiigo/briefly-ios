/**
 * RecordingService
 *
 * Also owns permission requests and metering, since these are
 * intrinsically coupled to the recording lifecycle.
 */
import { AudioModule, requestRecordingPermissionsAsync } from 'expo-audio';
import type { AudioRecorder, RecordingOptions } from 'expo-audio';
import { getPathInfo } from '@/utils/fileSystem/pathInfo';
import { AudioRecordingResult } from './types';
import { assemblyAIRecordingOptions } from './recordingOptions';
import { normalizeDbMetering } from './audioMetering';
import { logger } from '@/utils/logging/logger';
import { ensureMicrophonePermission } from '@/utils/recording/recordingPermissions';
import { PlaybackService } from './playbackService';
import {
  attachActiveRecordingControls,
  configureActiveRecordingSession,
  finalizeActiveRecorderStop,
  reapplyActiveRecordingSession,
} from './recordingSession';
import {
  configureRecordingStoppedAudioSession,
  prepareRecorderAsync,
} from './playbackSession';
import {
  startRecordingLiveActivity,
  stopRecordingLiveActivity,
} from './recordingLiveActivity';
class RecordingServiceClass {
  private recorder: AudioRecorder | null = null;
  private _recordingPaused = false;
  private startTime: number = 0;
  private async buildResultFromRecorder(
    recorder: AudioRecorder,
    fallbackDurationSec: number,
  ): Promise<AudioRecordingResult> {
    let durationMillis = Math.round(fallbackDurationSec * 1000);
    let uri = recorder.uri || '';
    try {
      const status = recorder.getStatus();
      if (status.durationMillis > 0) {
        durationMillis = status.durationMillis;
      }
      if (status.url) {
        uri = status.url;
      }
    } catch (error: unknown) {
      logger.warn('AUDIO', 'Failed to read recorder status after stop', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    let fileSize = 0;
    if (uri) {
      try {
        const info = getPathInfo(uri);
        fileSize = info.exists ? info.size : 0;
      } catch (error: unknown) {
        logger.warn('AUDIO', 'Failed to read local recording file metadata', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const duration = durationMillis / 1000;
    return { uri, duration, fileSize };
  }
  async requestPermissions(): Promise<boolean> {
    const { granted } = await requestRecordingPermissionsAsync();
    logger.info('AUDIO', 'Microphone permission request completed', { granted });
    return granted;
  }
  async start(): Promise<void> {
    // Clean up any leftover recorder
    if (this.recorder) {
      logger.warn('AUDIO', 'Cleaning up previous recorder before starting new one');
      try {
        await this.recorder.stop();
      } catch {
        // Ignore
      }
      this.recorder = null;
    }
    logger.info('AUDIO', 'Starting local recording');
    await ensureMicrophonePermission();
    await PlaybackService.stop();
    await configureActiveRecordingSession();
    const AudioRecorderCtor = (AudioModule as any)['AudioRecorder'] as new (
      options: Partial<RecordingOptions>
    ) => AudioRecorder;
    const recorder = new AudioRecorderCtor(assemblyAIRecordingOptions);
    await prepareRecorderAsync(recorder);
    recorder.record();
    this.recorder = recorder;
    this._recordingPaused = false;
    this.startTime = Date.now();
    attachActiveRecordingControls(recorder);
    startRecordingLiveActivity();
    logger.info('AUDIO', 'Local recording started');
  }
  async pause(): Promise<void> {
    if (this.recorder) {
      this.recorder.pause();
      this._recordingPaused = true;
      logger.info('AUDIO', 'Local recording paused');
    }
  }
  async resume(): Promise<void> {
    if (!this.recorder) return;
    await reapplyActiveRecordingSession();
    this.recorder.record();
    this._recordingPaused = false;
    logger.info('AUDIO', 'Local recording resumed');
  }
  async stop(): Promise<AudioRecordingResult> {
    if (!this.recorder) {
      logger.warn('AUDIO', 'Stop called without active recorder, returning empty result');
      stopRecordingLiveActivity();
      return { uri: '', duration: 0, fileSize: 0 };
    }
    const recorder = this.recorder;
    const fallbackDurationSec = (Date.now() - this.startTime) / 1000;
    let alreadyStopped = false;
    try {
      const status = recorder.getStatus();
      alreadyStopped = !status.isRecording && !status.canRecord;
    } catch {
      // Proceed with native stop.
    }
    try {
      await finalizeActiveRecorderStop(recorder, alreadyStopped);
    } catch (error: unknown) {
      logger.error('AUDIO', 'Failed to stop recorder', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    const result = await this.buildResultFromRecorder(recorder, fallbackDurationSec);
    this.recorder = null;
    this._recordingPaused = false;
    stopRecordingLiveActivity(result.duration);
    await configureRecordingStoppedAudioSession();
    logger.info('AUDIO', 'Local recording stopped', {
      uri: result.uri,
      durationSec: result.duration,
      fileSize: result.fileSize,
    });
    return result;
  }
  /** URI of the in-progress WAV while recording (for decorative live preview polling). */
  getActiveRecordingUri(): string | undefined {
    if (!this.recorder) return undefined;
    try {
      const status = this.recorder.getStatus();
      if (status.url) return status.url;
    } catch {
      // fall through
    }
    return this.recorder.uri ?? undefined;
  }
  getMetering(): number {
    if (!this.recorder || this._recordingPaused) return 0;
    try {
      const status = this.recorder.getStatus();
      if (!status.isRecording || status.metering === undefined) return 0;
      return normalizeDbMetering(status.metering);
    } catch {
      return 0;
    }
  }
}
export const RecordingService = new RecordingServiceClass();
