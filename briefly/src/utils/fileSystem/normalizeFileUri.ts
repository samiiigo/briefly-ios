/** Normalizes recorder URIs for expo-file-system `File` on iOS and Android. */
export function normalizeFileUri(uri: string): string {
  const trimmed = uri.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('file://')) return trimmed;
  if (trimmed.startsWith('/')) return `file://${trimmed}`;
  return trimmed;
}
