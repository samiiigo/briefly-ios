import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { patchWavHeader, wavHeaderNeedsRepair } from './repairWavHeaderCore';
import { WAV_HEADER_BYTES } from './repairWavHeaderCore';

function makeWavHeader(dataSize: number): Uint8Array {
  const fileSize = WAV_HEADER_BYTES + dataSize;
  const bytes = new Uint8Array(WAV_HEADER_BYTES);
  const view = new DataView(bytes.buffer);
  bytes.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  view.setUint32(4, fileSize - 8, true);
  bytes.set([0x57, 0x41, 0x56, 0x45], 8); // WAVE
  bytes.set([0x64, 0x61, 0x74, 0x61], 36); // data
  view.setUint32(40, dataSize, true);
  return bytes;
}

describe('repairWavForUpload', () => {
  it('detects when declared data size is smaller than file', () => {
    const header = makeWavHeader(500);
    const fileSize = 1_000_000;
    assert.equal(wavHeaderNeedsRepair(header, fileSize), true);
  });

  it('does not repair when header matches file size', () => {
    const dataSize = 320_000;
    const header = makeWavHeader(dataSize);
    const fileSize = WAV_HEADER_BYTES + dataSize;
    assert.equal(wavHeaderNeedsRepair(header, fileSize), false);
  });

  it('patches RIFF and data chunk sizes', () => {
    const header = makeWavHeader(500);
    const fileSize = 1_000_000;
    patchWavHeader(header, fileSize);
    const view = new DataView(header.buffer);
    assert.equal(view.getUint32(4, true), fileSize - 8);
    assert.equal(view.getUint32(40, true), fileSize - WAV_HEADER_BYTES);
  });
});
