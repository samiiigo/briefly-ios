import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Recording, UserFolder } from '@/types';
import { runSearch } from './searchIndex';

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

describe('search engine', () => {
  const userFolders: UserFolder[] = [{ id: 'uf_ui', name: 'UI Kit' }];
  const recordings: Recording[] = [
    mkRecording('1', { title: 'Design review', summary: 'Talked about layout' }),
    mkRecording('2', { title: 'Standup', isFavorite: true }),
    mkRecording('3', { title: 'Old notes', isArchived: true }),
    mkRecording('4', { title: 'Deleted', deletedAt: Date.now() }),
    mkRecording('5', {
      title: 'Transcript hit',
      transcript: [{ id: 't1', text: 'mentions kk patterns', startTime: 0, endTime: 1, isFinal: true }],
    }),
  ];
  it('matches folder names case-insensitively', () => {
    const { folders: hits } = runSearch('ui', 'all', recordings, userFolders);
    assert.ok(hits.some((f) => f.id === 'uf_ui'));
  });

  it('respects favorites filter scope', () => {
    const { recordings: hits } = runSearch('stand', 'favorites', recordings, userFolders);
    assert.deepEqual(hits.map((r) => r.id), ['2']);
  });

  it('excludes deleted recordings from all scope', () => {
    const { recordings: hits } = runSearch('deleted', 'all', recordings, userFolders);
    assert.equal(hits.length, 0);
  });

  it('matches transcript content', () => {
    const { recordings: hits } = runSearch('kk', 'all', recordings, userFolders);
    assert.deepEqual(hits.map((r) => r.id), ['5']);
  });

  it('returns empty results for blank query', () => {
    const result = runSearch('   ', 'all', recordings, userFolders);
    assert.deepEqual(result, { folders: [], recordings: [] });
  });
});
