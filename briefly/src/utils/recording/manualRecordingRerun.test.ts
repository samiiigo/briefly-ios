import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveManualRerunSourceFromFlags } from './manualRecordingRerunSource';
describe('resolveManualRerunSourceFromFlags', () => {
  it('prefers on-disk audio when available', () => {
    assert.equal(resolveManualRerunSourceFromFlags(true, false), 'audio');
    assert.equal(resolveManualRerunSourceFromFlags(true, true), 'audio');
  });
  it('falls back to transcript summarization when audio is missing', () => {
    assert.equal(resolveManualRerunSourceFromFlags(false, true), 'transcript');
  });
  it('returns none when there is no audio or transcript', () => {
    assert.equal(resolveManualRerunSourceFromFlags(false, false), 'none');
  });
});
