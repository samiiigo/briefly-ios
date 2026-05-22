import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Recording } from '@/types';
import {
  buildTranscriptBackupFile,
  serializeTranscriptBackupFile,
} from '@/utils/recording/transcriptBackup';
import type { ImportRecordingPorts } from './importRecordingPorts';
import { importJsonBackupFromText } from './importJsonBackup';
function makePorts(overrides: Partial<ImportRecordingPorts> = {}): ImportRecordingPorts {
  const recordings: Recording[] = [];
  return {
    store: {
      getRecordings: () => recordings,
      importRecordings: async (incoming) => {
        recordings.push(...incoming);
      },
    },
    settings: {
      getSummarizationMode: () => 'cloud-shared-openrouter',
    },
    audio: {
      copyToDocuments: async () => '/tmp/unused',
      probeDurationSec: async () => 0,
    },
    confirmation: {
      confirmImport: async () => true,
      alert: () => {},
    },
    ...overrides,
  };
}
describe('importJsonBackupFromText', () => {
  it('imports new backup entries when user confirms', async () => {
    const ports = makePorts();
    const json = serializeTranscriptBackupFile(
      buildTranscriptBackupFile([
        {
          id: 'rec-src',
          title: 'Meeting',
          createdAt: 1000,
          duration: 60,
          filePath: '/audio/meeting.m4a',
          fileSize: 2048,
          processingMode: 'cloud',
          status: 'ready',
          transcript: [
            {
              id: 's1',
              text: 'Hello',
              startTime: 0,
              endTime: 1,
              isFinal: true,
            },
          ],
        },
      ]),
    );
    const result = await importJsonBackupFromText(json, ports);
    assert.equal(result.count, 1);
    assert.equal(result.skipped, 0);
    assert.equal(ports.store.getRecordings().length, 1);
    assert.equal(ports.store.getRecordings()[0]?.title, 'Meeting');
  });
  it('returns zero count when user cancels', async () => {
    const ports = makePorts({
      confirmation: {
        confirmImport: async () => false,
        alert: () => {},
      },
    });
    const json = serializeTranscriptBackupFile(
      buildTranscriptBackupFile([
        {
          id: 'rec-src-2',
          title: 'Solo',
          createdAt: 2000,
          duration: 30,
          filePath: '/audio/solo.m4a',
          fileSize: 1024,
          processingMode: 'cloud',
          status: 'ready',
          transcript: [
            {
              id: 's1',
              text: 'Hi',
              startTime: 0,
              endTime: 1,
              isFinal: true,
            },
          ],
        },
      ]),
    );
    const result = await importJsonBackupFromText(json, ports);
    assert.equal(result.count, 0);
    assert.equal(ports.store.getRecordings().length, 0);
  });
});
