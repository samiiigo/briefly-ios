import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeSummarizationResult,
  parseJsonSummary,
  structuredSummaryToResult,
} from './summarizationUtils';

describe('summarization result normalization', () => {
  it('keeps a valid summary and trims insight text', () => {
    const result = normalizeSummarizationResult(
      {
        summary: '  Final summary.  ',
        keyInsights: [
          { id: '1', text: '  Decision made  ' },
          { id: '2', text: '   ' },
        ],
      },
      'fallback source text'
    );

    assert.equal(result.summary, 'Final summary.');
    assert.equal(result.keyInsights.length, 1);
    assert.equal(result.keyInsights[0].text, 'Decision made');
  });

  it('falls back when summary is empty', () => {
    const result = normalizeSummarizationResult(
      {
        summary: '   ',
        keyInsights: [{ id: '1', text: 'Ignored because summary is empty' }],
      },
      'This fallback transcript sentence should appear in the generated summary output.'
    );

    assert.ok(result.summary.length > 0);
  });
});

describe('JSON summary parsing', () => {
  it('parses markdown fenced JSON payloads', () => {
    const result = parseJsonSummary(
      '```json\n{"summary":"Done.","keyInsights":["Point A","Point B"]}\n```',
      'fallback text'
    );

    assert.equal(result.summary, 'Done.');
    assert.deepEqual(
      result.keyInsights.map((insight) => insight.text),
      ['Point A', 'Point B']
    );
  });

  it('preserves markdown in the summary field', () => {
    const markdown = '## Summary\n\nDiscussed **Q2 goals**.\n\n## Key points\n\n- Ship beta';
    const result = parseJsonSummary(
      JSON.stringify({ summary: markdown, keyInsights: ['Action item'] }),
      'fallback text'
    );

    assert.equal(result.summary, markdown);
  });

  it('parses structured title/overview/sections/actionItems schema', () => {
    const result = parseJsonSummary(
      JSON.stringify({
        title: '📊 Q2 planning sync',
        overview: 'Team aligned on **Q2 goals** and launch timing.',
        sections: [
          {
            heading: '🎯 Goals',
            points: ['Ship beta by June', 'Focus on retention'],
          },
        ],
        actionItems: [{ owner: 'Alex', task: 'Send timeline doc' }],
      }),
      'fallback text'
    );

    assert.match(result.summary, /## Overview/);
    assert.match(result.summary, /Team aligned on \*\*Q2 goals\*\*/);
    assert.match(result.summary, /### 🎯 Goals/);
    assert.match(result.summary, /- Ship beta by June/);
    assert.equal(result.keyInsights.length, 1);
    assert.equal(result.keyInsights[0].text, '**Alex**: Send timeline doc');
  });
});

describe('structuredSummaryToResult', () => {
  it('uses section points as key insights when there are no action items', () => {
    const result = structuredSummaryToResult({
      overview: 'Quick standup.',
      sections: [{ heading: 'Updates', points: ['Backend deploy done'] }],
      actionItems: [],
    });

    assert.equal(result.keyInsights.length, 1);
    assert.equal(result.keyInsights[0].text, 'Backend deploy done');
  });
});
