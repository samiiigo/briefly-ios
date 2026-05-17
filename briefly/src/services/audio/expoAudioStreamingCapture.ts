/**
 * ExpoAudioStreamingCapture
 *
 * Expo Go compatible audio capture for live streaming.
 * Records to a LINEAR PCM .wav file using expo-audio, then polls the
 * growing file every 250 ms, extracting new bytes and emitting them as
 * raw PCM ArrayBuffers suitable for the AssemblyAI v3 WebSocket.
 *
 * Works in Expo Go (no native module required). The slight latency from
 * file polling (~250–500 ms) is acceptable for speech transcription.
 */

import {
  AudioModule,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import type { AudioRecorder, RecordingOptions } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { assemblyAIRecordingOptions, WAV_HEADER_BYTES } from './recordingOptions';
import { normalizeDbMetering, pcmBufferToLevel, smoothMeteringLevel } from './audioMetering';

const POLL_INTERVAL_MS = 250;

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export class ExpoAudioStreamingCapture {
  /** Always available — expo-audio ships with the Expo managed runtime. */
  static get isSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  private recorder: AudioRecorder | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private sentBytes = 0;
  private onChunk: ((data: ArrayBuffer) => void) | null = null;
  private onCaptureError: ((msg: string) => void) | null = null;
  private startTime = 0;
  private isPaused = false;
  private meteringLevel = 0;

  async start(
    onChunk: (data: ArrayBuffer) => void,
    onError: (msg: string) => void,
  ): Promise<void> {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      throw new Error('Microphone permission denied.');
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    });

    this.onChunk = onChunk;
    this.onCaptureError = onError;
    this.sentBytes = 0;
    this.isPaused = false;
    this.meteringLevel = 0;
    this.startTime = Date.now();

    const AudioRecorderCtor = (AudioModule as any)['AudioRecorder'] as new (
      options: Partial<RecordingOptions>
    ) => AudioRecorder;
    const recorder = new AudioRecorderCtor(assemblyAIRecordingOptions);
    await recorder.prepareToRecordAsync();
    recorder.record();
    this.recorder = recorder;

    this.startPolling();
  }

  getMetering(): number {
    if (!this.recorder || this.isPaused) return 0;
    try {
      const status = this.recorder.getStatus();
      if (status.isRecording && status.metering !== undefined) {
        return normalizeDbMetering(status.metering);
      }
    } catch {
      // fall through to PCM-derived level
    }
    return this.meteringLevel;
  }

  pause(): void {
    this.isPaused = true;
    this.meteringLevel = 0;
    this.recorder?.pause();
    this.stopPolling();
  }

  async resume(): Promise<void> {
    this.isPaused = false;
    this.recorder?.record();
    this.startPolling();
  }

  async stop(): Promise<{ uri: string; duration: number }> {
    this.stopPolling();

    const uri = this.recorder?.uri ?? '';
    const duration = (Date.now() - this.startTime) / 1000;

    if (this.recorder) {
      await this.recorder.stop();
      this.recorder = null;
    }

    this.onChunk = null;
    this.onCaptureError = null;

    return { uri, duration };
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => void this.pollFile(), POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async pollFile(): Promise<void> {
    const uri = this.recorder?.uri;
    if (!uri || this.isPaused) return;

    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) return;

      const totalBytes: number = (info as any).size ?? 0;
      // Skip the 44-byte WAV header on the very first read.
      const readFrom = this.sentBytes === 0 ? WAV_HEADER_BYTES : this.sentBytes;
      const newByteCount = totalBytes - readFrom;
      if (newByteCount <= 0) return;

      const b64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
        position: readFrom,
        length: newByteCount,
      });

      const buffer = base64ToArrayBuffer(b64);
      if (buffer.byteLength > 0) {
        const instant = pcmBufferToLevel(buffer);
        this.meteringLevel = smoothMeteringLevel(this.meteringLevel, instant);
        this.onChunk?.(buffer);
        this.sentBytes = totalBytes;
      }
    } catch (err: any) {
      this.onCaptureError?.(
        `Audio poll failed: ${err?.message ?? String(err)}`,
      );
    }
  }
}
