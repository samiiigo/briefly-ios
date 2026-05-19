import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  type DetectedCloudProvider as CloudProvider,
  detectProvider,
  providerEndpoint,
  providerLabel,
} from './providerDetection';

describe('cloud provider detection', () => {
  it('detects OpenRouter keys by prefix', () => {
    const provider = detectProvider('sk-or-abc123');
    assert.equal(provider, 'openrouter');
  });

  it('returns correct endpoint and label for OpenRouter', () => {
    const provider: CloudProvider = 'openrouter';
    assert.equal(providerEndpoint(provider), 'https://openrouter.ai/api/v1');
    assert.equal(providerLabel(provider), 'OpenRouter');
  });
});

