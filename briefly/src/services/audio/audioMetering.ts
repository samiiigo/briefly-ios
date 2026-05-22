const METERING_DB_FLOOR = -50;
/** Boost after linear map; values above 1 are clamped (less compression than a wide dB span alone). */
const METERING_DB_GAIN = 1.85;
/** PCM RMS multiplier — higher = more sensitive to normal speaking volume. */
const PCM_LEVEL_GAIN = 9;
/** Map expo-audio / AVAudioRecorder dB metering to 0…1 with boosted sensitivity. */
export function normalizeDbMetering(db: number): number {
  const clamped = Math.max(METERING_DB_FLOOR, Math.min(0, db));
  const linear = (clamped - METERING_DB_FLOOR) / -METERING_DB_FLOOR;
  return Math.min(1, linear * METERING_DB_GAIN);
}
/** RMS level from 16-bit little-endian PCM. */
export function pcmBufferToLevel(buffer: ArrayBuffer): number {
  const samples = new Int16Array(buffer);
  if (samples.length === 0) return 0;
  let sumSq = 0;
  for (let i = 0; i < samples.length; i++) {
    const n = samples[i] / 32768;
    sumSq += n * n;
  }
  const rms = Math.sqrt(sumSq / samples.length);
  return Math.min(1, rms * PCM_LEVEL_GAIN);
}
/** Fast attack, slower decay — keeps the waveform responsive but not jittery. */
export function smoothMeteringLevel(current: number, next: number, decay = 0.88): number {
  if (next >= current) return next;
  return current * decay;
}
