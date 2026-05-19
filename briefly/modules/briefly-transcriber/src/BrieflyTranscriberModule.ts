import { type NativeModule } from 'expo';
import { requireOptionalNativeModule } from 'expo-modules-core';

import type {
  BrieflyTranscriberModuleEvents,
  SummarizeResult,
} from './BrieflyTranscriber.types';

export interface BrieflyTranscriberNativeModule extends NativeModule<BrieflyTranscriberModuleEvents> {
  summarize(text: string): Promise<SummarizeResult>;
  startLiveTranscription(
    options: Record<string, unknown>
  ): Promise<{ sampleRate: number; speechModel: string }>;
  pauseLiveTranscription(): Promise<void>;
  resumeLiveTranscription(): Promise<void>;
  stopLiveTranscription(): Promise<{ uri: string; duration: number }>;
  startOnDeviceLiveTranscription(
    options: Record<string, unknown>
  ): Promise<{ sampleRate: number; speechModel: string }>;
  pauseOnDeviceLiveTranscription(): Promise<void>;
  resumeOnDeviceLiveTranscription(): Promise<void>;
  stopOnDeviceLiveTranscription(): Promise<{ uri: string; duration: number }>;
  startAudioCapture(options: { sampleRate?: number }): Promise<{ sampleRate: number }>;
  pauseAudioCapture(): Promise<void>;
  resumeAudioCapture(): Promise<void>;
  stopAudioCapture(): Promise<{ uri: string; duration: number }>;
  transcribeFile(filePath: string): void;
}

/** Returns the native module when linked in the dev client; null in Expo Go or before prebuild. */
export function getBrieflyTranscriberModule(): BrieflyTranscriberNativeModule | null {
  return requireOptionalNativeModule<BrieflyTranscriberNativeModule>('BrieflyTranscriber');
}
