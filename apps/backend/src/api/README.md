# API layer

HTTP handlers and route definitions for the Briefly backend.

## Structure

- `http.ts` — `ApiRequest`, `ApiResponse`, and `jsonResponse()` helper
- `routes/health.ts` — health check handler
- `routes/library.ts` — Supabase-backed library handlers (`listRecordings`, `listFolders`, `getSettings`)
- `index.ts` — `createBrieflyApi()` factory

Edge Functions live under `supabase/functions/`. This directory holds shared,
framework-agnostic handlers that can be mounted in a Node HTTP server later.

## Mounting in Hono (later)

```ts
import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { createBrieflyApi } from '@briefly/backend';

const api = createBrieflyApi();
const app = new Hono();

app.get('/health', async (c) => {
  const res = await api.health.check({
    method: 'GET',
    path: '/health',
    headers: Object.fromEntries(c.req.raw.headers),
  });
  return c.json(res.body, res.status);
});

app.get('/library/recordings', async (c) => {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: c.req.header('Authorization') ?? '' } },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const recordings = await api.library.listRecordings(supabase, user.id);
  return c.json(recordings);
});
```

Handlers accept a `SupabaseClient` and `userId` so auth middleware can stay thin.
