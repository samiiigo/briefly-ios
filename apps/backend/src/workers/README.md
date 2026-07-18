# Workers

Background jobs and async processing workers for the Briefly backend.

## Workers

| Worker                    | Purpose                                                                 |
| ------------------------- | ----------------------------------------------------------------------- |
| `TranscriptionPollWorker` | Poll AssemblyAI/proxy jobs via `transcription-job-status` edge function |
| `LibrarySyncWorker`       | Batch push/pull reconciliation for account library mirrors              |

Use this directory for queue consumers, scheduled tasks, and long-running
processing pipelines that should not run inside Edge Functions.

## Transcription polling

```ts
import { TranscriptionPollWorker } from '@briefly/backend';

const worker = new TranscriptionPollWorker();
worker.start(5000);

// Later: worker.pollJob('job_abc123') calls edge function status endpoint
worker.stop();
```

## Library sync

```ts
import { LibrarySyncWorker } from '@briefly/backend';

const sync = new LibrarySyncWorker();
sync.start();
await sync.pushBatch({ recordings, folders });
const remote = await sync.pullBatch(userId);
sync.stop();
```
