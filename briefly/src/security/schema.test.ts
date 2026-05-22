import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ValidationError, validateObject } from './schema';
describe('schema validation', () => {
  it('rejects unexpected object keys in strict mode', () => {
    assert.throws(
      () =>
        validateObject(
          { name: 'Notes', extra: true },
          {
            type: 'object',
            strict: true,
            fields: {
              name: { type: 'string', minLength: 1, maxLength: 80 },
            },
          }
        ),
      ValidationError
    );
  });
  it('trims and validates string length', () => {
    const result = validateObject<{ name: string }>(
      { name: '  hello  ' },
      {
        type: 'object',
        strict: true,
        fields: {
          name: { type: 'string', minLength: 1, maxLength: 80, trim: true },
        },
      }
    );
    assert.equal(result.name, 'hello');
  });
});
