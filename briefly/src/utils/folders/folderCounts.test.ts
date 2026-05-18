import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Recording } from '@/types';
import { computeLibraryFolderCounts } from './folderCounts';

function mkRecording(overrides: Partial<Recording> = {}): Recording {
  return {
    id: 'r1',
    title: 'Test',
    createdAt: Date.now(),
    duration: 10,
    filePath: '/tmp/test.m4a',
    fileSize: 123,
    processingMode: 'cloud-user-key',
    status: 'ready',
    ...overrides,
  };
}

describe('computeLibraryFolderCounts', () => {
  it('counts built-in and user folders in one pass', () => {
    const counts = computeLibraryFolderCounts([
      mkRecording({ id: '1', folder: 'unlisted' }),
      mkRecording({ id: '2', folder: 'unlisted', isFavorite: true }),
      mkRecording({ id: '3', folder: 'unlisted', isImported: true, userFolderId: 'uf1' }),
      mkRecording({ id: '4', isArchived: true, folder: 'archived' }),
      mkRecording({ id: '5', deletedAt: Date.now() }),
    ]);

    assert.equal(counts.all, 5);
    assert.equal(counts.unlisted, 3);
    assert.equal(counts.favorites, 1);
    assert.equal(counts.imports, 1);
    assert.equal(counts.archived, 1);
    assert.equal(counts.recentlyDeleted, 1);
    assert.equal(counts.byUserFolderId.get('uf1'), 1);
  });
});
