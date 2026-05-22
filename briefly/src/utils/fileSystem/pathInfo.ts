import { File, Paths } from 'expo-file-system';
import { normalizeFileUri } from './normalizeFileUri';
export { normalizeFileUri } from './normalizeFileUri';
export type PathInfo = {
  exists: boolean;
  size: number;
  /** URI to pass to playback/upload when the file was found (may differ from input). */
  resolvedUri: string;
};
function probeFileUri(candidate: string): PathInfo | null {
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  const file = new File(normalizeFileUri(trimmed));
  if (file.exists) {
    return { exists: true, size: file.size ?? 0, resolvedUri: file.uri };
  }
  return null;
}
export function getPathInfo(uri: string): PathInfo {
  const trimmed = uri.trim();
  if (!trimmed) {
    return { exists: false, size: 0, resolvedUri: trimmed };
  }
  const candidates = [trimmed, normalizeFileUri(trimmed)];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const hit = probeFileUri(candidate);
    if (hit) return hit;
  }
  const basename = trimmed.split('/').pop()?.split('?')[0] ?? '';
  if (basename) {
    const docFile = new File(Paths.document, basename);
    if (docFile.exists) {
      return { exists: true, size: docFile.size ?? 0, resolvedUri: docFile.uri };
    }
  }
  return { exists: false, size: 0, resolvedUri: trimmed };
}
export function deletePath(uri: string): void {
  const file = new File(normalizeFileUri(uri));
  if (file.exists) {
    file.delete();
  }
}
export function copyToDocumentDirectory(fromUri: string, filename: string): string {
  const source = new File(normalizeFileUri(fromUri));
  const dest = new File(Paths.document, filename);
  source.copy(dest);
  return dest.uri;
}
