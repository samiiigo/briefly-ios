import {NativeModules} from 'react-native';

type WindowsSpeechBridge = {
  startTranscription: () => Promise<void>;
  stopTranscription: () => Promise<{text: string; durationSeconds: number}>;
  isAvailable: () => Promise<boolean>;
};

export const NativeBrieflySpeech =
  (NativeModules.BrieflySpeechModule as WindowsSpeechBridge | undefined) ?? null;
