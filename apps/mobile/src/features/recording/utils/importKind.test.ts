import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  detectImportKind,
  extensionFromFilename,
  titleFromImportFilename,
} from './importKind';
describe('importKind', () => {
  it('detects JSON backups', () => {
    assert.equal(
      detectImportKind({ name: 'briefly-transcripts-2026-05-20.json', mimeType: null }),
      'json-backup',
    );
  });
  it('detects common audio formats', () => {
    assert.equal(detectImportKind({ name: 'meeting.m4a', mimeType: null }), 'audio');
    assert.equal(detectImportKind({ name: 'voice.wav', mimeType: 'audio/wav' }), 'audio');
  });
  it('rejects unknown types', () => {
    assert.equal(detectImportKind({ name: 'notes.txt', mimeType: 'text/plain' }), null);
  });
  it('derives titles from filenames', () => {
    assert.equal(extensionFromFilename('clip.M4A'), '.m4a');
    assert.equal(titleFromImportFilename('Team Sync.m4a'), 'Team Sync');
  });
});
