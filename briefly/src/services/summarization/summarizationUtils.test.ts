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

  it('parses structured mainEmoji/title/overview/keyInsights/sections schema', () => {
    const result = parseJsonSummary(
      JSON.stringify({
        mainEmoji: '📊',
        title: '📊 Q2 planning sync',
        overview: 'Team aligned on **Q2 goals** and launch timing.',
        keyInsights: ['Ship beta by June', 'Focus on retention metrics'],
        sections: [
          {
            heading: '🎯 Goals',
            points: ['Prioritize onboarding', 'Defer mobile polish'],
          },
        ],
      }),
      'fallback text'
    );

    assert.match(result.summary, /## Overview/);
    assert.match(result.summary, /Team aligned on \*\*Q2 goals\*\*/);
    assert.match(result.summary, /### 🎯 Goals/);
    assert.match(result.summary, /- Prioritize onboarding/);
    assert.equal(result.keyInsights.length, 2);
    assert.equal(result.keyInsights[0].text, 'Ship beta by June');
    assert.equal(result.mainEmoji, '📊');
    assert.equal(result.title, '📊 Q2 planning sync');
  });

  it('parses legacy actionItems as key insights fallback', () => {
    const result = parseJsonSummary(
      JSON.stringify({
        overview: 'Quick sync.',
        actionItems: [{ owner: 'Alex', task: 'Send timeline doc' }],
      }),
      'fallback text'
    );

    assert.equal(result.keyInsights.length, 1);
    assert.equal(result.keyInsights[0].text, '**Alex**: Send timeline doc');
  });
});

describe('structuredSummaryToResult', () => {
  it('uses section points as key insights when keyInsights are empty', () => {
    const result = structuredSummaryToResult({
      overview: 'Quick standup.',
      sections: [{ heading: 'Updates', points: ['Backend deploy done'] }],
      keyInsights: [],
    });

    assert.equal(result.keyInsights.length, 1);
    assert.equal(result.keyInsights[0].text, 'Backend deploy done');
  });

  it('returns a sanitized title when present', () => {
    const result = structuredSummaryToResult({
      title: '  🎓 Lecture recap  ',
      overview: 'Covered chapter 4.',
      keyInsights: ['Exam moved to Friday'],
    });

    assert.equal(result.title, '🎓 Lecture recap');
  });
});
