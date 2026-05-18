import { File, Paths } from 'expo-file-system';
import { logger } from '@/utils/logging/logger';
import { normalizeFileUri } from './normalizeFileUri';
import { patchWavHeader, wavHeaderNeedsRepair, WAV_HEADER_BYTES } from './repairWavHeaderCore';

function writePatchedWav(target: File, patched: Uint8Array): void {
  if (!target.exists) {
    target.create({ overwrite: true, intermediates: true });
  }
  target.write(patched);
}

/**
 * Returns a URI suitable for AssemblyAI upload. Repairs WAV headers when needed
 * (live recordings often finalize with incorrect chunk sizes in the header).
 */
export async function ensureUploadableAudioUri(audioUri: string): Promise<string> {
  if (!audioUri.toLowerCase().endsWith('.wav')) {
    return audioUri;
  }

  const source = new File(normalizeFileUri(audioUri));
  if (!source.exists) {
    return audioUri;
  }

  const fileSize = source.size ?? 0;
  if (fileSize <= WAV_HEADER_BYTES) {
    return audioUri;
  }

  const bytes = await source.bytes();
  if (!wavHeaderNeedsRepair(bytes, fileSize)) {
    return audioUri;
  }

  const declaredDataSize = new DataView(bytes.buffer, bytes.byteOffset).getUint32(40, true);
  logger.info('AUDIO', 'Repairing WAV header before AssemblyAI upload', {
    audioUri,
    fileSize,
    declaredDataSize,
    actualDataSize: fileSize - WAV_HEADER_BYTES,
  });

  const patched = new Uint8Array(bytes);
  patchWavHeader(patched, fileSize);

  try {
    writePatchedWav(source, patched);
    return source.uri;
  } catch (inPlaceError) {
    logger.warn('AUDIO', 'In-place WAV repair failed; writing repaired copy to cache', {
      audioUri,
      error: inPlaceError instanceof Error ? inPlaceError.message : String(inPlaceError),
    });
  }

  const dest = new File(Paths.cache, `assemblyai-upload-${Date.now()}.wav`);
  writePatchedWav(dest, patched);
  logger.info('AUDIO', 'Repaired WAV written to cache for upload', { destUri: dest.uri });
  return dest.uri;
}
