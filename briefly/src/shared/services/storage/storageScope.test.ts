import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { scopedStorageKey } from './storageScope';

describe('storageScope', () => {
  it('scopes keys to the active user id', () => {
    assert.equal(scopedStorageKey('@briefly/recordings', 'user-a'), '@briefly/recordings:user-a');
    assert.equal(scopedStorageKey('@briefly/settings', 'user-b'), '@briefly/settings:user-b');
  });

  it('throws when user id is missing', () => {
    assert.throws(() => scopedStorageKey('@briefly/recordings', null), /Storage scope user id/);
  });
});
