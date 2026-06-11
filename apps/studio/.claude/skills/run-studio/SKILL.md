---
name: run-studio
description: Build, run, and drive Isomer Studio (apps/studio), the Next.js CMS. Use when asked to start Studio, run the studio dev server, screenshot a Studio page, take a screenshot of the dashboard/site editor, log in as a seeded user, or interact with the running app.
---

Isomer Studio is a Next.js 15 web app (the CMS/site builder). Drive it by
starting the dev server, then driving headless Chromium via the committed
**`.claude/skills/run-studio/driver.mjs`** — it mints a session cookie for a
seeded user and screenshots authed pages (`chromium-cli` is not available
here and Playwright's browser CDN is blocked, so the driver talks to
`@playwright/test`'s chromium directly against the pre-installed binary).

All paths below are relative to `apps/studio/`. Run every command from there.

## Prerequisites

This container already has everything needed — **no `apt-get` required**:

- Node 22 + pnpm 11 (`corepack enable`).
- PostgreSQL 16 server **and** client at `/usr/lib/postgresql/16/bin` and `psql`.
- A Playwright Chromium at `/opt/pw-browsers/chromium-*/chrome-linux/chrome`
  (its system libs are already present — it launches headless as-is).

Do **not** `npx playwright install` — `cdn.playwright.dev` is blocked by the
network policy (`403 Host not in allowlist`). The driver uses the binary above.

## Setup

The project's `pnpm setup` uses `docker compose` for Postgres + mockpass, but
**Docker Hub is rate-limited here** (`pull rate limit` on `postgres:15.10` /
`opengovsg/mockpass`). So bring up a local Postgres instead and stub Singpass.

### 1. Install deps + build the workspace packages

`pnpm dev` crashes with `Cannot find module '@opengovsg/isomer-components'`
unless the packages are built first.

```bash
cd /home/user/isomer && corepack enable && pnpm install
pnpm turbo build --filter='./packages/*'   # ~20s
cd apps/studio
```

### 2. Start a local Postgres (runs as the `postgres` user — it refuses root)

```bash
PGBIN=/usr/lib/postgresql/16/bin
rm -rf /tmp/pgdata && mkdir -p /tmp/pgdata && chown postgres:postgres /tmp/pgdata
su postgres -c "$PGBIN/initdb -D /tmp/pgdata -U root --auth=trust"
su postgres -c "$PGBIN/pg_ctl -D /tmp/pgdata -o '-p 5432 -c listen_addresses=127.0.0.1 -k /tmp' -l /tmp/pg.log start"
psql -h 127.0.0.1 -p 5432 -U root -d postgres -c "create database app;"
```

### 3. Write `apps/studio/.env`

The app reads `DATABASE_URL` plus a set of validated vars (`src/env.mjs`). The
secret values below are the throwaway ones from `.env.test`:

```bash
cat > .env <<'EOF'
NODE_ENV=development
DATABASE_URL=postgres://root:root@localhost:5432/app
SESSION_SECRET=random_session_secret_that_is_at_least_32_characters
NEXT_PUBLIC_APP_NAME="Isomer Studio (LOCAL)"
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_S3_REGION=us-east-1
NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME=user-content.example.com
NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME=assets-bucket
SINGPASS_CLIENT_ID=some-client-id
SINGPASS_ISSUER_ENDPOINT=http://localhost:5156/singpass/v2
SINGPASS_ENCRYPTION_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIHuAgEAMBAGByqGSM49AgEGBSuBBAAjBIHWMIHTAgEBBEIALCx8ppZGRMYqqKRy\nU2EmAROFgICVtUs39x8ySaRgVMnaQzjJRUGQRScaO/C+uJ4J6uZhj3Qg+XK8IC9X\nO1DrreWhgYkDgYYABAAQFPoO2PgQzjo6PR9Qij/H0ALW/1U6jBVd6JGPPstlNllA\nORxoyOd0aWvAwvvlgb/CO5NwlWxQBzYTX7wR6hlySgCiZ3lI+GELUGL30nm5KvSB\ngKp+DctqxxjoEPocEBjzHDeF4b9GjOId9iQ3NgDAne0Hla2oYjQsnW5AroQmYOt2\nNg==\n-----END PRIVATE KEY-----"
SINGPASS_SIGNING_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIHuAgEAMBAGByqGSM49AgEGBSuBBAAjBIHWMIHTAgEBBEIAu1yj04lOIkR8mG2v\nORr/JX+jPfSTdjkt6zuK2Buin76oov/ieXxTVCIKCiy4sxGoJ47kFCkSqIadfRhy\nRXB6yJihgYkDgYYABAHRpf0DyBj4t3tAI6FbB3aW9xImJWjXaHWjmJEw0Nhnl3v6\nGzFV/MnM4QKUENL9eq4eqgjwXJqP5cfLSr502rGt0ACZNyBA0Hg2LmQ6GVf/8Xo3\nRbn7SiImqn1VrMmpfXmuVtM4jWR9PB7atGajzhXB/RpsE+seJP7h+vvT7oUOKUa4\njA==\n-----END PRIVATE KEY-----"
GROWTHBOOK_CLIENT_KEY=sdk-lnL5Et90CD9sC13e
NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY=sdk-lnL5Et90CD9sC13e
SEARCHSG_API_KEY=test-searchsg-api-key
EGAZETTE_DOCUMENT_INDEX="very-cool-index"
S3_GAZETTE_BUCKET_NAME="cool-bucket"
S3_GAZETTE_DOMAIN_NAME="cool-domain"
DD_DELETION_EMAIL="alerts@dd.com"
EOF
```

### 4. Generate Prisma client, migrate, seed

```bash
pnpm generate        # prisma generate + kysely types
pnpm migrate         # prisma migrate deploy → all migrations
pnpm db:seed         # creates editor@/publisher@open.gov.sg + whitelists @open.gov.sg + the "Isomer" site
```

### 5. (Optional) skip the first-login onboarding modal

The seeded users have no name/phone, so authed pages show a "Tell us about
yourself" modal over the dashboard. To land on a clean dashboard:

```bash
psql -h 127.0.0.1 -p 5432 -U root -d app \
  -c "update \"User\" set name='Editor User', phone='91234567', \"lastLoginAt\"=now() where email like '%@open.gov.sg';"
```

## Run (agent path)

### 1. Start the Singpass stub, THEN the dev server

`singpass.service.ts` does a top-level `await Issuer.discover(...)` at module
load. With nothing on :5156 the tRPC router fails to initialise and **every
authed request 500s**. `mock-singpass.mjs` answers the OIDC discovery doc.

Launch each as its **own** Bash call — do not chain with `pkill`/`sleep`/`&&`
in one command (that trips the sandbox and exits 144). Then poll in a
separate call:

```bash
# call 1 — stub (any cwd):
nohup node .claude/skills/run-studio/mock-singpass.mjs > /tmp/mock-singpass.log 2>&1 &

# call 2 — dev server:
nohup pnpm dev > /tmp/studio-dev.log 2>&1 &

# call 3 — wait for it to serve (first compile can take ~60s):
until curl -sf -o /dev/null http://localhost:3000; do sleep 3; done; echo SERVING
```

### 2. Drive it with the driver

```bash
# authed smoke: dashboard "/" + site editor "/sites/1", screenshots + console errors
node .claude/skills/run-studio/driver.mjs smoke

# single page (authed), custom output:
node .claude/skills/run-studio/driver.mjs shot /sites/1 /tmp/site.png

# unauthenticated page:
node .claude/skills/run-studio/driver.mjs shot /sign-in /tmp/signin.png --no-auth

# as a different seeded user:
node .claude/skills/run-studio/driver.mjs shot / /tmp/pub.png --user publisher@open.gov.sg
```

Screenshots default to `.claude/skills/run-studio/screenshots/` (gitignored).
The driver prints `HTTP <status> | title="…"` per nav and a console-error
summary. **Always open the PNG** — a page can show its shell while the data
fetch fails.

| command             | what it does                                                           |
| ------------------- | ---------------------------------------------------------------------- |
| `smoke`             | authed nav `/` then `/sites/1`, screenshot each, report console errors |
| `shot <path> [out]` | nav to one path (authed), screenshot to `out`                          |
| `--no-auth`         | skip the cookie + login flag (for `/sign-in`, public pages)            |
| `--user <email>`    | mint the cookie for a different seeded user                            |
| `--base <url>`      | target a different origin (default `http://localhost:3000`)            |

How auth works (both are required — see Gotchas): the driver mints an
`iron-session` cookie (`auth.session-token`) for the user's id from the DB,
**and** sets the `is-logged-in` localStorage flag the page guard checks.

## Run (human path)

`pnpm dev` then open `http://localhost:3000` in a browser. Useless headless —
there's no display, and login needs real Singpass. Use the driver instead.

## Test

```bash
pnpm test:unit   # vitest
```

⚠️ Won't run in this container: `tests/global-setup.ts` spins up **testcontainers**
for Postgres _and_ `opengovsg/mockpass`, both Docker Hub pulls that hit the
rate limit here. Lint/typecheck do work: `pnpm lint`, `pnpm typecheck`.

## Gotchas

- **Authed pages need cookie + localStorage flag.** `EnforceLoginStatePageWrapper`
  gates the UI purely on `localStorage["is-logged-in"]` (not the cookie). A
  valid session cookie alone still bounces you to `/sign-in`; a flag alone makes
  the page render but every tRPC call 401s. The driver sets both.
- **Singpass stub must be up before dev compiles the router.** If you started
  dev first (or changed the stub), the broken module is cached — kill dev,
  `rm -rf .next`, restart. The symptom is `connect ECONNREFUSED 127.0.0.1:5156`
  or `token_endpoint_auth_signing_alg_values_supported must be configured`.
- **Build packages before `pnpm dev`.** Otherwise instrumentation crashes with
  `Cannot find module '@opengovsg/isomer-components'`.
- **Don't chain a backgrounded launch with `pkill`/`sleep`/`&&`** in one Bash
  call — it exits 144 and the server never starts. One launch per call; poll in
  a separate call with an `until` loop (never a bare foreground `sleep`).
- **Postgres won't run as root** — `initdb`/`pg_ctl` must run via `su postgres`.
- **tRPC batching is off.** Hand-built API calls use `?input=…` with no
  `batch=1` (else `Batching is not enabled on the server`).

## Troubleshooting

- **`pull rate limit` on `docker compose up`**: Docker Hub is throttled. Use the
  local Postgres in Setup step 2 instead of the compose stack.
- **`403 Host not in allowlist` from `playwright install`**: the CDN is blocked.
  Use the pre-installed `/opt/pw-browsers` chromium (the driver already does).
- **`Cannot find package 'playwright-core'`**: run the driver from `apps/studio`
  (it imports `@playwright/test`, a direct dep, which re-exports `chromium`).
- **dashboard renders but the "Tell us about yourself" modal covers it**: set
  the user's name/phone (Setup step 5).
