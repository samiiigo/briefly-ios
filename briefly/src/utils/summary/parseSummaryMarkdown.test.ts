import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  omitKeyPointsSection,
  omitRedundantSummaryHeading,
  parseSummaryMarkdown,
  prepareSummaryMarkdownBlocks,
} from './parseSummaryMarkdown';
describe('parseSummaryMarkdown', () => {
  it('parses headings, paragraphs, and bullets', () => {
    const blocks = parseSummaryMarkdown(
      '## Summary\n\nDiscussed **Q2 goals**.\n\n## Key points\n\n- Ship beta\n- Hire contractors',
    );
    assert.deepEqual(blocks, [
      { type: 'h2', text: 'Summary' },
      { type: 'p', text: 'Discussed **Q2 goals**.' },
      { type: 'h2', text: 'Key points' },
      { type: 'ul', items: ['Ship beta', 'Hire contractors'] },
    ]);
  });
  it('parses plain prose without markdown syntax', () => {
    assert.deepEqual(parseSummaryMarkdown('One sentence only.'), [
      { type: 'p', text: 'One sentence only.' },
    ]);
  });
});
describe('omitRedundantSummaryHeading', () => {
  it('removes a leading Summary h2', () => {
    const blocks = parseSummaryMarkdown('## Summary\n\nBody text.');
    assert.deepEqual(omitRedundantSummaryHeading(blocks), [{ type: 'p', text: 'Body text.' }]);
  });
  it('removes a leading Overview h2', () => {
    const blocks = parseSummaryMarkdown('## Overview\n\nTeam aligned on goals.');
    assert.deepEqual(omitRedundantSummaryHeading(blocks), [
      { type: 'p', text: 'Team aligned on goals.' },
    ]);
  });
});
describe('omitKeyPointsSection', () => {
  it('removes key points heading and following bullets', () => {
    const blocks = parseSummaryMarkdown(
      '## Summary\n\nOverview.\n\n## Key points\n\n- One\n- Two',
    );
    assert.deepEqual(omitKeyPointsSection(omitRedundantSummaryHeading(blocks)), [
      { type: 'p', text: 'Overview.' },
    ]);
  });
});
describe('prepareSummaryMarkdownBlocks', () => {
  it('strips key points when insights are shown separately', () => {
    const blocks = prepareSummaryMarkdownBlocks(
      '## Summary\n\nOverview.\n\n## Key points\n\n- One',
      { hasKeyInsights: true },
    );
    assert.deepEqual(blocks, [{ type: 'p', text: 'Overview.' }]);
  });
  it('strips leading Overview when used as the AI summary heading', () => {
    const blocks = prepareSummaryMarkdownBlocks(
      '## Overview\n\nDiscussed **Q2 goals**.\n\n### Goals\n\n- Ship beta',
      { hasKeyInsights: false },
    );
    assert.deepEqual(blocks, [
      { type: 'p', text: 'Discussed **Q2 goals**.' },
      { type: 'h3', text: 'Goals' },
      { type: 'ul', items: ['Ship beta'] },
    ]);
  });
  it('keeps key points in summary when there are no separate insights', () => {
    const blocks = prepareSummaryMarkdownBlocks(
      '## Summary\n\nOverview.\n\n## Key points\n\n- One',
      { hasKeyInsights: false },
    );
    assert.deepEqual(blocks, [
      { type: 'p', text: 'Overview.' },
      { type: 'h2', text: 'Key points' },
      { type: 'ul', items: ['One'] },
    ]);
  });
});
