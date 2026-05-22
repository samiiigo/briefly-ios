import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Recording } from '@/types';
import { buildRecordingExportPdfHtml, buildRecordingExportPlainText } from './recordingExport';
const baseRecording: Recording = {
  id: 'rec-1',
  title: 'Team Sync: Q2 Planning',
  createdAt: new Date('2026-05-01T15:30:00Z').getTime(),
  duration: 1842,
  filePath: '/audio/rec-1.m4a',
  fileSize: 1024,
  processingMode: 'cloud',
  status: 'ready',
  summary: '## Overview\n\nTeam aligned on **Q2 goals**.\n\n### Goals\n\n- Ship beta by June',
  keyInsights: [
    { id: '1', text: '**Alex**: Send timeline doc' },
    { id: '2', text: 'Hire two contractors' },
  ],
};
describe('buildRecordingExportPlainText', () => {
  it('renders key insights in their own section before summary', () => {
    const text = buildRecordingExportPlainText(baseRecording);
    const insightsIndex = text.indexOf('Key insights');
    const summaryIndex = text.indexOf('Summary');
    const titleIndex = text.indexOf('Team Sync');
    assert.ok(titleIndex < insightsIndex);
    assert.ok(insightsIndex < summaryIndex);
    assert.match(text, /\*\*Alex\*\*: Send timeline doc/);
    assert.match(text, /• Hire two contractors/);
    assert.match(text, /Team aligned on \*\*Q2 goals\*\*/);
    assert.match(text, /• Ship beta by June/);
    assert.doesNotMatch(text, /\nTranscript\n/);
  });
});
describe('buildRecordingExportPdfHtml', () => {
  it('renders key insights in a card and summary without a card', () => {
    const html = buildRecordingExportPdfHtml(baseRecording);
    const insightsIndex = html.indexOf('>Key insights<');
    const summaryIndex = html.indexOf('>Summary<');
    const titleIndex = html.indexOf('doc-title');
    const insightsCardStart = html.indexOf('class="summary-card">', insightsIndex);
    const summaryCardAfterSummary = html.indexOf('class="summary-card">', summaryIndex);
    assert.ok(titleIndex < insightsIndex);
    assert.ok(insightsIndex < summaryIndex);
    assert.ok(insightsCardStart > insightsIndex && insightsCardStart < summaryIndex);
    assert.equal(summaryCardAfterSummary, -1);
    assert.match(html, /<strong>Alex<\/strong>/);
    assert.match(html, /Ship beta by June/);
    assert.doesNotMatch(html, />Transcript</);
    assert.doesNotMatch(html, /class="segment"/);
    assert.match(html, /@page\s*\{\s*margin:\s*48px/);
  });
});
