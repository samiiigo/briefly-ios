import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  validateFolderName,
  validateRecordingUpdates,
  validateSearchQuery,
} from './inputSchemas';
import { ValidationError } from './schema';
describe('inputSchemas', () => {
  it('validates folder names', () => {
    assert.equal(validateFolderName('  Design  '), 'Design');
    assert.throws(() => validateFolderName(''), ValidationError);
  });
  it('rejects unknown recording patch keys', () => {
    assert.throws(
      () => validateRecordingUpdates({ hackerField: 'x' }),
      ValidationError
    );
  });
  it('validates search queries', () => {
    assert.equal(validateSearchQuery('  notes '), 'notes');
  });
});
