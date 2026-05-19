/** Standard PCM WAV header size — keep in sync with recordingOptions.WAV_HEADER_BYTES. */
export const WAV_HEADER_BYTES = 44;

function readFourCc(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

/** True when RIFF chunk sizes under-report the PCM data (common with growing expo-audio WAV). */
export function wavHeaderNeedsRepair(bytes: Uint8Array, fileSize: number): boolean {
  if (bytes.length < WAV_HEADER_BYTES) return false;
  if (readFourCc(bytes, 0) !== 'RIFF' || readFourCc(bytes, 8) !== 'WAVE') return false;

  const actualDataSize = fileSize - WAV_HEADER_BYTES;
  if (actualDataSize <= 0) return false;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const declaredDataSize = view.getUint32(40, true);
  return declaredDataSize + 1024 < actualDataSize;
}

export function patchWavHeader(bytes: Uint8Array, fileSize: number): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setUint32(4, fileSize - 8, true);
  view.setUint32(40, fileSize - WAV_HEADER_BYTES, true);
}
