import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Recording } from '@/types';
import { countByLibraryTab, filterByLibraryTab } from './libraryFilters';

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

describe('library filters', () => {
  const recordings: Recording[] = [
    mkRecording('1', { status: 'ready' }),
    mkRecording('2', { isFavorite: true, status: 'ready' }),
    mkRecording('3', { isArchived: true, status: 'ready' }),
    mkRecording('4', { status: 'transcribing' }),
    mkRecording('5', { status: 'error' }),
  ];

  it('counts all tabs from source state', () => {
    assert.deepEqual(countByLibraryTab(recordings), {
      all: 5,
      active: 3,
      favorites: 1,
      archived: 1,
      errors: 1,
    });
  });

  it('filters archived and favorites correctly', () => {
    assert.deepEqual(filterByLibraryTab(recordings, 'favorites').map((r) => r.id), ['2']);
    assert.deepEqual(filterByLibraryTab(recordings, 'archived').map((r) => r.id), ['3']);
  });

  it('excludes archived recordings from errors tab (archived is a separate bucket)', () => {
    const withArchivedError = [
      ...recordings,
      mkRecording('6', { folder: 'archived', status: 'error' }),
    ];
    assert.deepEqual(filterByLibraryTab(withArchivedError, 'errors').map((r) => r.id), ['5']);
    assert.deepEqual(filterByLibraryTab(withArchivedError, 'archived').map((r) => r.id), ['3', '6']);
  });

  it('excludes recently-deleted recordings from all library tabs', () => {
    const withDeleted = [
      ...recordings,
      mkRecording('6', { deletedAt: Date.now() }),
    ];
    assert.equal(filterByLibraryTab(withDeleted, 'all').length, 5);
    assert.deepEqual(filterByLibraryTab(withDeleted, 'active').map((r) => r.id), ['1', '4', '5']);
  });
});
