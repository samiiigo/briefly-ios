# Services

Domain services and business logic for the Briefly backend.

## Modules

| Module                | Purpose                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `libraryService.ts`   | Dashboard stats, soft delete/restore, active recording filters     |
| `settingsService.ts`  | `defaultSettings()`, `normalizeSettingsPayload()` for account sync |
| `summarizeService.ts` | Types for the summarize edge function request/response             |

Shared service modules are used by Edge Functions, workers, and future API
layers. Keep Supabase-specific adapters thin and colocate pure logic here.

## Example

```ts
import { computeDashboardStats, filterActiveRecordings } from '@briefly/backend';

const active = filterActiveRecordings(recordings);
const stats = computeDashboardStats(recordings, folders);
```
