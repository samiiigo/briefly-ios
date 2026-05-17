import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isNetworkRelatedError,
  isShortOrEmptyRecordingError,
  shouldSkipAudioFallback,
  toUserFacingProcessingError,
} from './processingErrors';

describe('processingErrors', () => {
  it('detects short recording errors', () => {
    assert.equal(isShortOrEmptyRecordingError(new Error('Recording is too short')), true);
    assert.equal(shouldSkipAudioFallback(new Error('Audio file not found')), true);
  });

  it('detects network errors', () => {
    assert.equal(isNetworkRelatedError(new Error('AssemblyAI upload failed: 503')), true);
    assert.equal(isNetworkRelatedError(new Error('AssemblyAI transcript job timed out')), true);
  });

  it('maps network errors to friendly copy', () => {
    const err = toUserFacingProcessingError(new Error('fetch failed'));
    assert.match(err.message, /connection|internet/i);
  });
});
