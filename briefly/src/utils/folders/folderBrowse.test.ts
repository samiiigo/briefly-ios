import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildFolderSections } from './folderBrowse';
import type { Recording } from '@/types';

function mkRecording(id: string, createdAt: number): Recording {
  return {
    id,
    title: id,
    createdAt,
    fileSize: 1,
    status: 'ready',
    processingMode: 'on-device',
  } as Recording;
}

/** Fixed local mid-day timestamps so labels stay Today / Yesterday. */
function todayTs(hour = 12): number {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

function yesterdayTs(hour = 12): number {
  return todayTs(hour) - 24 * 60 * 60 * 1000;
}

describe('buildFolderSections section order', () => {
  it('flips Today/Yesterday when date sort is ascending', () => {
    const recordings = [
      mkRecording('today', todayTs()),
      mkRecording('yesterday', yesterdayTs()),
    ];
    const desc = buildFolderSections(recordings, {
      layout: 'list',
      sortField: 'date',
      sortDirection: 'desc',
      favoritesOnly: false,
    });
    const asc = buildFolderSections(recordings, {
      layout: 'list',
      sortField: 'date',
      sortDirection: 'asc',
      favoritesOnly: false,
    });

    assert.deepEqual(
      desc.map((s) => s.title),
      ['Today', 'Yesterday']
    );
    assert.deepEqual(
      asc.map((s) => s.title),
      ['Yesterday', 'Today']
    );
  });
});
