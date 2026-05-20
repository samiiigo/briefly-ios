import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Recording } from '@/types';
import {
  backupEntryFingerprint,
  filterNewBackupEntries,
  findDuplicateAudioRecording,
  recordingImportFingerprint,
} from './importDeduplication';
import type { TranscriptBackupEntry } from './transcriptBackup';

const existing: Recording = {
  id: 'rec-1',
  title: 'Standup',
  createdAt: 1_700_000_000_000,
  duration: 600,
  filePath: '/audio/rec-1.m4a',
  fileSize: 1_024_000,
  processingMode: 'cloud',
  status: 'ready',
  transcript: [
    { id: 's1', text: 'Shipped the beta.', startTime: 0, endTime: 5, isFinal: true },
  ],
  summary: 'Beta shipped.',
};

describe('importDeduplication', () => {
  it('skips backup entries that match library content', () => {
    const incoming: TranscriptBackupEntry[] = [
      {
        title: 'Standup copy',
        createdAt: Date.now(),
        duration: 120,
        transcript: existing.transcript,
        summary: existing.summary,
      },
      {
        title: 'New note',
        createdAt: Date.now(),
        duration: 60,
        summary: 'Only in the backup file.',
      },
    ];

    const { entries, skipped } = filterNewBackupEntries(incoming, [existing]);
    assert.equal(skipped, 1);
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.title, 'New note');
  });

  it('skips duplicate rows within the same backup file', () => {
    const row: TranscriptBackupEntry = {
      title: 'A',
      createdAt: 1,
      duration: 0,
      summary: 'Same text.',
    };
    const { entries, skipped } = filterNewBackupEntries([row, { ...row, title: 'B' }], []);
    assert.equal(skipped, 1);
    assert.equal(entries.length, 1);
    assert.equal(backupEntryFingerprint(row), backupEntryFingerprint(entries[0]!));
  });

  it('detects duplicate audio by size and duration', () => {
    assert.ok(
      findDuplicateAudioRecording([existing], {
        fileSize: existing.fileSize,
        durationSec: existing.duration,
      }),
    );
    assert.equal(
      findDuplicateAudioRecording([existing], {
        fileSize: existing.fileSize,
        durationSec: existing.duration + 1,
      })?.id,
      existing.id,
    );
    assert.equal(
      findDuplicateAudioRecording([existing], {
        fileSize: existing.fileSize + 1,
        durationSec: existing.duration,
      }),
      undefined,
    );
  });

  it('does not treat transcript-only rows as audio duplicates', () => {
    const transcriptOnly: Recording = {
      ...existing,
      id: 'rec-2',
      filePath: '',
      fileSize: 0,
    };
    assert.equal(
      findDuplicateAudioRecording([transcriptOnly], {
        fileSize: 1_024_000,
        durationSec: 600,
      }),
      undefined,
    );
  });
});
