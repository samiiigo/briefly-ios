import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Recording } from '@/types';
import {
  applyFavoritesOnlyFilter,
  filterRecordingsForFolder,
} from './filterFolderRecordings';
const rec = (partial: Partial<Recording> & Pick<Recording, 'id'>): Recording => ({
  title: 'T',
  createdAt: 0,
  duration: 1,
  filePath: '/a.wav',
  fileSize: 1,
  processingMode: 'cloud-shared-openrouter',
  status: 'ready',
  ...partial,
});
describe('filterRecordingsForFolder', () => {
  it('returns favorites for built-in favorites folder', () => {
    const recordings = [
      rec({ id: '1', isFavorite: true }),
      rec({ id: '2', isFavorite: false }),
    ];
    const out = filterRecordingsForFolder(recordings, 'favorites', 'built-in');
    assert.equal(out.length, 1);
    assert.equal(out[0].id, '1');
  });
  it('returns recordings in a user folder', () => {
    const recordings = [
      rec({ id: '1', userFolderId: 'uf1' }),
      rec({ id: '2', userFolderId: 'uf2' }),
    ];
    const out = filterRecordingsForFolder(recordings, 'uf1', 'user');
    assert.equal(out.length, 1);
    assert.equal(out[0].id, '1');
  });
});
describe('applyFavoritesOnlyFilter', () => {
  it('skips filter for recently deleted folder', () => {
    const recordings = [rec({ id: '1', isFavorite: false })];
    const out = applyFavoritesOnlyFilter(recordings, true, true);
    assert.equal(out.length, 1);
  });
});
