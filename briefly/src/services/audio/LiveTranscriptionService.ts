/**
 * LiveTranscriptionService (SRP + OCP + LSP)
 *
 * Single responsibility: manage live transcription sessions.
 *
 * The original AudioService had duplicated start/pause/resume/stop methods
 * for cloud vs on-device transcription (6 methods doing near-identical work).
 * This refactored version uses a single set of methods parameterized by mode,
 * because the underlying AssemblyAILiveTranscriptionClient already handles
 * the mode distinction internally.
 *
 * OCP: new transcription modes can be added to AssemblyAILiveMode without
 * modifying these methods.
 *
 * LSP: both cloud and on-device modes are fully substitutable — they share
 * the same contract (start/pause/resume/stop lifecycle) with identical
 * pre/postconditions.
 */

import { Platform } from 'react-native';
import { getInfoAsync } from 'expo-file-system/legacy';
import {
  AssemblyAIConnectionState,
  AssemblyAILiveTranscriptionClient,
  AssemblyAILiveMode,
} from './AssemblyAILiveTranscription';
import { AssemblyAIConfig } from '../../config/assemblyAI';
import { AudioRecordingResult } from './types';
import { logger } from '../../utils/logger';

export interface LiveTranscriptionCallbacks {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onConnectionState?: (state: AssemblyAIConnectionState, reason?: string) => void;
  onError?: (message: string) => void;
}

class LiveTranscriptionServiceClass {
  private client: AssemblyAILiveTranscriptionClient | null = null;

  /** True when the native bridge is available for cloud live transcription. */
  get isSupported(): boolean {
    return (Platform.OS === 'ios' || Platform.OS === 'android') &&
      AssemblyAILiveTranscriptionClient.isSupported;
  }

  /** True when on-device live transcription is available. */
  get isOnDeviceSupported(): boolean {
    return (Platform.OS === 'ios' || Platform.OS === 'android') &&
      AssemblyAILiveTranscriptionClient.isOnDeviceSupported;
  }

  /**
   * Start a live transcription session.
   * @param mode - 'cloud' or 'on-device'
   * @param callbacks - event handlers for transcript events
   */
  async start(mode: AssemblyAILiveMode, callbacks: LiveTranscriptionCallbacks): Promise<void> {
    this.client?.dispose();
    this.client = new AssemblyAILiveTranscriptionClient({
      onPartial: callbacks.onPartial,
      onFinal: callbacks.onFinal,
      onConnectionState: callbacks.onConnectionState,
      onError: callbacks.onError,
    });

    await this.client.start({
      sampleRate: AssemblyAIConfig.streamSampleRate,
      speechModel: AssemblyAIConfig.streamModel,
      mode,
    });
    logger.info('AUDIO', `Live transcription started (${mode})`);
  }

  async pause(): Promise<void> {
    await this.client?.pause();
    logger.info('AUDIO', 'Live transcription paused');
  }

  async resume(): Promise<void> {
    await this.client?.resume();
    logger.info('AUDIO', 'Live transcription resumed');
  }

  async stop(): Promise<AudioRecordingResult> {
    const result = await this.client?.stop();
    this.client = null;

    let fileSize = 0;
    try {
      const info = await getInfoAsync(result?.uri ?? '');
      fileSize = info.exists ? ((info as any).size ?? 0) : 0;
    } catch (error: any) {
      logger.warn('AUDIO', 'Failed to read live recording file size', {
        error: error?.message ?? String(error),
      });
    }

    logger.info('AUDIO', 'Live transcription stopped', {
      uri: result?.uri ?? '',
      durationSec: result?.duration ?? 0,
      fileSize,
    });
    return { uri: result?.uri ?? '', duration: result?.duration ?? 0, fileSize };
  }
}

export const LiveTranscriptionService = new LiveTranscriptionServiceClass();
