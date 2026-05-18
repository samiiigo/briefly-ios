import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Recording } from '@/types';
import { buildSearchCatalog } from './searchIndex';
import { filterRecentQueriesForFilter } from './searchPristineContent';

function mkRecording(id: string, overrides: Partial<Recording> = {}): Recording {
  return {
    id,
    title: `Recording ${id}`,
    createdAt: Date.now(),
    duration: 20,
    filePath: `/tmp/${id}.m4a`,
    fileSize: 200,
    processingMode: 'cloud-user-key',
    status: 'ready',
    ...overrides,
  };
}

describe('filterRecentQueriesForFilter', () => {
  const recordings = [
    mkRecording('1', { title: 'Alpha note' }),
    mkRecording('2', { title: 'Beta favorite', isFavorite: true }),
  ];
  const catalog = buildSearchCatalog([], recordings);

  it('keeps terms with hits in the active filter scope', () => {
    const filtered = filterRecentQueriesForFilter(['beta', 'alpha'], 'favorites', catalog);
    assert.deepEqual(filtered, ['beta']);
  });

  it('keeps terms with folder name matches', () => {
    const withFolders = buildSearchCatalog([{ id: 'f1', name: 'Design' }], recordings);
    const filtered = filterRecentQueriesForFilter(['design', 'zzz'], 'all', withFolders);
    assert.deepEqual(filtered, ['design']);
  });
});
