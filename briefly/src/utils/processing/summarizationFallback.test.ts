import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getNextSummarizationFallback } from './summarizationFallback';
describe('getNextSummarizationFallback', () => {
  it('offers default cloud after custom API key fails', () => {
    const next = getNextSummarizationFallback('cloud-user-key', ['cloud-user-key']);
    assert.equal(next?.mode, 'cloud-shared-openrouter');
    assert.equal(next?.buttonLabel, 'Try cloud summarization');
  });
  it('offers on-device after default cloud fails', () => {
    const next = getNextSummarizationFallback('cloud-shared-openrouter', [
      'cloud-user-key',
      'cloud-shared-openrouter',
    ]);
    assert.equal(next?.mode, 'on-device');
    assert.equal(next?.buttonLabel, 'Try local summarization');
  });
  it('offers on-device when default cloud was the first attempt', () => {
    const next = getNextSummarizationFallback('cloud-shared-openrouter', [
      'cloud-shared-openrouter',
    ]);
    assert.equal(next?.mode, 'on-device');
  });
  it('returns null when on-device already failed', () => {
    const next = getNextSummarizationFallback('on-device', [
      'cloud-user-key',
      'cloud-shared-openrouter',
      'on-device',
    ]);
    assert.equal(next, null);
  });
});
