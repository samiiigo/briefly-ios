import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  commitRecentSearchList,
  isStrictPrefixOf,
  normalizeRecentSearchQuery,
  sanitizeRecentSearchList,
} from './recentSearchPersistence';

describe('recent search persistence', () => {
  it('rejects empty and whitespace-only input', () => {
    assert.equal(normalizeRecentSearchQuery(''), null);
    assert.equal(normalizeRecentSearchQuery('   '), null);
    assert.equal(normalizeRecentSearchQuery('  hello  '), 'hello');
  });

  it('moves an existing term to the top without duplicates', () => {
    const next = commitRecentSearchList(['beta', 'Alpha'], 'alpha');
    assert.deepEqual(next, ['alpha', 'beta']);
  });

  it('removes prefix fragments when committing the full term', () => {
    const next = commitRecentSearchList(['o', 'op', 'opt', 'other'], 'optimizing');
    assert.deepEqual(next, ['optimizing', 'other']);
  });

  it('does not add a short prefix when a longer term already exists', () => {
    const next = commitRecentSearchList(['optimizing', 'notes'], 'opt');
    assert.deepEqual(next, ['optimizing', 'notes']);
  });

  it('detects strict prefixes case-insensitively', () => {
    assert.equal(isStrictPrefixOf('Opt', 'OPTIMIZING'), true);
    assert.equal(isStrictPrefixOf('optimizing', 'OPT'), false);
  });

  it('sanitizes a cluttered persisted list', () => {
    const cleaned = sanitizeRecentSearchList(['o', 'op', 'optimizing', '  ', 'op', 'notes']);
    assert.deepEqual(cleaned, ['optimizing', 'notes']);
  });
});
