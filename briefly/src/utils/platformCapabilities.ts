/**
 * Runtime capability probes for iOS / Android native features.
 * Used by environment checks and transcription routing.
 */

import { requireOptionalNativeModule } from 'expo-modules-core';
import { TurboModuleRegistry } from 'react-native';
import { getBrieflyTranscriberModule } from '../../modules/briefly-transcriber';
import { NativeAudioCapture } from '@/services/audio/nativeAudioCapture';
import { ExpoAudioStreamingCapture } from '@/services/audio/expoAudioStreamingCapture';
import { isIOS, isAndroid } from './platform';

export function hasBrieflyTranscriberModule(): boolean {
  return getBrieflyTranscriberModule() != null;
}

/** Extractive on-device summary via BrieflyTranscriber (iOS and Android dev/production builds). */
export function supportsNativeOnDeviceSummarization(): boolean {
  const module = getBrieflyTranscriberModule();
  return typeof module?.summarize === 'function';
}

/** iOS on-device Speech live transcription (BrieflyTranscriber Expo module). */
export function supportsOnDeviceLiveTranscription(): boolean {
  const module = getBrieflyTranscriberModule();
  return isIOS && typeof module?.startOnDeviceLiveTranscription === 'function';
}

/** Low-latency PCM capture via native module (dev client builds). */
export function supportsNativePcmCapture(): boolean {
  return NativeAudioCapture.isSupported;
}

/** expo-audio file polling fallback for live cloud transcription. */
export function supportsExpoAudioStreamingCapture(): boolean {
  return ExpoAudioStreamingCapture.isSupported;
}

/** Standard local recording via expo-audio (always on iOS/Android). */
export function supportsLocalRecording(): boolean {
  return isIOS || isAndroid;
}

function hasExpoDocumentPickerModule(): boolean {
  return requireOptionalNativeModule('ExpoDocumentPicker') != null;
}

/** JSON/audio import via expo-document-picker (iOS Expo Go + dev builds; Android dev/production only). */
export function supportsDocumentPicker(): boolean {
  if (isIOS) return true;
  if (isAndroid) return hasExpoDocumentPickerModule();
  return false;
}

/** Background recording is configured via expo-audio plugin on both platforms. */
export function supportsBackgroundRecording(): boolean {
  return supportsLocalRecording();
}

/** Android 13+ notification permission is only relevant on Android. */
export function needsAndroidRecordingNotificationPermission(): boolean {
  return isAndroid;
}

/** Short hint for settings pickers when a native-only option is unavailable (e.g. Expo Go). */
export const NATIVE_BUILD_REQUIRED_HINT =
  'Requires a development build (not available in Expo Go).';

/** On-device Gemma summarization via llama.rn (dev client / production build only). */
export function supportsLocalLlamaSummarization(): boolean {
  try {
    return TurboModuleRegistry.get('RNLlama') != null;
  } catch {
    return false;
  }
}
