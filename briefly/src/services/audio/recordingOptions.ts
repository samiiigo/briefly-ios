/**
 * Recording options tuned for speech transcription (AssemblyAI).
 * Linear PCM WAV at 16 kHz mono avoids M4A containers that can finalize
 * without decodable audio in Expo Go.
 */

import { IOSOutputFormat, AudioQuality } from 'expo-audio';
import type { RecordingOptions } from 'expo-audio';

export const ASSEMBLY_AI_SAMPLE_RATE = 16000;

/** WAV header size — first PCM poll must skip this many bytes. */
export const WAV_HEADER_BYTES = 44;

export const assemblyAIRecordingOptions: RecordingOptions = {
  extension: '.wav',
  sampleRate: ASSEMBLY_AI_SAMPLE_RATE,
  numberOfChannels: 1,
  bitRate: ASSEMBLY_AI_SAMPLE_RATE * 16,
  isMeteringEnabled: true,
  ios: {
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.MAX,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  android: {
    outputFormat: 'default' as const,
    audioEncoder: 'default' as const,
  },
  web: {},
};
