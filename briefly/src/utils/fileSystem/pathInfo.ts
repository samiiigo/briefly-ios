import { File, Paths } from 'expo-file-system';
import { normalizeFileUri } from './normalizeFileUri';

export { normalizeFileUri } from './normalizeFileUri';

export function getPathInfo(uri: string): { exists: boolean; size: number } {
  const file = new File(normalizeFileUri(uri));
  return { exists: file.exists, size: file.size ?? 0 };
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
