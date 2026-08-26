# 004 — Isolate auth types/helpers; keep Expo flows in mobile

## Status

Accepted

## Context

Auth used Expo Apple Authentication, AuthSession redirects, and AsyncStorage-backed Supabase sessions. Web will need auth later without a major refactor, but cannot import Expo APIs.

## Decision

- `@briefly/auth` holds `AuthUserProfile`, session status types, and `mapUser`.
- `@briefly/api` provides a storage-injectable Supabase client factory.
- Expo-specific sign-in (Apple, Google OAuth browser, email OTP redirect) stays in `apps/mobile`.
- Web will add its own adapters later using the same packages.

## Consequences

- No premature abstraction over every OAuth provider UI.
- Shared identity model across apps.
- Future providers (magic links, additional OAuth) extend adapters without moving feature screens into packages.
