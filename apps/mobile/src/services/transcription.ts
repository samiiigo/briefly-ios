import {NativeModules} from 'react-native';

type BrieflySpeechNativeModule = {
  startTranscription: () => Promise<void>;
  stopTranscription: () => Promise<{text: string; durationSeconds: number}>;
  isAvailable: () => Promise<boolean>;
};

const moduleName = 'BrieflySpeechModule';

const nativeSpeech =
  (NativeModules[moduleName] as BrieflySpeechNativeModule | undefined) ?? null;

export async function startNativeTranscription() {
  if (!nativeSpeech) {
    return;
  }
  await nativeSpeech.startTranscription();
}

export async function stopNativeTranscription() {
  if (!nativeSpeech) {
    return {text: '', durationSeconds: 0};
  }
  return nativeSpeech.stopTranscription();
}

export async function isNativeTranscriptionAvailable() {
  if (!nativeSpeech) {
    return false;
  }
  return nativeSpeech.isAvailable();
}
