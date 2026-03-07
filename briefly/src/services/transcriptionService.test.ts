import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveTranscriptionRoute } from './transcriptionRouting';

describe('transcription route resolution', () => {
  it('maps on-device mode directly', () => {
    assert.equal(resolveTranscriptionRoute('on-device'), 'on-device');
  });

  it('maps cloud mode directly', () => {
    assert.equal(resolveTranscriptionRoute('cloud'), 'cloud');
  });

  it('maps on-device-first mode to fallback route', () => {
    assert.equal(resolveTranscriptionRoute('on-device-first'), 'on-device-first');
  });
});
