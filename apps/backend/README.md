# @briefly/backend

Scaffold for future API, workers, and services.

```text
apps/backend/
  api/        # HTTP API entrypoints (future)
  workers/    # Background jobs (future)
  services/   # Domain services (future)
```

## Notes

- Supabase Edge Functions currently live in [`apps/mobile/supabase/`](../mobile/supabase/) and remain the production backend until consolidation.
- Prefer shared packages (`@briefly/types`, `@briefly/validation`, `@briefly/auth`, `@briefly/utils`) when implementing server code.
- Do not over-engineer this scaffold until a concrete service is needed.
