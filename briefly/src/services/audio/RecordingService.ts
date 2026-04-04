/**
 * RecordingService (SRP + ISP)
 *
 * Single responsibility: standard audio recording via expo-av.
 * Also owns permission requests and metering, since these are
 * intrinsically coupled to the recording lifecycle.
 */

import { Audio } from 'expo-av';
import { getInfoAsync } from 'expo-file-system/legacy';
import { AudioRecordingResult } from './types';
import { logger } from '../../utils/logger';

class RecordingServiceClass {
  private recording: Audio.Recording | null = null;
  private _recordingPaused = false;
  private startTime: number = 0;

  async requestPermissions(): Promise<boolean> {
    const { granted } = await Audio.requestPermissionsAsync();
    logger.info('AUDIO', 'Microphone permission request completed', { granted });
    return granted;
  }

  async start(): Promise<void> {
    logger.info('AUDIO', 'Starting local recording');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync({
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    });

    this.recording = recording;
    this._recordingPaused = false;
    this.startTime = Date.now();
    logger.info('AUDIO', 'Local recording started');
  }

  async pause(): Promise<void> {
    if (this.recording) {
      await this.recording.pauseAsync();
      this._recordingPaused = true;
      logger.info('AUDIO', 'Local recording paused');
    }
  }

  async resume(): Promise<void> {
    if (!this.recording) return;
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    await this.recording.startAsync();
    this._recordingPaused = false;
    logger.info('AUDIO', 'Local recording resumed');
  }

  async stop(): Promise<AudioRecordingResult> {
    if (!this.recording) {
      logger.error('AUDIO', 'Stop recording requested without active recording');
      throw new Error('No active recording');
    }

    let durationMillis = 0;
    try {
      const status = await this.recording.getStatusAsync();
      durationMillis = status.durationMillis ?? 0;
      if (status.isRecording) {
        await this.recording.pauseAsync();
      }
    } catch (error: any) {
      logger.error('AUDIO', 'Failed to flush recording before stop', {
        error: error?.message ?? String(error),
      });
    }

    await this.recording.stopAndUnloadAsync();
    const uri = this.recording.getURI()!;

    let fileSize = 0;
    try {
      const info = await getInfoAsync(uri);
      fileSize = info.exists ? ((info as any).size ?? 0) : 0;
    } catch (error: any) {
      logger.warn('AUDIO', 'Failed to read local recording file metadata', {
        error: error?.message ?? String(error),
      });
    }

    const duration = durationMillis / 1000;
    this.recording = null;
    this._recordingPaused = false;

    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    logger.info('AUDIO', 'Local recording stopped', { uri, durationSec: duration, fileSize });
    return { uri, duration, fileSize };
  }

  async getMetering(): Promise<number> {
    if (!this.recording) return 0;
    try {
      const status = await this.recording.getStatusAsync();
      if (!status.isRecording || status.metering === undefined) return 0;
      return Math.max(0, Math.min(1, (status.metering + 60) / 60));
    } catch {
      return 0;
    }
  }
}

export const RecordingService = new RecordingServiceClass();
