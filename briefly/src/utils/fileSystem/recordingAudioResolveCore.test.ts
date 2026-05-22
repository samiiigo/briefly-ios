import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveRecordingAudioOnDiskCore } from './recordingAudioResolveCore';
describe('resolveRecordingAudioOnDiskCore', () => {
  it('uses the stored path when it exists on disk', () => {
    const resolved = resolveRecordingAudioOnDiskCore(
      { id: 'rec-1', filePath: '/docs/rec-1.m4a', fileSize: 900 },
      {
        getPathInfo: (uri) =>
          uri === '/docs/rec-1.m4a'
            ? { exists: true, size: 1200, resolvedUri: '/docs/rec-1.m4a' }
            : { exists: false, size: 0, resolvedUri: uri },
        destFile: () => ({ exists: false, uri: '', size: 0 }),
      },
    );
    assert.deepEqual(resolved, { filePath: '/docs/rec-1.m4a', fileSize: 1200 });
  });
  it('falls back to the canonical documents filename when the stored path is stale', () => {
    const resolved = resolveRecordingAudioOnDiskCore(
      { id: 'rec-1', filePath: '/old/cache/rec-1.m4a', fileSize: 900 },
      {
        getPathInfo: (uri) => ({ exists: false, size: 0, resolvedUri: uri }),
        destFile: (id, source) =>
          id === 'rec-1'
            ? { exists: true, uri: 'file:///docs/rec-rec-1.m4a', size: 900 }
            : { exists: false, uri: source, size: 0 },
      },
    );
    assert.deepEqual(resolved, {
      filePath: 'file:///docs/rec-rec-1.m4a',
      fileSize: 900,
    });
  });
  it('treats a zero-byte size report as present when the file exists', () => {
    const resolved = resolveRecordingAudioOnDiskCore(
      { id: 'rec-1', filePath: '/docs/rec-1.m4a', fileSize: 0 },
      {
        getPathInfo: (uri) =>
          uri === '/docs/rec-1.m4a'
            ? { exists: true, size: 0, resolvedUri: '/docs/rec-1.m4a' }
            : { exists: false, size: 0, resolvedUri: uri },
        destFile: () => ({ exists: false, uri: '', size: 0 }),
      },
    );
    assert.deepEqual(resolved, { filePath: '/docs/rec-1.m4a', fileSize: 1 });
  });
  it('falls back to basename match under documents', () => {
    const resolved = resolveRecordingAudioOnDiskCore(
      { id: 'rec-1', filePath: '/old/rec-1.m4a', fileSize: 500 },
      {
        getPathInfo: (uri) => ({ exists: false, size: 0, resolvedUri: uri }),
        destFile: (_id, source) =>
          source === 'rec-1.m4a'
            ? { exists: true, uri: 'file:///docs/rec-1.m4a', size: 500 }
            : { exists: false, uri: '', size: 0 },
      },
    );
    assert.deepEqual(resolved, { filePath: 'file:///docs/rec-1.m4a', fileSize: 500 });
  });
});
