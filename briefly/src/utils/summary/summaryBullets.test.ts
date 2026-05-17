import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseSummaryBullets } from './summaryBullets';

describe('parseSummaryBullets', () => {
  it('splits newline-separated lines', () => {
    assert.deepEqual(parseSummaryBullets('First point.\nSecond point.'), [
      'First point.',
      'Second point.',
    ]);
  });

  it('splits sentences in a paragraph', () => {
    assert.deepEqual(parseSummaryBullets('One sentence. Two sentence. Three sentence.'), [
      'One sentence.',
      'Two sentence.',
      'Three sentence.',
    ]);
  });

  it('returns a single item when only one sentence', () => {
    assert.deepEqual(parseSummaryBullets('Only one thought here.'), ['Only one thought here.']);
  });
});
