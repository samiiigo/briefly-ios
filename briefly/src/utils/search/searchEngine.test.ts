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

  it('matches recordings by month name', () => {
    const may18 = new Date(2026, 4, 18, 14, 0, 0).getTime();
    const april10 = new Date(2026, 3, 10, 9, 0, 0).getTime();
    const dated = [
      mkRecording('may', { title: 'Morning standup', createdAt: may18 }),
      mkRecording('apr', { title: 'Design sync', createdAt: april10 }),
    ];
    const { recordings: mayHits } = runSearch('may', 'all', dated);
    assert.deepEqual(mayHits.map((r) => r.id), ['may']);
  });

  it('matches recordings by month and day', () => {
    const may18 = new Date(2026, 4, 18, 14, 0, 0).getTime();
    const may20 = new Date(2026, 4, 20, 10, 0, 0).getTime();
    const dated = [
      mkRecording('a', { title: 'Note A', createdAt: may18 }),
      mkRecording('b', { title: 'Note B', createdAt: may20 }),
    ];
    const { recordings: hits } = runSearch('may 18', 'all', dated);
    assert.deepEqual(hits.map((r) => r.id), ['a']);
  });

  it('matches recordings by numeric month/day', () => {
    const may18 = new Date(2026, 4, 18, 14, 0, 0).getTime();
    const dated = [mkRecording('a', { title: 'Note A', createdAt: may18 })];
    const { recordings: hits } = runSearch('5/18', 'all', dated);
    assert.deepEqual(hits.map((r) => r.id), ['a']);
  });
});
