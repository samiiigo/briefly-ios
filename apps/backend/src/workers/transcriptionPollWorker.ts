/**
 * Polls AssemblyAI (or proxy) transcription jobs via Supabase edge functions.
 *
 * Typical flow:
 * 1. Client calls `transcription-create-job` edge function
 * 2. Worker polls `transcription-job-status` until completed or failed
 * 3. Result is written back to account_recordings / local store
 */
export class TranscriptionPollWorker {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  /** Start background polling loop (no-op skeleton). */
  start(intervalMs = 5000): void {
    if (this.running) return;
    this.running = true;
    this.timer = setInterval(() => {
      // Future: dequeue pending job ids and call pollJob for each.
    }, intervalMs);
  }

  /** Stop background polling loop. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
  }

  /**
   * Poll a single transcription job by id.
   * Implementation should call the `transcription-job-status` edge function.
   */
  async pollJob(
    jobId: string,
  ): Promise<{ status: 'queued' | 'processing' | 'completed' | 'error'; jobId: string }> {
    void jobId;
    return { status: 'queued', jobId };
  }
}
