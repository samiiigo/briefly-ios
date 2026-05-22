import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Recording } from '@/types';
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
      isImported: false,
      isArchived: true,
      deletedAt: undefined,
    });
  });
  it('preserves isFavorite when moving buckets if current recording is passed', () => {
    assert.deepEqual(folderFlagsFor('archived', { isFavorite: true }), {
      folder: 'archived',
      isFavorite: true,
      isImported: false,
      isArchived: true,
      deletedAt: undefined,
    });
    assert.deepEqual(folderFlagsFor('unlisted', { isFavorite: true }), {
      folder: 'unlisted',
      isFavorite: true,
      isImported: false,
      isArchived: false,
      deletedAt: undefined,
    });
  });
  it('preserves isImported when moving buckets if current recording is passed', () => {
    assert.deepEqual(folderFlagsFor('archived', { isImported: true }), {
      folder: 'archived',
      isFavorite: false,
      isImported: true,
      isArchived: true,
      deletedAt: undefined,
    });
  });
  it('folderFlagsFor(recently-deleted) sets deletedAt; isFavorite defaults false without current', () => {
    const out = folderFlagsFor('recently-deleted');
    assert.equal(out.folder, 'unlisted');
    assert.equal(out.isFavorite, false);
    assert.equal(out.isImported, false);
    assert.equal(out.isArchived, false);
    assert.ok(typeof out.deletedAt === 'number' && out.deletedAt > 0);
  });
  it('folderFlagsFor(recently-deleted) preserves isFavorite when current is passed', () => {
    const out = folderFlagsFor('recently-deleted', { isFavorite: true });
    assert.equal(out.isFavorite, true);
    assert.ok(typeof out.deletedAt === 'number' && out.deletedAt > 0);
  });
});
