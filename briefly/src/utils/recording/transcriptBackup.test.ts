import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Recording } from '@/types';
import {
  buildTranscriptBackupFile,
  hasExportableTranscriptContent,
  parseTranscriptBackupJson,
  serializeTranscriptBackupFile,
  TRANSCRIPT_BACKUP_FORMAT,
} from './transcriptBackup';
const baseRecording: Recording = {
  id: 'rec-1',
  title: 'Standup',
  createdAt: 1_700_000_000_000,
  duration: 600,
  filePath: '/audio/rec-1.m4a',
  fileSize: 1024,
  processingMode: 'cloud',
  status: 'ready',
  transcript: [
    {
      id: 's1',
      text: 'Shipped the beta.',
      startTime: 0,
      endTime: 5,
      isFinal: true,
    },
  ],
  summary: '## Summary\n\nBeta shipped.',
};
describe('transcriptBackup', () => {
  it('detects exportable library items', () => {
    assert.equal(hasExportableTranscriptContent(baseRecording), true);
    assert.equal(
      hasExportableTranscriptContent({ ...baseRecording, deletedAt: Date.now() }),
      false,
    );
    assert.equal(
      hasExportableTranscriptContent({
        ...baseRecording,
        transcript: [],
        summary: undefined,
        keyInsights: undefined,
      }),
      false,
    );
  });
  it('round-trips backup JSON', () => {
    const file = buildTranscriptBackupFile([baseRecording]);
    assert.equal(file.format, TRANSCRIPT_BACKUP_FORMAT);
    assert.equal(file.recordings.length, 1);
    assert.equal(file.recordings[0]?.title, 'Standup');
    const json = serializeTranscriptBackupFile(file);
    const entries = parseTranscriptBackupJson(json);
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.title, 'Standup');
    assert.equal(entries[0]?.transcript?.[0]?.text, 'Shipped the beta.');
  });
  it('accepts a raw recordings array', () => {
    const entries = parseTranscriptBackupJson(
      JSON.stringify([
        {
          title: 'Notes',
          createdAt: 1,
          duration: 0,
          summary: 'Imported summary only.',
        },
      ]),
    );
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.summary, 'Imported summary only.');
  });
});
