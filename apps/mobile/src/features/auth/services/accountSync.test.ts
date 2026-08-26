import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeFoldersByUpdatedAt, mergeRecordingsByUpdatedAt } from './accountSyncMerge';

describe('accountSync merge helpers', () => {
  it('keeps the newer recording by updatedAt', () => {
    const merged = mergeRecordingsByUpdatedAt(
      [
        {
          id: 'a',
          title: 'local',
          createdAt: 1,
          updatedAt: 10,
          duration: 1,
          filePath: '',
          fileSize: 0,
          processingMode: 'cloud-shared-openrouter',
          status: 'ready',
        },
      ],
      [
        {
          id: 'a',
          title: 'remote',
          createdAt: 1,
          updatedAt: 20,
          duration: 1,
          filePath: '',
          fileSize: 0,
          processingMode: 'cloud-shared-openrouter',
          status: 'ready',
        },
        {
          id: 'b',
          title: 'only-remote',
          createdAt: 2,
          updatedAt: 2,
          duration: 1,
          filePath: '',
          fileSize: 0,
          processingMode: 'cloud-shared-openrouter',
          status: 'ready',
        },
      ],
    );
    assert.equal(merged.length, 2);
    assert.equal(merged.find((r) => r.id === 'a')?.title, 'remote');
    assert.equal(merged.find((r) => r.id === 'b')?.title, 'only-remote');
  });

  it('keeps the newer folder by updatedAt', () => {
    const merged = mergeFoldersByUpdatedAt(
      [{ id: 'f1', name: 'Local', updatedAt: 5 }],
      [
        { id: 'f1', name: 'Remote', updatedAt: 9 },
        { id: 'f2', name: 'New', updatedAt: 1 },
      ],
    );
    assert.equal(merged.length, 2);
    assert.equal(merged.find((f) => f.id === 'f1')?.name, 'Remote');
  });
});
