import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapLlamaNativeError } from './localLlamaErrors';
describe('mapLlamaNativeError', () => {
  it('maps allocation failures to oom', () => {
    const err = mapLlamaNativeError(new Error('ggml_alloc: failed to allocate buffer'));
    assert.equal(err.code, 'oom');
    assert.match(err.message, /memory/i);
  });
  it('maps missing model paths to device', () => {
    const err = mapLlamaNativeError(new Error('unable to load model: no such file'));
    assert.equal(err.code, 'device');
  });
  it('maps missing RNLlama native module to unsupported_runtime', () => {
    const err = mapLlamaNativeError(new Error("Cannot read property 'install' of null"));
    assert.equal(err.code, 'unsupported_runtime');
    assert.match(err.message, /Expo Go/i);
  });
});
