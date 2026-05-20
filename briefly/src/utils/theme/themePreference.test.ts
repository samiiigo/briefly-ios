import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveColorScheme,
  themePreferenceTitle,
} from './themePreference';

describe('themePreference', () => {
  it('resolves explicit preferences', () => {
    assert.equal(resolveColorScheme('dark', 'light'), 'dark');
    assert.equal(resolveColorScheme('light', 'dark'), 'light');
  });

  it('follows the system when preference is system', () => {
    assert.equal(resolveColorScheme('system', 'light'), 'light');
    assert.equal(resolveColorScheme('system', 'dark'), 'dark');
    assert.equal(resolveColorScheme('system', null), 'dark');
  });

  it('labels options for settings', () => {
    assert.equal(themePreferenceTitle('system'), 'System');
    assert.equal(themePreferenceTitle('light'), 'Light');
    assert.equal(themePreferenceTitle('dark'), 'Dark');
  });
});
