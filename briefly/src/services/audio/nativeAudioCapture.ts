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
import { Platform } from 'react-native';
import {
  addBrieflyTranscriberListener,
  getBrieflyTranscriberModule,
} from '../../../modules/briefly-transcriber';
import { base64ToArrayBuffer } from '@/utils/binary/base64ToArrayBuffer';
import { pcmBufferToLevel, smoothMeteringLevel } from './audioMetering';
export class NativeAudioCapture {
  /** True when the native module is present (dev client / native build). */
  static get isSupported(): boolean {
    const module = getBrieflyTranscriberModule();
    return (
      (Platform.OS === 'ios' || Platform.OS === 'android') &&
      typeof module?.startAudioCapture === 'function'
    );
  }
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
    const module = getBrieflyTranscriberModule();
    if (!module) {
      throw new Error('BrieflyTranscriber native module is not available.');
    }
    this.pcmSub = addBrieflyTranscriberListener('onPCMChunk', (e: { data: string }) => {
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
    await module.startAudioCapture({ sampleRate });
  }
  getMetering(): number {
    return this.isPaused ? 0 : this.meteringLevel;
  }
  async pause(): Promise<void> {
    this.isPaused = true;
    this.meteringLevel = 0;
    const module = getBrieflyTranscriberModule();
    if (!module) return;
    await module.pauseAudioCapture();
  }
  async resume(): Promise<void> {
    this.isPaused = false;
    const module = getBrieflyTranscriberModule();
    if (!module) return;
    await module.resumeAudioCapture();
  }
  async stop(): Promise<{ uri: string; duration: number }> {
    this.pcmSub?.remove();
    this.pcmSub = null;
    this.meteringLevel = 0;
    this.isPaused = false;
    const module = getBrieflyTranscriberModule();
    if (!module) return { uri: '', duration: 0 };
    const result = await module.stopAudioCapture();
    return { uri: result?.uri ?? '', duration: result?.duration ?? 0 };
  }
  dispose(): void {
    this.pcmSub?.remove();
    this.pcmSub = null;
    this.meteringLevel = 0;
    this.isPaused = false;
  }
}
