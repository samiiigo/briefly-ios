/**
 * Runtime capability probes for iOS / Android native features.
 * Used by environment checks and transcription routing.
 */

import { NativeModules } from 'react-native';
import { NativeAudioCapture } from '@/services/audio/nativeAudioCapture';
import { ExpoAudioStreamingCapture } from '@/services/audio/expoAudioStreamingCapture';
import { isIOS, isAndroid } from './platform';

const { BrieflyTranscriber } = NativeModules;

export function hasBrieflyTranscriberModule(): boolean {
  return BrieflyTranscriber != null;
}

/** iOS on-device Speech live transcription (BrieflyTranscriber native module). */
export function supportsOnDeviceLiveTranscription(): boolean {
  return isIOS && typeof BrieflyTranscriber?.startOnDeviceLiveTranscription === 'function';
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

/** Background recording is configured via expo-audio plugin on both platforms. */
export function supportsBackgroundRecording(): boolean {
  return supportsLocalRecording();
}

/** Android 13+ notification permission is only relevant on Android. */
export function needsAndroidRecordingNotificationPermission(): boolean {
  return isAndroid;
}
