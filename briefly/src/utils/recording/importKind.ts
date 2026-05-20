export type ImportKind = 'json-backup' | 'audio';

const AUDIO_EXTENSIONS = new Set([
  '.wav',
  '.m4a',
  '.mp4',
  '.mp3',
  '.caf',
  '.aac',
  '.mpeg',
  '.mpga',
  '.ogg',
  '.flac',
]);

export function extensionFromFilename(name: string): string {
  const match = name.trim().match(/(\.[a-z0-9]{2,5})$/i);
  return match?.[1]?.toLowerCase() ?? '';
}

export function detectImportKind(params: {
  name?: string | null;
  mimeType?: string | null;
}): ImportKind | null {
  const ext = extensionFromFilename(params.name ?? '');
  if (ext === '.json') return 'json-backup';

  const mime = (params.mimeType ?? '').toLowerCase();
  if (mime.includes('json')) return 'json-backup';
  if (mime.startsWith('audio/')) return 'audio';

  if (ext && AUDIO_EXTENSIONS.has(ext)) return 'audio';
  return null;
}

export function titleFromImportFilename(name: string): string | undefined {
  const base = name.trim().replace(/\.[^.]+$/, '').trim();
  return base || undefined;
}
