import type { Recording, UserFolder } from '@briefly/types';

export interface LibrarySyncBatch {
  recordings: Recording[];
  folders: UserFolder[];
}

export interface LibrarySyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
}

/**
 * Skeleton for batch push/pull reconciliation between local storage
 * and account_recordings / account_folders mirrors.
 */
export class LibrarySyncWorker {
  private running = false;

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  /** Push local changes upstream (placeholder). */
  async pushBatch(_batch: LibrarySyncBatch): Promise<LibrarySyncResult> {
    return { pushed: 0, pulled: 0, conflicts: 0 };
  }

  /** Pull remote changes and merge by updatedAt (placeholder). */
  async pullBatch(_userId: string): Promise<LibrarySyncBatch> {
    return { recordings: [], folders: [] };
  }
}
