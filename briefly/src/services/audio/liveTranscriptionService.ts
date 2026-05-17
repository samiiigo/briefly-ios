/**
 * LiveTranscriptionService
 *
 * Orchestrates live transcription using the best available strategy:
 *
 *  Cloud mode
 *  ├── Native build  → NativeAudioCapture (Swift AVAudioEngine)
 *  │                    + AssemblyAIWebSocketService (JS)
 *  └── Expo Go       → ExpoAudioStreamingCapture (expo-audio file polling)
 *                       + AssemblyAIWebSocketService (JS)
 *
 *  On-device mode    → BrieflyTranscriber.startOnDeviceLiveTranscription
 *                       (iOS Speech framework, fully on-device)
 *
 * The AssemblyAI WebSocket is always implemented in JavaScript, matching
 * the reference design from the v3 streaming spec.
 */

import { NativeModules } from 'react-native';
import { getInfoAsync } from 'expo-file-system/legacy';
import { normalizeDbMetering } from './audioMetering';
import { AssemblyAIConfig, requireAssemblyAISharedApiKey } from '@/constants/api/assemblyAI';
import { AudioRecordingResult } from './types';
import { logger } from '@/utils/logging/logger';
import type { AssemblyAIConnectionState } from './assemblyAILiveTranscription';
import { AssemblyAILiveTranscriptionClient } from './assemblyAILiveTranscription';
import { AssemblyAIWebSocketService } from './assemblyAIWebSocketService';
import { NativeAudioCapture } from './nativeAudioCapture';
import { ExpoAudioStreamingCapture } from './expoAudioStreamingCapture';
import { ensureMicrophonePermission } from '@/utils/recording/recordingPermissions';

export interface LiveTranscriptionCallbacks {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onConnectionState?: (state: AssemblyAIConnectionState, reason?: string) => void;
  onError?: (message: string) => void;
}

type ActivePath =
  | { kind: 'native-js'; capture: NativeAudioCapture; ws: AssemblyAIWebSocketService }
  | { kind: 'expo-js'; capture: ExpoAudioStreamingCapture; ws: AssemblyAIWebSocketService }
  | { kind: 'on-device'; client: AssemblyAILiveTranscriptionClient };

class LiveTranscriptionServiceClass {
  private active: ActivePath | null = null;

  /** True when the native module is present (any live mode possible). */
  get isSupported(): boolean {
    return NativeAudioCapture.isSupported || ExpoAudioStreamingCapture.isSupported;
  }

  /** True when on-device Swift Speech path is available. */
  get isOnDeviceSupported(): boolean {
    return AssemblyAILiveTranscriptionClient.isOnDeviceSupported;
  }

  async start(
    mode: 'cloud' | 'on-device',
    callbacks: LiveTranscriptionCallbacks,
  ): Promise<void> {
    this.stopActive();
    await ensureMicrophonePermission();

    if (mode === 'on-device') {
      // On-device path stays in Swift (iOS Speech framework).
      const client = new AssemblyAILiveTranscriptionClient({
        onPartial: callbacks.onPartial,
        onFinal: callbacks.onFinal,
        onConnectionState: callbacks.onConnectionState,
        onError: callbacks.onError,
      });
      await client.start({
        sampleRate: AssemblyAIConfig.streamSampleRate,
        speechModel: AssemblyAIConfig.streamModel,
        mode: 'on-device',
      });
      this.active = { kind: 'on-device', client };
      logger.info('AUDIO', 'Live transcription started (on-device)');
      return;
    }

    // Cloud path: AssemblyAI WebSocket in JS, audio from native or expo-audio.
    const apiKey = requireAssemblyAISharedApiKey();
    const ws = new AssemblyAIWebSocketService();

    ws.connect(
      apiKey,
      AssemblyAIConfig.streamSampleRate,
      AssemblyAIConfig.streamModel,
      {
        onPartial: callbacks.onPartial,
        onFinal: callbacks.onFinal,
        onState: (state, reason) => {
          callbacks.onConnectionState?.(state as AssemblyAIConnectionState, reason);
        },
        onError: (msg) => {
          callbacks.onError?.(msg);
        },
      },
    );

    if (NativeAudioCapture.isSupported) {
      const capture = new NativeAudioCapture();
      await capture.start(
        AssemblyAIConfig.streamSampleRate,
        (chunk) => ws.sendPCM(chunk),
        (msg) => callbacks.onError?.(msg),
      );
      this.active = { kind: 'native-js', capture, ws };
      logger.info('AUDIO', 'Live transcription started (native audio + JS WebSocket)');
    } else {
      const capture = new ExpoAudioStreamingCapture();
      await capture.start(
        (chunk) => ws.sendPCM(chunk),
        (msg) => callbacks.onError?.(msg),
      );
      this.active = { kind: 'expo-js', capture, ws };
      logger.info('AUDIO', 'Live transcription started (expo-audio + JS WebSocket)');
    }
  }

  async pause(): Promise<void> {
    const a = this.active;
    if (!a) return;

    if (a.kind === 'on-device') {
      await a.client.pause();
    } else if (a.kind === 'native-js') {
      await a.capture.pause();
      // Pause the WS by not sending audio; connection stays open.
    } else {
      a.capture.pause();
    }
    logger.info('AUDIO', 'Live transcription paused');
  }

  async resume(): Promise<void> {
    const a = this.active;
    if (!a) return;

    if (a.kind === 'on-device') {
      await a.client.resume();
    } else if (a.kind === 'native-js') {
      await a.capture.resume();
    } else {
      await a.capture.resume();
    }
    logger.info('AUDIO', 'Live transcription resumed');
  }

  getMetering(): number {
    const a = this.active;
    if (!a) return 0;

    if (a.kind === 'native-js') return a.capture.getMetering();
    if (a.kind === 'expo-js') return a.capture.getMetering();

    const { BrieflyTranscriber } = NativeModules;
    if (typeof BrieflyTranscriber?.getAudioCaptureMetering === 'function') {
      try {
        const db = BrieflyTranscriber.getAudioCaptureMetering();
        if (typeof db === 'number') return normalizeDbMetering(db);
      } catch {
        // optional native API
      }
    }
    return 0;
  }

  async stop(): Promise<AudioRecordingResult> {
    const a = this.active;
    this.active = null;

    if (!a) return { uri: '', duration: 0, fileSize: 0 };

    if (a.kind === 'on-device') {
      const result = await a.client.stop();
      return this.toRecordingResult(result?.uri ?? '', result?.duration ?? 0);
    }

    // Cloud paths: terminate WebSocket gracefully, then stop audio.
    try {
      a.ws.terminate();
      await new Promise((r) => setTimeout(r, 250)); // let final Turn arrive
    } catch {
      // ignore
    }
    a.ws.disconnect();

    const result = a.kind === 'native-js'
      ? await a.capture.stop()
      : await a.capture.stop();

    logger.info('AUDIO', 'Live transcription stopped', {
      kind: a.kind,
      uri: result.uri,
      duration: result.duration,
    });
    return this.toRecordingResult(result.uri, result.duration);
  }

  private async toRecordingResult(uri: string, duration: number): Promise<AudioRecordingResult> {
    let fileSize = 0;
    try {
      const info = await getInfoAsync(uri);
      fileSize = info.exists ? ((info as any).size ?? 0) : 0;
    } catch {
      // non-critical
    }
    return { uri, duration, fileSize };
  }

  private stopActive(): void {
    const a = this.active;
    this.active = null;
    if (!a) return;

    if (a.kind === 'on-device') {
      a.client.dispose();
    } else {
      a.ws.disconnect();
      if (a.kind === 'native-js') {
        a.capture.dispose();
      }
    }
  }
}

export const LiveTranscriptionService = new LiveTranscriptionServiceClass();
