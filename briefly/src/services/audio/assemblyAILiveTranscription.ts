import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  addBrieflyTranscriberListener,
  getBrieflyTranscriberModule,
} from '../../../modules/briefly-transcriber';
import { supportsOnDeviceLiveTranscription } from '@/utils/platformCapabilities';
import { AssemblyAIConfig, getAssemblyAISharedApiKey } from '@/constants/api/assemblyAI';

export type AssemblyAIConnectionState =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'paused'
  | 'closed';

export type AssemblyAILiveMode = 'cloud' | 'on-device';

export interface AssemblyAILiveStartOptions {
  apiKey?: string;
  sampleRate?: number;
  speechModel?: string;
  mode?: AssemblyAILiveMode;
}

export interface AssemblyAILiveStartResult {
  sampleRate: number;
  speechModel: string;
}

export interface AssemblyAILiveStopResult {
  uri: string;
  duration: number;
}

export interface AssemblyAITranscriptPartialEvent {
  type: 'partial';
  text: string;
}

export interface AssemblyAITranscriptFinalEvent {
  type: 'final';
  text: string;
}

export interface AssemblyAIConnectionEvent {
  type: 'connection';
  state: AssemblyAIConnectionState;
  reason?: string;
}

export interface AssemblyAIErrorEvent {
  type: 'error';
  message: string;
}

export type AssemblyAILiveEvent =
  | AssemblyAITranscriptPartialEvent
  | AssemblyAITranscriptFinalEvent
  | AssemblyAIConnectionEvent
  | AssemblyAIErrorEvent;

export interface AssemblyAILiveListeners {
  onEvent?: (event: AssemblyAILiveEvent) => void;
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  onConnectionState?: (state: AssemblyAIConnectionState, reason?: string) => void;
  onError?: (message: string) => void;
}

function resolveDefaultApiKey(): string | undefined {
  const fromSharedConfig = getAssemblyAISharedApiKey();
  if (fromSharedConfig) {
    return fromSharedConfig;
  }
  const fromExpoConfig = (Constants.expoConfig?.extra as any)?.assemblyAiApiKey as string | undefined;
  const trimmed = fromExpoConfig?.trim();
  return trimmed ? trimmed : undefined;
}

export class AssemblyAILiveTranscriptionClient {
  private readonly listeners: AssemblyAILiveListeners;
  private subscriptions: { remove: () => void }[] = [];
  private mode: AssemblyAILiveMode = 'cloud';

  constructor(listeners: AssemblyAILiveListeners = {}) {
    this.listeners = listeners;
  }

  static get isSupported(): boolean {
    return (Platform.OS === 'ios' || Platform.OS === 'android') && getBrieflyTranscriberModule() != null;
  }

  static get isOnDeviceSupported(): boolean {
    return supportsOnDeviceLiveTranscription();
  }

  async start(options: AssemblyAILiveStartOptions = {}): Promise<AssemblyAILiveStartResult> {
    if (!AssemblyAILiveTranscriptionClient.isSupported) {
      throw new Error('AssemblyAI live transcription is not available on this platform.');
    }

    const module = getBrieflyTranscriberModule();
    if (!module) {
      throw new Error('BrieflyTranscriber native module is not available.');
    }

    this.attachListeners();

    try {
      const mode: AssemblyAILiveMode = options.mode ?? 'cloud';
      this.mode = mode;

      const payload = {
        apiKey: options.apiKey ?? resolveDefaultApiKey(),
        sampleRate: options.sampleRate ?? AssemblyAIConfig.streamSampleRate,
        speechModel: options.speechModel ?? AssemblyAIConfig.streamModel,
      };

      if (mode === 'on-device') {
        return await module.startOnDeviceLiveTranscription(payload);
      }

      return await module.startLiveTranscription(payload);
    } catch (error) {
      this.detachListeners();
      throw error;
    }
  }

  async pause(): Promise<void> {
    const module = getBrieflyTranscriberModule();
    if (!module) return;
    if (this.mode === 'on-device') {
      await module.pauseOnDeviceLiveTranscription();
    } else {
      await module.pauseLiveTranscription();
    }
  }

  async resume(): Promise<void> {
    const module = getBrieflyTranscriberModule();
    if (!module) return;
    if (this.mode === 'on-device') {
      await module.resumeOnDeviceLiveTranscription();
    } else {
      await module.resumeLiveTranscription();
    }
  }

  async stop(): Promise<AssemblyAILiveStopResult> {
    const module = getBrieflyTranscriberModule();
    if (!module) return { uri: '', duration: 0 };
    try {
      if (this.mode === 'on-device') {
        return await module.stopOnDeviceLiveTranscription();
      }
      return await module.stopLiveTranscription();
    } finally {
      this.detachListeners();
    }
  }

  dispose(): void {
    this.detachListeners();
  }

  private attachListeners(): void {
    this.detachListeners();

    const module = getBrieflyTranscriberModule();
    if (!module) return;

    this.subscriptions.push(
      addBrieflyTranscriberListener('onPartialTranscript', (e: { text: string }) => {
        const text = e?.text ?? '';
        this.listeners.onPartial?.(text);
        this.listeners.onEvent?.({ type: 'partial', text });
      })
    );

    this.subscriptions.push(
      addBrieflyTranscriberListener('onFinalTranscript', (e: { text: string }) => {
        const text = e?.text ?? '';
        this.listeners.onFinal?.(text);
        this.listeners.onEvent?.({ type: 'final', text });
      })
    );

    this.subscriptions.push(
      addBrieflyTranscriberListener('onStreamingState', (e: { state: string; reason?: string | null }) => {
        const state = (e?.state ?? 'idle') as AssemblyAIConnectionState;
        const reason = e?.reason ?? undefined;
        this.listeners.onConnectionState?.(state, reason);
        this.listeners.onEvent?.({ type: 'connection', state, reason });
      })
    );

    this.subscriptions.push(
      addBrieflyTranscriberListener('onTranscriptionError', (e: { message: string }) => {
        const message = e?.message ?? 'Unknown transcription error';
        this.listeners.onError?.(message);
        this.listeners.onEvent?.({ type: 'error', message });
      })
    );
  }

  private detachListeners(): void {
    this.subscriptions.forEach((sub) => sub.remove());
    this.subscriptions = [];
  }
}
