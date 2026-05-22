import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildGemmaSummarizationMessages,
  buildGemmaSummarizationPrompt,
  GEMMA4_TURN_SUFFIX,
  ON_DEVICE_SUMMARIZATION_SYSTEM,
} from './gemmaPrompt';
describe('buildGemmaSummarizationPrompt', () => {
  it('uses Gemma 4 <|turn>role markers and turn suffix', () => {
    const prompt = buildGemmaSummarizationPrompt('Hello team, we decided to ship Friday.');
    assert.match(prompt, /<\|turn>system\n/);
    assert.match(prompt, /<\|turn>user\n/);
    assert.match(prompt, /<\|turn>model\n/);
    assert.ok(prompt.includes(GEMMA4_TURN_SUFFIX));
    assert.doesNotMatch(prompt, /<start_of_turn>/);
    assert.match(prompt, /Hello team, we decided to ship Friday\./);
  });
  it('requires titles without emojis in system instructions', () => {
    assert.match(ON_DEVICE_SUMMARIZATION_SYSTEM, /title.*MUST NOT contain any emoji/i);
  });
});
describe('buildGemmaSummarizationMessages', () => {
  it('provides system and user roles for Jinja chat template', () => {
    const messages = buildGemmaSummarizationMessages('Budget review at 3pm.');
    assert.equal(messages.length, 2);
    assert.equal(messages[0].role, 'system');
    assert.equal(messages[1].role, 'user');
    assert.match(messages[1].content, /Budget review at 3pm\./);
  });
});
