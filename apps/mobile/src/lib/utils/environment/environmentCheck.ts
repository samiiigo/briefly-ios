import { TranscriptionMode } from '@briefly/types';
import { tryGetPublicAppConfig } from '@/config/env';
import {
  hasBrieflyTranscriberModule,
  supportsExpoAudioStreamingCapture,
  supportsLocalRecording,
  supportsNativePcmCapture,
  supportsOnDeviceLiveTranscription,
} from '@/lib/utils/platformCapabilities';

export interface EnvironmentCapabilities {
  hasNativeModule: boolean;
  hasOnDeviceSpeech: boolean;
  hasAssemblyAIKey: boolean;
  canLiveTranscribe: boolean;
  canRecord: boolean;
  recommendedTranscriptionMode: TranscriptionMode;
}

/**
 * Synchronously checks what transcription capabilities are available on this
 * device/build and returns the recommended default mode.
 */
export function checkEnvironment(): EnvironmentCapabilities {
  const hasNativeModule = supportsNativePcmCapture();
  const hasOnDeviceSpeech = supportsOnDeviceLiveTranscription();
  const hasAudioCapture = hasNativeModule || supportsExpoAudioStreamingCapture();
  const hasAssemblyAIKey = tryGetPublicAppConfig() != null;
  const canLiveTranscribe = hasAudioCapture && hasAssemblyAIKey;
  const canRecord = supportsLocalRecording();
  let recommendedTranscriptionMode: TranscriptionMode = 'cloud';
  if (hasOnDeviceSpeech && !canLiveTranscribe) {
    recommendedTranscriptionMode = 'local';
  }
  return {
    hasNativeModule: hasNativeModule || hasBrieflyTranscriberModule(),
    hasOnDeviceSpeech,
    hasAssemblyAIKey,
    canLiveTranscribe,
    canRecord,
    recommendedTranscriptionMode,
  };
}
