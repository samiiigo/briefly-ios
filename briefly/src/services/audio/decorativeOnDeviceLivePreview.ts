/**
 * On-device decorative live transcript (iOS Speech). UI-only; does not write audio or
 * feed the post-recording pipeline. Runs alongside RecordingService when enabled.
 */
import { AssemblyAIConfig } from '@/constants/api/assemblyAI';
import { AssemblyAILiveTranscriptionClient } from './assemblyAILiveTranscription';
import type { LiveTranscriptionCallbacks } from './liveTranscriptionService';
import { logger } from '@/utils/logging/logger';
class DecorativeOnDeviceLivePreviewClass {
  private client: AssemblyAILiveTranscriptionClient | null = null;
  async start(callbacks: LiveTranscriptionCallbacks): Promise<void> {
    this.stop();
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
    this.client = client;
    logger.info('AUDIO', 'Decorative on-device live preview started');
  }
  async pause(): Promise<void> {
    await this.client?.pause();
  }
  async resume(): Promise<void> {
    await this.client?.resume();
  }
  stop(): void {
    if (this.client) {
      void this.client.stop().catch(() => {});
      this.client.dispose();
    }
    this.client = null;
    logger.info('AUDIO', 'Decorative on-device live preview stopped');
  }
}
export const DecorativeOnDeviceLivePreview = new DecorativeOnDeviceLivePreviewClass();
