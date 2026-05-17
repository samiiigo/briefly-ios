/**
 * NativeAudioCapture
 *
 * Wraps the BrieflyTranscriber native module's audio-capture-only methods.
 * Starts AVAudioEngine on iOS, converts mic input to 16-bit PCM at the
 * requested sample rate, and emits each chunk to JS via the `onPCMChunk` event.
 *
 * The AssemblyAI WebSocket is handled separately in AssemblyAIWebSocketService —
 * this class is only responsible for audio capture.
 */

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { pcmBufferToLevel, smoothMeteringLevel } from './audioMetering';

const { BrieflyTranscriber } = NativeModules;

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export class NativeAudioCapture {
  /** True when the native module is present (dev client / native build). */
  static get isSupported(): boolean {
    return (Platform.OS === 'ios' || Platform.OS === 'android') &&
      !!BrieflyTranscriber?.startAudioCapture;
  }

  private emitter = new NativeEventEmitter(BrieflyTranscriber);
  private pcmSub: { remove: () => void } | null = null;
  private meteringLevel = 0;
  private isPaused = false;

  async start(
    sampleRate: number,
    onChunk: (data: ArrayBuffer) => void,
    onError: (msg: string) => void,
  ): Promise<void> {
    this.pcmSub?.remove();

    this.meteringLevel = 0;
    this.isPaused = false;

    this.pcmSub = this.emitter.addListener('onPCMChunk', (e: { data: string }) => {
      try {
        const buffer = base64ToArrayBuffer(e.data);
        if (!this.isPaused) {
          const instant = pcmBufferToLevel(buffer);
          this.meteringLevel = smoothMeteringLevel(this.meteringLevel, instant);
        }
        onChunk(buffer);
      } catch (err: any) {
        onError(`PCM decode failed: ${err?.message ?? String(err)}`);
      }
    });

    await BrieflyTranscriber.startAudioCapture({ sampleRate });
  }

  getMetering(): number {
    return this.isPaused ? 0 : this.meteringLevel;
  }

  async pause(): Promise<void> {
    this.isPaused = true;
    this.meteringLevel = 0;
    await BrieflyTranscriber.pauseAudioCapture();
  }

  async resume(): Promise<void> {
    this.isPaused = false;
    await BrieflyTranscriber.resumeAudioCapture();
  }

  async stop(): Promise<{ uri: string; duration: number }> {
    this.pcmSub?.remove();
    this.pcmSub = null;
    this.meteringLevel = 0;
    this.isPaused = false;
    const result = await BrieflyTranscriber.stopAudioCapture();
    return { uri: result?.uri ?? '', duration: result?.duration ?? 0 };
  }

  dispose(): void {
    this.pcmSub?.remove();
    this.pcmSub = null;
    this.meteringLevel = 0;
    this.isPaused = false;
  }
}
