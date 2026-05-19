import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildGemmaSummarizationPrompt, ON_DEVICE_SUMMARIZATION_SYSTEM } from './gemmaPrompt';

describe('buildGemmaSummarizationPrompt', () => {
  it('uses Gemma turn markers and includes the transcript', () => {
    const prompt = buildGemmaSummarizationPrompt('Hello team, we decided to ship Friday.');
    assert.match(prompt, /<start_of_turn>user/);
    assert.match(prompt, /<end_of_turn>/);
    assert.match(prompt, /<start_of_turn>model/);
    assert.match(prompt, /Hello team, we decided to ship Friday\./);
  });

  it('requires titles without emojis in system instructions', () => {
    assert.match(ON_DEVICE_SUMMARIZATION_SYSTEM, /title.*MUST NOT contain any emoji/i);
  });
});
