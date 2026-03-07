import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Recording } from '../types';
import { folderFlagsFor, resolveRecordingFolder } from './recordingFolder';

function mkRecording(overrides: Partial<Recording> = {}): Recording {
  return {
    id: 'r1',
    title: 'Test',
    createdAt: Date.now(),
    duration: 10,
    filePath: '/tmp/test.m4a',
    fileSize: 123,
    processingMode: 'cloud',
    status: 'ready',
    ...overrides,
  };
}

describe('recording folder helpers', () => {
  it('resolves explicit folder first', () => {
    const recording = mkRecording({ folder: 'favorites', isArchived: true });
    assert.equal(resolveRecordingFolder(recording), 'favorites');
  });

  it('falls back to archived/favorite flags for legacy recordings', () => {
    assert.equal(resolveRecordingFolder(mkRecording({ isArchived: true })), 'archived');
    assert.equal(resolveRecordingFolder(mkRecording({ isFavorite: true })), 'favorites');
  });

  it('defaults to unlisted when no folder metadata exists', () => {
    assert.equal(resolveRecordingFolder(mkRecording()), 'unlisted');
  });

  it('maps folder to persisted flags consistently', () => {
    assert.deepEqual(folderFlagsFor('favorites'), {
      folder: 'favorites',
      isFavorite: true,
      isArchived: false,
    });
    assert.deepEqual(folderFlagsFor('archived'), {
      folder: 'archived',
      isFavorite: false,
      isArchived: true,
    });
  });
});
