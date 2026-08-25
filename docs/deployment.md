# Deployment

## Mobile (EAS)

```bash
pnpm --filter @briefly/mobile build:preview
pnpm --filter @briefly/mobile build:prod
pnpm --filter @briefly/mobile submit:prod
```

Configure public Supabase env in EAS:

```bash
pnpm --filter @briefly/mobile eas:env:supabase
```

Release checklist: `apps/mobile/docs/RELEASE_CHECKLIST.md`.

## Docker + Kubernetes (web + website)

Container images cover the two Next.js surfaces:

| Service   | Image             | Runtime                         |
| --------- | ----------------- | ------------------------------- |
| Web       | `briefly/web`     | Next.js standalone (Node 22)    |
| Website   | `briefly/website` | Static export behind nginx      |

Backend Edge Functions stay on Supabase (not containerized). Mobile ships via EAS.

### Build & run locally

```bash
cp apps/web/.env.example .env.docker
# set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

pnpm docker:up
# web      → http://localhost:3000
# website → http://localhost:3001
```

Or build images individually:

```bash
docker build -f docker/Dockerfile.web \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -t briefly/web:latest .

docker build -f docker/Dockerfile.website -t briefly/website:latest .
```

`NEXT_PUBLIC_*` values are **baked into the web image at build time**. Rebuild the image when Supabase public config changes.

### Deploy to Kubernetes

1. Push images to your registry and retag in `k8s/kustomization.yaml` (or set `images[].newName` / `newTag`).
   CI publishes to `ghcr.io/<owner>/<repo>/web` and `.../website` on `main`.
2. Create secrets:

```bash
cp k8s/secrets.example.yaml k8s/secrets.yaml
# edit values, then:
kubectl apply -f k8s/secrets.yaml
# or:
kubectl create secret generic briefly-web-env -n briefly \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL=... \
  --from-literal=NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

3. Edit hosts in `k8s/ingress.yaml` and the Supabase URL in `k8s/web-configmap.yaml`.
4. Apply:

```bash
pnpm k8s:apply
# equivalent: kubectl apply -k k8s
```

Requires an ingress controller (`ingressClassName: nginx`). Uncomment TLS + cert-manager annotations in `k8s/ingress.yaml` when ready.

Add the Supabase Auth redirect URL for the web host: `https://<web-domain>/auth/callback`.

## Marketing + Web (Vercel)

### Marketing (`apps/website`) — default Git-connected project

The repo-root [`vercel.json`](../vercel.json) installs with pnpm and statically exports the marketing site to `apps/website/out`. This restores a green deploy without changing the Vercel Root Directory.

```bash
pnpm --filter @briefly/website build
```

### Authenticated web (`apps/web`)

Create a **separate** Vercel project with Root Directory `apps/web` (Node runtime required for middleware). Set:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Enable the Supabase Auth redirect URL: `https://<web-domain>/auth/callback`.

Docker/Kubernetes is the recommended path when you need cluster-native deploy; Vercel remains supported for the same apps.

## Backend (Supabase)

Edge Functions and migrations live in `apps/backend/supabase`.

```bash
pnpm --filter @briefly/backend supabase:deploy
```

Requires `SUPABASE_DB_PASSWORD` / `SUPABASE_ACCESS_TOKEN` and server secrets `ASSEMBLYAI_API_KEY`, `OPENROUTER_SHARED_API_KEY`.

## Future backend HTTP

`apps/backend/src/{api,workers,services}` is reserved for a Node API server (Hono/Nest/Fastify) and workers. Add `docker/Dockerfile.api` + `k8s/api.yaml` when that server exists.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs:

```bash
pnpm install --frozen-lockfile
pnpm turbo run typecheck lint test
```

Image builds (`.github/workflows/docker.yml`) publish `web` / `website` images to GHCR on `main`. Set repository secrets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` so the web image builds with the correct public config.
