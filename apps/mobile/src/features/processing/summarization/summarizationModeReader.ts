import { ProcessingMode } from '@briefly/types';
import { getProcessingSettingsReader } from '@/features/settings/services/processingSettingsReaderRegistry';
export interface SummarizationModeReader {
  getSummarizationMode(): ProcessingMode;
}
export class StoreBackedSummarizationModeReader implements SummarizationModeReader {
  getSummarizationMode(): ProcessingMode {
    return getProcessingSettingsReader().getSummarizationMode();
  }
}
