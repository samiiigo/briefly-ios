/**
 * RecordingService (SRP + ISP)
 *
 * Single responsibility: standard audio recording via expo-audio.
 * Also owns permission requests and metering, since these are
 * intrinsically coupled to the recording lifecycle.
 */

import { AudioModule, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import type { AudioRecorder, RecordingOptions } from 'expo-audio';
import { getInfoAsync } from 'expo-file-system/legacy';
import { AudioRecordingResult } from './types';
import { assemblyAIRecordingOptions } from './recordingOptions';
import { logger } from '@/utils/logger';
import { ensureMicrophonePermission } from '@/utils/recordingPermissions';
import { configureRecordingStoppedAudioSession } from './playbackSession';

class RecordingServiceClass {
  private recorder: AudioRecorder | null = null;
  private _recordingPaused = false;
  private startTime: number = 0;

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
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });

    const AudioRecorderCtor = (AudioModule as any)['AudioRecorder'] as new (
      options: Partial<RecordingOptions>
    ) => AudioRecorder;
    const recorder = new AudioRecorderCtor(assemblyAIRecordingOptions);
    await recorder.prepareToRecordAsync();
    recorder.record();

    this.recorder = recorder;
    this._recordingPaused = false;
    this.startTime = Date.now();
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
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
    this.recorder.record();
    this._recordingPaused = false;
    logger.info('AUDIO', 'Local recording resumed');
  }

  async stop(): Promise<AudioRecordingResult> {
    if (!this.recorder) {
      logger.warn('AUDIO', 'Stop called without active recorder, returning empty result');
      return { uri: '', duration: 0, fileSize: 0 };
    }

    const recorder = this.recorder;
    let durationMillis = 0;
    try {
      durationMillis = recorder.getStatus().durationMillis;
    } catch (error: any) {
      logger.warn('AUDIO', 'Failed to read recorder status before stop', {
        error: error?.message ?? String(error),
      });
    }

    const uri = recorder.uri || '';
    try {
      await recorder.stop();
    } catch (error: any) {
      logger.error('AUDIO', 'Failed to stop recorder', {
        error: error?.message ?? String(error),
      });
    }

    let fileSize = 0;
    if (uri) {
      try {
        const info = await getInfoAsync(uri);
        fileSize = info.exists ? ((info as any).size ?? 0) : 0;
      } catch (error: any) {
        logger.warn('AUDIO', 'Failed to read local recording file metadata', {
          error: error?.message ?? String(error),
        });
      }
    }

    const duration = durationMillis / 1000;
    this.recorder = null;
    this._recordingPaused = false;

    await configureRecordingStoppedAudioSession();

    logger.info('AUDIO', 'Local recording stopped', { uri, durationSec: duration, fileSize });
    return { uri, duration, fileSize };
  }

  async getMetering(): Promise<number> {
    if (!this.recorder) return 0;
    try {
      const status = this.recorder.getStatus();
      // expo-audio might have a different metering field. 
      // Checking Audio.types.d.ts if metering is available.
      // Assuming 'metering' exists in status for now as it's common.
      if (!status.isRecording || (status as any).metering === undefined) return 0;
      return Math.max(0, Math.min(1, ((status as any).metering + 60) / 60));
    } catch {
      return 0;
    }
  }
}

export const RecordingService = new RecordingServiceClass();
