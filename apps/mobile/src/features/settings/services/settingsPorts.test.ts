import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ProcessingSettingsReader } from './settingsPorts';
import {
  configureProcessingSettingsReader,
  getProcessingSettingsReader,
  resetProcessingSettingsReader,
} from './processingSettingsReaderRegistry';
describe('processing settings reader', () => {
  it('uses configured in-memory reader', () => {
    const reader: ProcessingSettingsReader = {
      getSummarizationMode: () => 'on-device',
      getTranscriptionMode: () => 'local',
      getShowLivePreview: () => false,
    };
    configureProcessingSettingsReader(reader);
    assert.equal(getProcessingSettingsReader().getSummarizationMode(), 'on-device');
    assert.equal(getProcessingSettingsReader().getTranscriptionMode(), 'local');
    assert.equal(getProcessingSettingsReader().getShowLivePreview(), false);
    resetProcessingSettingsReader();
  });
});
