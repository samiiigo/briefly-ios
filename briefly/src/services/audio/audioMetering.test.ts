import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDbMetering, pcmBufferToLevel } from './audioMetering';
describe('normalizeDbMetering', () => {
  it('maps floor dB to 0 and 0 dB to 1 (clamped)', () => {
    assert.equal(normalizeDbMetering(-50), 0);
    assert.equal(normalizeDbMetering(0), 1);
  });
  it('clamps out-of-range values', () => {
    assert.equal(normalizeDbMetering(-120), 0);
    assert.equal(normalizeDbMetering(10), 1);
  });
  it('boosts typical speech levels more than a wide -60 dB span', () => {
    const atMinus30 = normalizeDbMetering(-30);
    const wideSpan = (-30 + 60) / 60;
    assert.ok(atMinus30 > wideSpan);
  });
});
describe('pcmBufferToLevel', () => {
  it('returns 0 for empty buffer', () => {
    assert.equal(pcmBufferToLevel(new ArrayBuffer(0)), 0);
  });
  it('returns higher level for louder PCM', () => {
    const quiet = new Int16Array(256);
    const loud = new Int16Array(256);
    loud.fill(12000);
    assert.ok(pcmBufferToLevel(loud.buffer) > pcmBufferToLevel(quiet.buffer));
  });
});
