import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeFileUri } from './normalizeFileUri';
describe('normalizeFileUri', () => {
  it('prefixes absolute paths with file://', () => {
    assert.equal(normalizeFileUri('/var/mobile/recording.wav'), 'file:///var/mobile/recording.wav');
  });
  it('leaves file:// URIs unchanged', () => {
    const uri = 'file:///data/user/0/com.briefly.app/recording.wav';
    assert.equal(normalizeFileUri(uri), uri);
  });
});
