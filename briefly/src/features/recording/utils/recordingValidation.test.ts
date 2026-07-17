import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  hasMeaningfulTranscript,
  hasRecordingAudio,
  isRecordingTooShort,
  validateRecordingAsset,
} from './recordingValidation';
describe('recordingValidation', () => {
  it('treats whitespace-only segments as empty', () => {
    assert.equal(
      hasMeaningfulTranscript([{ id: '1', text: '   ', startTime: 0, endTime: 1, isFinal: true }]),
      false,
    );
  });
  it('detects short recordings', () => {
    assert.equal(isRecordingTooShort({ durationSec: 0.2, filePath: 'a.wav', fileSizeBytes: 100 }), true);
    assert.equal(
      isRecordingTooShort({ durationSec: 9, filePath: 'a.wav', fileSizeBytes: 50_000 }),
      true,
    );
    assert.equal(
      isRecordingTooShort({ durationSec: 10, filePath: 'a.wav', fileSizeBytes: 50_000 }),
      false,
    );
  });
  it('throws when file path is missing', () => {
    assert.throws(
      () => validateRecordingAsset({ durationSec: 5, filePath: '', fileSizeBytes: 50_000 }),
      /No audio file/,
    );
  });
  it('detects transcript-only imports without audio', () => {
    assert.equal(hasRecordingAudio('', 0), false);
    assert.equal(hasRecordingAudio('  ', 1000), false);
    assert.equal(hasRecordingAudio('/audio/rec.m4a', 0), false);
    assert.equal(hasRecordingAudio('/audio/rec.m4a', 1200), true);
  });
});
