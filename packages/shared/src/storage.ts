import type {Transcript} from './models';

export interface StorageAdapter {
  loadTranscripts: () => Promise<Transcript[]>;
  saveTranscripts: (transcripts: Transcript[]) => Promise<void>;
}

export function createInMemoryStorage(initial: Transcript[] = []): StorageAdapter {
  let current = initial;

  return {
    async loadTranscripts() {
      return current;
    },
    async saveTranscripts(transcripts: Transcript[]) {
      current = transcripts;
    },
  };
}
