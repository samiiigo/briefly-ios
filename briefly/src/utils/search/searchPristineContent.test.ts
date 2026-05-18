import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Recording } from '@/types';
import { buildSearchCatalog } from './searchIndex';
import { filterRecentQueriesWithHits } from './searchPristineContent';

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

describe('filterRecentQueriesWithHits', () => {
  const recordings = [
    mkRecording('1', { title: 'Alpha note' }),
    mkRecording('2', { title: 'Beta favorite', isFavorite: true }),
  ];
  const catalog = buildSearchCatalog([], recordings);

  it('keeps terms with recording hits', () => {
    const filtered = filterRecentQueriesWithHits(['beta', 'alpha'], catalog);
    assert.deepEqual(filtered, ['beta', 'alpha']);
  });

  it('drops terms with no hits', () => {
    const filtered = filterRecentQueriesWithHits(['beta', 'zzz'], catalog);
    assert.deepEqual(filtered, ['beta']);
  });

  it('keeps terms with folder name matches', () => {
    const withFolders = buildSearchCatalog([{ id: 'f1', name: 'Design' }], recordings);
    const filtered = filterRecentQueriesWithHits(['design', 'zzz'], withFolders);
    assert.deepEqual(filtered, ['design']);
  });

  it('returns all terms when scoping is deferred', () => {
    const filtered = filterRecentQueriesWithHits(['alpha', 'zzz'], catalog, {
      scopeRecents: false,
    });
    assert.deepEqual(filtered, ['alpha', 'zzz']);
  });
});
