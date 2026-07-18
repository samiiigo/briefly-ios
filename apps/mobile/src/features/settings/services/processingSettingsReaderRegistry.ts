import type { ProcessingSettingsReader } from './settingsPorts';
let processingSettingsReader: ProcessingSettingsReader | undefined;
function ensureDefaultReader(): ProcessingSettingsReader {
  if (!processingSettingsReader) {
    const { StoreBackedProcessingSettingsReader } =
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- breaks circular import with settings store
      require('./settingsStoreReaders') as typeof import('./settingsStoreReaders');
    processingSettingsReader = new StoreBackedProcessingSettingsReader();
  }
  return processingSettingsReader;
}
export function getProcessingSettingsReader(): ProcessingSettingsReader {
  return ensureDefaultReader();
}
export function configureProcessingSettingsReader(reader: ProcessingSettingsReader): void {
  processingSettingsReader = reader;
}
export function resetProcessingSettingsReader(): void {
  processingSettingsReader = undefined;
}
