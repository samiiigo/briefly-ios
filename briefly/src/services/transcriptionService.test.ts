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

  it('maps legacy on-device-first to on-device', () => {
    assert.equal(resolveTranscriptionRoute('on-device-first' as any), 'on-device');
  });
});
