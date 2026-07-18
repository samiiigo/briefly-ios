/**
 * Transcription audio constants
 *
 * Kept free of expo-audio / react-native so Node tests and cloud transcription
 * can share thresholds without loading the native recording stack.
 */
/** WAV header size — first PCM poll must skip this many bytes. */
export const WAV_HEADER_BYTES = 44;
/** ~0.25 s of 16 kHz mono PCM — below this, AssemblyAI often rejects the file. */
export const MIN_TRANSCRIPTION_AUDIO_BYTES = WAV_HEADER_BYTES + 8000;
