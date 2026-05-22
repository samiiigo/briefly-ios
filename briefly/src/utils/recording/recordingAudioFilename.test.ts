import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { recordingAudioDestName } from './recordingAudioFilename';

describe('recordingAudioDestName', () => {
  it('uses the source extension when present', () => {
    assert.equal(recordingAudioDestName('abc', 'file:///tmp/voice.m4a'), 'rec-abc.m4a');
  });

  it('defaults to wav for extensionless paths', () => {
    assert.equal(recordingAudioDestName('abc', '/tmp/recording'), 'rec-abc.wav');
  });
});
