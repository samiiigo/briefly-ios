import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Recording } from '../types';
import { countByLibraryTab, filterByLibraryTab } from './libraryFilters';

function mkRecording(id: string, overrides: Partial<Recording> = {}): Recording {
  return {
    id,
    title: `Recording ${id}`,
    createdAt: Date.now(),
    duration: 20,
    filePath: `/tmp/${id}.m4a`,
    fileSize: 200,
    processingMode: 'cloud',
    status: 'ready',
    ...overrides,
  };
}

describe('library filters', () => {
  const recordings: Recording[] = [
    mkRecording('1', { folder: 'unlisted', status: 'ready' }),
    mkRecording('2', { folder: 'favorites', status: 'ready' }),
    mkRecording('3', { folder: 'archived', status: 'ready' }),
    mkRecording('4', { folder: 'unlisted', status: 'transcribing' }),
    mkRecording('5', { folder: 'unlisted', status: 'error' }),
  ];

  it('counts all tabs from source state', () => {
    assert.deepEqual(countByLibraryTab(recordings), {
      all: 5,
      active: 3,
      favorites: 1,
      archived: 1,
      processing: 1,
      errors: 1,
    });
  });

  it('filters archived and favorites correctly', () => {
    assert.deepEqual(filterByLibraryTab(recordings, 'favorites').map((r) => r.id), ['2']);
    assert.deepEqual(filterByLibraryTab(recordings, 'archived').map((r) => r.id), ['3']);
  });
});
