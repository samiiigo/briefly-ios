import { ProcessingMode } from '@/types';
import { getProcessingSettingsReader } from '@/services/settings/processingSettingsReaderRegistry';
export interface SummarizationModeReader {
  getSummarizationMode(): ProcessingMode;
}
export class StoreBackedSummarizationModeReader implements SummarizationModeReader {
  getSummarizationMode(): ProcessingMode {
    return getProcessingSettingsReader().getSummarizationMode();
  }
}
