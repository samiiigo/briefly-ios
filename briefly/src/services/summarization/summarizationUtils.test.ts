import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeSummarizationResult, parseJsonSummary } from './summarizationUtils';

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
});
