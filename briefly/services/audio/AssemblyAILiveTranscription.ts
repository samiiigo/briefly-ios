import Constants from 'expo-constants';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { AssemblyAIConfig, getAssemblyAISharedApiKey } from '../../config/assemblyAI';

const { BrieflyTranscriber } = NativeModules;

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
  private emitter: NativeEventEmitter | null = null;
  private readonly listeners: AssemblyAILiveListeners;

  private getEmitter(): NativeEventEmitter {
    if (!this.emitter) {
      this.emitter = new NativeEventEmitter(BrieflyTranscriber);
    }
    return this.emitter;
  }
  private subscriptions: { remove: () => void }[] = [];
  private mode: AssemblyAILiveMode = 'cloud';

  constructor(listeners: AssemblyAILiveListeners = {}) {
    this.listeners = listeners;
  }

  static get isSupported(): boolean {
    return (Platform.OS === 'ios' || Platform.OS === 'android') && !!BrieflyTranscriber;
  }

  static get isOnDeviceSupported(): boolean {
    // We rely on the native implementation to fail gracefully if the OS
    // does not support on-device recognition for the current locale.
    return AssemblyAILiveTranscriptionClient.isSupported;
  }

  async start(options: AssemblyAILiveStartOptions = {}): Promise<AssemblyAILiveStartResult> {
    if (!AssemblyAILiveTranscriptionClient.isSupported) {
      throw new Error('AssemblyAI live transcription is not available on this platform.');
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
        return await BrieflyTranscriber.startOnDeviceLiveTranscription(payload);
      }

      return await BrieflyTranscriber.startLiveTranscription(payload);
    } catch (error) {
      this.detachListeners();
      throw error;
    }
  }

  async pause(): Promise<void> {
    if (this.mode === 'on-device') {
      await BrieflyTranscriber.pauseOnDeviceLiveTranscription();
    } else {
      await BrieflyTranscriber.pauseLiveTranscription();
    }
  }

  async resume(): Promise<void> {
    if (this.mode === 'on-device') {
      await BrieflyTranscriber.resumeOnDeviceLiveTranscription();
    } else {
      await BrieflyTranscriber.resumeLiveTranscription();
    }
  }

  async stop(): Promise<AssemblyAILiveStopResult> {
    try {
      if (this.mode === 'on-device') {
        return await BrieflyTranscriber.stopOnDeviceLiveTranscription();
      }
      return await BrieflyTranscriber.stopLiveTranscription();
    } finally {
      this.detachListeners();
    }
  }

  dispose(): void {
    this.detachListeners();
  }

  private attachListeners(): void {
    this.detachListeners();

    this.subscriptions.push(
      this.getEmitter().addListener('onPartialTranscript', (e: { text: string }) => {
        const text = e?.text ?? '';
        this.listeners.onPartial?.(text);
        this.listeners.onEvent?.({ type: 'partial', text });
      })
    );

    this.subscriptions.push(
      this.getEmitter().addListener('onFinalTranscript', (e: { text: string }) => {
        const text = e?.text ?? '';
        this.listeners.onFinal?.(text);
        this.listeners.onEvent?.({ type: 'final', text });
      })
    );

    this.subscriptions.push(
      this.getEmitter().addListener('onStreamingState', (e: { state: AssemblyAIConnectionState; reason?: string }) => {
        const state = e?.state ?? 'idle';
        const reason = e?.reason;
        this.listeners.onConnectionState?.(state, reason);
        this.listeners.onEvent?.({ type: 'connection', state, reason });
      })
    );

    this.subscriptions.push(
      this.getEmitter().addListener('onTranscriptionError', (e: { message: string }) => {
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
