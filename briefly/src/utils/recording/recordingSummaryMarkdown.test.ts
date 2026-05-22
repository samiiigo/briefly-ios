import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Recording } from '@/types';
import { buildRecordingSummaryMarkdown } from './recordingSummaryMarkdown';
const baseRecording: Recording = {
  id: 'rec-1',
  title: 'Team Sync: Q2 Planning',
  createdAt: new Date('2026-05-01T15:30:00Z').getTime(),
  duration: 1842,
  filePath: '/audio/rec-1.m4a',
  fileSize: 1024,
  processingMode: 'cloud',
  status: 'ready',
  summary:
    '## Overview\n\nThe team aligned on Q2 priorities and ownership.\n\n### Timeline\n\n- Launch timeline moved to mid-June\n- Budget approved for two contractor roles',
  keyInsights: [
    { id: '1', text: 'Launch target: mid-June with phased rollout' },
    { id: '2', text: 'Hire two contractors for mobile polish' },
  ],
};
describe('buildRecordingSummaryMarkdown', () => {
  it('includes title, meta, insights, and multi-sentence summary bullets', () => {
    const md = buildRecordingSummaryMarkdown(baseRecording, { folderLabel: 'Work' });
    assert.match(md, /^# Team Sync: Q2 Planning/);
    assert.match(md, /\*\*Recorded:\*\*/);
    assert.match(md, /\*\*Folder:\*\* Work/);
    assert.match(md, /## Key insights/);
    assert.match(md, /- Launch target: mid-June/);
    assert.match(md, /## Summary/);
    assert.match(md, /The team aligned on Q2 priorities/);
    assert.match(md, /- Launch timeline moved to mid-June/);
    assert.match(md, /_Generated with Briefly_/);
  });
  it('keeps a single-sentence summary as prose', () => {
    const md = buildRecordingSummaryMarkdown({
      ...baseRecording,
      summary: 'One concise takeaway from the meeting.',
    });
    assert.match(md, /## Summary\n\nOne concise takeaway from the meeting/);
    assert.match(md, /## Key insights/);
    assert.ok(md.indexOf('## Key insights') < md.indexOf('## Summary'));
  });
  it('can include transcript segments', () => {
    const md = buildRecordingSummaryMarkdown(
      {
        ...baseRecording,
        transcript: [
          {
            id: 't1',
            text: 'Hello team.',
            startTime: 0,
            endTime: 3,
            isFinal: true,
          },
        ],
      },
      { includeTranscript: true },
    );
    assert.match(md, /## Transcript/);
    assert.match(md, /Hello team\./);
  });
});
