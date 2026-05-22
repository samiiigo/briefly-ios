/**
 * Decorative live transcript preview while RecordingService captures audio.
 * Polls the in-progress WAV and streams PCM to AssemblyAI (cloud preview only).
 * Output is UI-only and is not passed into save or background processing.
 */

import { getInfoAsync, readAsStringAsync, EncodingType } from '@/utils/fileSystem/legacyPositionalRead';
import { WAV_HEADER_BYTES } from './recordingOptions';
import { base64ToArrayBuffer } from '@/utils/binary/base64ToArrayBuffer';
import { AssemblyAIConfig, requireAssemblyAISharedApiKey } from '@/constants/api/assemblyAI';
import { AssemblyAIWebSocketService } from './assemblyAIWebSocketService';
import type { AssemblyAIConnectionState } from './assemblyAILiveTranscription';
import type { LiveTranscriptionCallbacks } from './liveTranscriptionService';
import { logger } from '@/utils/logging/logger';

const POLL_INTERVAL_MS = 250;
const MAX_READ_BYTES_PER_POLL = 16_384;

export type DecorativeLivePreviewCallbacks = LiveTranscriptionCallbacks;

class DecorativeLivePreviewClass {
  private ws: AssemblyAIWebSocketService | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private sentBytes = 0;
  private isPaused = false;
  private pollInFlight = false;
  private getUri: (() => string | undefined) | null = null;
  private callbacks: DecorativeLivePreviewCallbacks | null = null;

  async start(
    getRecordingUri: () => string | undefined,
    callbacks: DecorativeLivePreviewCallbacks,
  ): Promise<void> {
    this.stop();
    const apiKey = requireAssemblyAISharedApiKey();
    this.getUri = getRecordingUri;
    this.callbacks = callbacks;
    this.sentBytes = 0;
    this.isPaused = false;

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
        onError: (msg) => callbacks.onError?.(msg),
      },
    );
    this.ws = ws;
    this.startPolling();
    logger.info('AUDIO', 'Decorative live preview started (cloud stream)');
  }

  pause(): void {
    this.isPaused = true;
    this.stopPolling();
  }

  resume(): void {
    this.isPaused = false;
    this.startPolling();
  }

  stop(): void {
    this.stopPolling();
    if (this.ws) {
      try {
        this.ws.terminate();
      } catch {
        // ignore
      }
      this.ws.disconnect();
    }
    this.ws = null;
    this.getUri = null;
    this.callbacks = null;
    this.sentBytes = 0;
    this.isPaused = false;
    logger.info('AUDIO', 'Decorative live preview stopped');
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
    if (this.pollInFlight || this.isPaused || !this.ws) return;
    const uri = this.getUri?.();
    if (!uri) return;

    this.pollInFlight = true;
    try {
      const info = await getInfoAsync(uri);
      if (!info.exists) return;

      const totalBytes: number = (info as { size?: number }).size ?? 0;
      const readFrom = this.sentBytes === 0 ? WAV_HEADER_BYTES : this.sentBytes;
      const pendingBytes = totalBytes - readFrom;
      if (pendingBytes <= 0) return;

      const readLength = Math.min(pendingBytes, MAX_READ_BYTES_PER_POLL);
      const b64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
        position: readFrom,
        length: readLength,
      });

      const buffer = base64ToArrayBuffer(b64);
      if (buffer.byteLength === 0) return;

      this.ws.sendPCM(buffer);
      this.sentBytes = readFrom + readLength;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.callbacks?.onError?.(`Preview stream failed: ${message}`);
    } finally {
      this.pollInFlight = false;
    }
  }
}

export const DecorativeLivePreview = new DecorativeLivePreviewClass();
