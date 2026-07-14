# apps/studio

Next.js 16 CMS application for building and managing Isomer government websites.

## Architecture

Full-stack Next.js app using tRPC for type-safe client-server communication, Prisma + Kysely for database access, and Chakra UI + Tailwind for styling.

```
src/
  pages/          - Next.js pages and API routes
  server/         - tRPC routers, services, middleware (backend)
  features/       - Feature modules (auth, dashboard, editing, etc.)
  components/     - Shared React components
  hooks/          - Custom React hooks
  schemas/        - Zod validation schemas
  lib/            - Utility libraries
  contexts/       - React Context providers
  theme/          - Chakra UI theme overrides
  env.mjs         - Environment variable validation (Zod, checked at startup)
```

## tRPC Router Structure

Routers live in `src/server/modules/`. Each module follows the pattern `*.router.ts` (route definitions) + `*.service.ts` (business logic) + `*.select.ts` (DB selection helpers).

Top-level routes in `src/server/modules/_app.ts`:

- `healthcheck`, `me`, `auth`, `asset`, `page`, `folder`, `collection`, `gazette`, `site`, `resource`, `user`, `whitelist`, `webhook`

Three procedure types defined in `src/server/trpc.ts`:

- `publicProcedure` — no auth required
- `protectedProcedure` — requires valid session + existing user
- `webhookProcedure` — API key auth (for CodeBuild webhooks)

tRPC context (`src/server/context.ts`) includes: `session`, Prisma client, Kysely `db`, GrowthBook feature flags.

## Database

**Schema**: `prisma/schema.prisma` (PostgreSQL via Neon)

Core models:

| Model                | Purpose                                                                      |
| -------------------- | ---------------------------------------------------------------------------- |
| `Resource`           | All site content — pages, folders, collections. Hierarchical via `parentId`. |
| `Blob`               | JSON content storage (draft blobs)                                           |
| `Version`            | Published snapshots of a resource (immutable)                                |
| `Site`               | Website config and theme (stored as JSON)                                    |
| `User`               | Accounts — soft-deleted via `deletedAt`                                      |
| `ResourcePermission` | CASL-based RBAC: Admin / Editor / Publisher roles                            |
| `IsomerAdmin`        | Platform-level admins with expiry                                            |
| `AuditLog`           | Append-only audit trail with before/after deltas                             |
| `CodeBuildJobs`      | Build/deploy job tracking                                                    |

**Draft-publish model**: A `Resource` has a draft `Blob` for in-progress edits. Publishing creates a new `Version` pointing to a frozen `Blob`.

**Two DB clients in use:**

- `prisma` — general CRUD, relationships
- `kysely` — complex/raw queries requiring type-safe SQL

Prisma client is generated with the `prisma-json-types-generator` to get typed JSON fields.

## Authentication

Two sign-in methods:

1. **Email OTP** — Postman sends a one-time code; `VerificationToken` tracks attempts/expiry
2. **Singpass** — OpenID Connect via `openid-client`

Sessions use `iron-session` (1-hour TTL, stored in encrypted cookie).

## Permissions

Authorization uses CASL (`@casl/ability`). Logic lives in `src/server/modules/permissions/` and `src/features/permissions/`. Roles are site-scoped (Admin / Editor / Publisher) stored in `ResourcePermission`. Platform-level access is via `IsomerAdmin`.

## Content Validation

Page/component JSON is validated against `@opengovsg/isomer-components` schemas using AJV (not Zod) for performance. Schema is imported from the components package and compiled at startup.

## Key Features

- **Editing**: Tiptap rich-text editor + JSON Forms for structured content
- **File uploads**: Signed S3/Cloudflare R2 URLs via `asset` router
- **Scheduled publishing**: Cron jobs poll `Resource.scheduledAt`
- **Feature flags**: GrowthBook SDK, keyed per-request in tRPC context
- **Drag & drop**: Pragmatic DnD + Hello Pangea DnD for reordering
- **Full-text search**: GIN trigram index on `Resource.title`
- **Optimistic locking**: Checksum-based concurrent update detection

## Prerequisites

Isomer needs a few environment variables to be set for it to function. These include:

| Name              | What It Is                                                                                                                   | Example                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`    | The connection string for your database. This should have been obtained from Neon                                            | postgresql://user:pass@xyz.ap-southeast-1.aws.neon.tech/app?sslmode=require |
| `POSTMAN_API_KEY` | An API key to send email via Postman                                                                                         | asdfn_v1_6DBRljleevjsd9DHPThsKDVDSenssCwW9zfA8W2ddf/T                       |
| `SESSION_SECRET`  | A sequence of random characters used to protect session identifiers, generated by running `pnpm dlx uuid` from your terminal | 66a21b98-fb17-4259-ac4f-e94d303ac894                                        |

Client-side vars use `NEXT_PUBLIC_` prefix and must be declared in `src/env.mjs`.

Copy `.env.example` → `.env` and fill from 1Password ("Isomer Next").

## Running the app locally

### Install dependencies

```bash
pnpm install
```

### Set environment variables

```bash
cp .env.example .env.development.local
```

Optionally set `POSTMAN_API_KEY` to send login OTP emails via [Postman](https://postman.gov.sg).
If not set, OTP emails will be logged to the console instead.

When adding client-only environment variables in Next.js, prefix with `NEXT_PUBLIC_` and explicitly reference the variable in [src/env.mjs](src/env.mjs) so Next.js bundles it into the client.

### Start database

```bash
# Assumes that you have previously copied .env.example to .env.development.local
export $(grep DATABASE_URL .env.development.local | xargs) && pnpm run setup
```

### Start server

Run from the **repo root** so Turbo generates the preview CSS before starting the dev server:

```bash
pnpm dev
```

If you must run from `apps/studio` directly, generate the preview CSS first:

```bash
pnpm build:preview-tw
pnpm run dev
```

## Testing

**Unit tests** (Vitest):

```bash
pnpm test:unit
pnpm test:watch
pnpm test:unit -- src/path/to/file.test.ts   # single file
```

- Mocks: `tests/mocks/db.ts` (Prisma mock), `tests/mocks/mockpass.ts`
- MSW handlers for tRPC in `tests/msw/`

**E2E tests** (Playwright):

```bash
pnpm setup:test                                           # start Docker services first
pnpm test:e2e
pnpm exec playwright test tests/e2e/specific.spec.ts      # single test
```

- Requires `pnpm setup:test` (containerized PostgreSQL + MockPass)
- Videos recorded; timeout 35s per test
- Base URL via `PLAYWRIGHT_TEST_BASE_URL`

## Commands

```bash
pnpm run build      # runs `prisma generate` + `prisma migrate` + `next build`
pnpm run db:reset   # resets local db
pnpm run dev        # starts next.js
pnpm run setup      # starts postgres db + runs migrations + seed
pnpm run test:unit  # runs normal Vitest unit tests
pnpm run test:e2e   # runs e2e tests
```

## Developer runbook (current behavior)

This section documents the current behavior of Studio's frequently touched backend workflows.
When changing these flows, update this section in the same PR.

### Permissions model (site-wide today)

Codepaths:

- `src/server/modules/permissions/permissions.service.ts`
- `src/server/modules/permissions/permissions.util.ts`

Current permission checks are **site-wide** (`resourceId: null`) for most flows.
If a user has multiple roles for the same site, abilities are combined (union of allowed actions).

Role behavior:

- `Editor`: full CRUD + `move` on non-root resources (`parentId != null`), `read` + `update` on root resources (`parentId == null`)
- `Publisher`: `Editor` permissions + `publish`
- `Admin`: all resource actions + full site CRUD

User-management behavior:

- Any existing role can `read` user permissions list
- Only `Admin` can `manage` user permissions
