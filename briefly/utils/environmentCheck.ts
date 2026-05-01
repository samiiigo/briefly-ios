import { TranscriptionMode } from '../types';
import { NativeAudioCapture } from '../services/audio/NativeAudioCapture';
import { ExpoAudioStreamingCapture } from '../services/audio/ExpoAudioStreamingCapture';
import { getAssemblyAISharedApiKey } from '../config/assemblyAI';

export interface EnvironmentCapabilities {
  hasNativeModule: boolean;
  hasAssemblyAIKey: boolean;
  canLiveTranscribe: boolean;
  recommendedTranscriptionMode: TranscriptionMode;
}

/**
 * Synchronously checks what transcription capabilities are available on this
 * device/build and returns the recommended default mode.
 *
 * Live transcription requires a valid AssemblyAI API key.
 * Audio capture uses the native module when available (dev client builds)
 * and falls back to expo-audio polling in Expo Go — so the native module is
 * NOT required for live transcription, only the API key is.
 */
export function checkEnvironment(): EnvironmentCapabilities {
  const hasNativeModule = NativeAudioCapture.isSupported;
  const hasAudioCapture = hasNativeModule || ExpoAudioStreamingCapture.isSupported;
  const hasAssemblyAIKey = !!getAssemblyAISharedApiKey();
  const canLiveTranscribe = hasAudioCapture && hasAssemblyAIKey;
  return {
    hasNativeModule,
    hasAssemblyAIKey,
    canLiveTranscribe,
    recommendedTranscriptionMode: canLiveTranscribe ? 'live-assemblyai' : 'post-assemblyai',
  };
}
