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
    processingMode: 'cloud-user-key',
    status: 'ready',
    ...overrides,
  };
}

describe('recording folder helpers', () => {
  it('resolves recently-deleted first when deletedAt is set', () => {
    assert.equal(resolveRecordingFolder(mkRecording({ deletedAt: Date.now() })), 'recently-deleted');
  });

  it('resolves archived bucket when isArchived is true', () => {
    assert.equal(resolveRecordingFolder(mkRecording({ isArchived: true })), 'archived');
  });

  it('defaults to unlisted when no folder metadata exists', () => {
    assert.equal(resolveRecordingFolder(mkRecording()), 'unlisted');
  });

  it('ignores legacy favorites folder and treats it as unlisted', () => {
    const recording = mkRecording({ folder: 'favorites' as any, isFavorite: true });
    assert.equal(resolveRecordingFolder(recording), 'unlisted');
  });

  it('maps folder to persisted flags consistently', () => {
    assert.deepEqual(folderFlagsFor('archived'), {
      folder: 'archived',
      isFavorite: false,
      isArchived: true,
      deletedAt: undefined,
    });
  });

  it('folderFlagsFor(recently-deleted) sets deletedAt and clears folder flags', () => {
    const out = folderFlagsFor('recently-deleted');
    assert.equal(out.folder, 'unlisted');
    assert.equal(out.isFavorite, false);
    assert.equal(out.isArchived, false);
    assert.ok(typeof out.deletedAt === 'number' && out.deletedAt > 0);
  });
});
