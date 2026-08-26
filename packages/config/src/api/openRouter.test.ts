import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toOpenRouterOpenAIModelId } from './openRouterModel';
describe('toOpenRouterOpenAIModelId', () => {
  it('prefixes bare OpenAI model ids', () => {
    assert.equal(toOpenRouterOpenAIModelId('gpt-4o-mini'), 'openai/gpt-4o-mini');
  });
  it('leaves OpenRouter slugs unchanged', () => {
    assert.equal(toOpenRouterOpenAIModelId('openai/gpt-4.1-mini'), 'openai/gpt-4.1-mini');
  });
});
