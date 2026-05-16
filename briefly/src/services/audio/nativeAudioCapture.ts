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

  async start(
    sampleRate: number,
    onChunk: (data: ArrayBuffer) => void,
    onError: (msg: string) => void,
  ): Promise<void> {
    this.pcmSub?.remove();

    this.pcmSub = this.emitter.addListener('onPCMChunk', (e: { data: string }) => {
      try {
        onChunk(base64ToArrayBuffer(e.data));
      } catch (err: any) {
        onError(`PCM decode failed: ${err?.message ?? String(err)}`);
      }
    });

    await BrieflyTranscriber.startAudioCapture({ sampleRate });
  }

  async pause(): Promise<void> {
    await BrieflyTranscriber.pauseAudioCapture();
  }

  async resume(): Promise<void> {
    await BrieflyTranscriber.resumeAudioCapture();
  }

  async stop(): Promise<{ uri: string; duration: number }> {
    this.pcmSub?.remove();
    this.pcmSub = null;
    const result = await BrieflyTranscriber.stopAudioCapture();
    return { uri: result?.uri ?? '', duration: result?.duration ?? 0 };
  }

  dispose(): void {
    this.pcmSub?.remove();
    this.pcmSub = null;
  }
}
