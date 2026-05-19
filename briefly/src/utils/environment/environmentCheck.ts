import { TranscriptionMode } from '@/types';
import { getAssemblyAISharedApiKey } from '@/constants/api/assemblyAI';
import {
  hasBrieflyTranscriberModule,
  supportsExpoAudioStreamingCapture,
  supportsLocalRecording,
  supportsNativePcmCapture,
  supportsOnDeviceLiveTranscription,
} from '@/utils/platformCapabilities';

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
 *
 * Cloud live transcription needs AssemblyAI key + any audio capture path.
 * On-device live needs iOS BrieflyTranscriber + Speech permission (native).
 * Plain recording works on both platforms via expo-audio without BrieflyTranscriber.
 */
export function checkEnvironment(): EnvironmentCapabilities {
  const hasNativeModule = supportsNativePcmCapture();
  const hasOnDeviceSpeech = supportsOnDeviceLiveTranscription();
  const hasAudioCapture = hasNativeModule || supportsExpoAudioStreamingCapture();
  const hasAssemblyAIKey = !!getAssemblyAISharedApiKey();
  const canLiveTranscribe = hasAudioCapture && hasAssemblyAIKey;
  const canRecord = supportsLocalRecording();

  let recommendedTranscriptionMode: TranscriptionMode = 'post-assemblyai';
  if (canLiveTranscribe) {
    recommendedTranscriptionMode = 'live-assemblyai';
  } else if (hasOnDeviceSpeech) {
    recommendedTranscriptionMode = 'local-on-device';
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
